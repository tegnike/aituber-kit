import { createHash, randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import type {
  PresentationAssignment,
  PresentationManifestV1,
} from './presentationTypes'
import {
  PRESENTATION_ID_PATTERN,
  validateExternalPresentation,
} from './presentationSchema'

interface PresentationMetadata {
  presentationId: string
  revision: number
  contentHash: string
  updatedAt: string
}

export class PresentationRepositoryError extends Error {
  constructor(
    public readonly code:
      | 'VALIDATION_ERROR'
      | 'PRESENTATION_NOT_FOUND'
      | 'REVISION_CONFLICT'
      | 'STALE_REVISION'
      | 'REVISION_MISMATCH'
      | 'PRESENTATION_STORAGE_UNAVAILABLE'
      | 'PRESENTATION_LOAD_FAILED',
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PresentationRepositoryError'
  }
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    )
  }
  return value
}

export const createPresentationContentHash = (
  manifest: PresentationManifestV1
) => {
  const canonicalJson = JSON.stringify(canonicalize(manifest))
  return `sha256:${createHash('sha256').update(canonicalJson).digest('hex')}`
}

const getStorageRoot = () =>
  path.resolve(
    process.env.AITUBERKIT_PRESENTATION_STORAGE_DIR ||
      path.join(process.cwd(), '.aituber-kit', 'presentations')
  )

const assertPresentationId = (presentationId: string) => {
  if (!PRESENTATION_ID_PATTERN.test(presentationId)) {
    throw new PresentationRepositoryError(
      'VALIDATION_ERROR',
      422,
      'Presentation ID is invalid'
    )
  }
}

const getPaths = (presentationId: string) => {
  assertPresentationId(presentationId)
  const root = getStorageRoot()
  return {
    root,
    manifest: path.join(root, 'manifests', `${presentationId}.json`),
    metadata: path.join(root, 'metadata', `${presentationId}.json`),
  }
}

const getAssignmentPath = (clientId: string) => {
  const hash = createHash('sha256').update(clientId).digest('hex')
  return path.join(getStorageRoot(), 'assignments', `${hash}.json`)
}

const isMissingFile = (error: unknown) =>
  Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ENOENT'
  )

const toStorageError = (error: unknown) => {
  if (error instanceof PresentationRepositoryError) return error
  return new PresentationRepositoryError(
    'PRESENTATION_STORAGE_UNAVAILABLE',
    503,
    'Presentation storage is unavailable'
  )
}

const writeJsonAtomic = async (filePath: string, value: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    })
    await fs.rename(temporaryPath, filePath)
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {})
    throw error
  }
}

const readJson = async (filePath: string): Promise<unknown> =>
  JSON.parse(await fs.readFile(filePath, 'utf8'))

export const readPresentation = async (
  presentationId: string,
  revision?: number
) => {
  const paths = getPaths(presentationId)
  try {
    const [rawManifest, rawMetadata] = await Promise.all([
      readJson(paths.manifest),
      readJson(paths.metadata),
    ])
    const validation = validateExternalPresentation(rawManifest)
    if (
      !validation.ok ||
      validation.manifest.presentationId !== presentationId
    ) {
      throw new PresentationRepositoryError(
        'PRESENTATION_LOAD_FAILED',
        500,
        'Stored presentation failed validation'
      )
    }
    const metadata = rawMetadata as PresentationMetadata
    const actualHash = createPresentationContentHash(validation.manifest)
    if (
      metadata.presentationId !== presentationId ||
      metadata.revision !== validation.manifest.revision ||
      metadata.contentHash !== actualHash
    ) {
      throw new PresentationRepositoryError(
        'PRESENTATION_LOAD_FAILED',
        500,
        'Stored presentation metadata is inconsistent'
      )
    }
    if (revision !== undefined && revision !== validation.manifest.revision) {
      throw new PresentationRepositoryError(
        'REVISION_MISMATCH',
        409,
        'Presentation revision does not match',
        {
          presentationId,
          storedRevision: validation.manifest.revision,
          requestedRevision: revision,
        }
      )
    }
    return { manifest: validation.manifest, metadata }
  } catch (error) {
    if (isMissingFile(error)) {
      throw new PresentationRepositoryError(
        'PRESENTATION_NOT_FOUND',
        404,
        'Presentation was not found',
        { presentationId }
      )
    }
    if (error instanceof PresentationRepositoryError) throw error
    if (error instanceof SyntaxError) {
      throw new PresentationRepositoryError(
        'PRESENTATION_LOAD_FAILED',
        500,
        'Stored presentation could not be loaded'
      )
    }
    throw toStorageError(error)
  }
}

export const savePresentation = async (value: unknown) => {
  const validation = validateExternalPresentation(value)
  if (!validation.ok) {
    throw new PresentationRepositoryError(
      'VALIDATION_ERROR',
      422,
      'Presentation manifest is invalid',
      { issues: validation.issues }
    )
  }

  const manifest = validation.manifest
  const paths = getPaths(manifest.presentationId)
  const contentHash = createPresentationContentHash(manifest)
  let existing: Awaited<ReturnType<typeof readPresentation>> | null = null
  try {
    existing = await readPresentation(manifest.presentationId)
  } catch (error) {
    if (
      !(error instanceof PresentationRepositoryError) ||
      error.code !== 'PRESENTATION_NOT_FOUND'
    ) {
      throw error
    }
  }

  if (existing) {
    if (manifest.revision < existing.manifest.revision) {
      throw new PresentationRepositoryError(
        'STALE_REVISION',
        409,
        'Presentation revision is stale',
        {
          presentationId: manifest.presentationId,
          storedRevision: existing.manifest.revision,
          requestedRevision: manifest.revision,
        }
      )
    }
    if (manifest.revision === existing.manifest.revision) {
      if (contentHash !== existing.metadata.contentHash) {
        throw new PresentationRepositoryError(
          'REVISION_CONFLICT',
          409,
          'Presentation revision conflicts with stored data',
          {
            presentationId: manifest.presentationId,
            storedRevision: existing.manifest.revision,
            requestedRevision: manifest.revision,
          }
        )
      }
      return {
        presentationId: manifest.presentationId,
        revision: manifest.revision,
        contentHash,
        created: false,
        updated: false,
        noOp: true,
      }
    }
  }

  const metadata: PresentationMetadata = {
    presentationId: manifest.presentationId,
    revision: manifest.revision,
    contentHash,
    updatedAt: new Date().toISOString(),
  }

  try {
    await writeJsonAtomic(paths.manifest, manifest)
    await writeJsonAtomic(paths.metadata, metadata)
  } catch (error) {
    throw toStorageError(error)
  }

  return {
    presentationId: manifest.presentationId,
    revision: manifest.revision,
    contentHash,
    created: !existing,
    updated: Boolean(existing),
    noOp: false,
  }
}

export const saveAssignment = async (
  clientId: string,
  assignment: PresentationAssignment
) => {
  const filePath = getAssignmentPath(clientId)
  try {
    await writeJsonAtomic(filePath, {
      clientId,
      assignment,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    throw toStorageError(error)
  }
  return assignment
}

export const readAssignment = async (
  clientId: string
): Promise<PresentationAssignment | null> => {
  try {
    const value = (await readJson(getAssignmentPath(clientId))) as {
      clientId?: unknown
      assignment?: Partial<PresentationAssignment>
    }
    const assignment = value.assignment
    if (
      value.clientId !== clientId ||
      typeof assignment?.presentationId !== 'string' ||
      !PRESENTATION_ID_PATTERN.test(assignment.presentationId) ||
      !Number.isInteger(assignment.revision) ||
      (assignment.revision ?? 0) < 1 ||
      typeof assignment.autoStart !== 'boolean'
    ) {
      throw new PresentationRepositoryError(
        'PRESENTATION_LOAD_FAILED',
        500,
        'Stored assignment failed validation'
      )
    }
    return assignment as PresentationAssignment
  } catch (error) {
    if (isMissingFile(error)) return null
    if (error instanceof PresentationRepositoryError) throw error
    if (error instanceof SyntaxError) {
      throw new PresentationRepositoryError(
        'PRESENTATION_LOAD_FAILED',
        500,
        'Stored assignment could not be loaded'
      )
    }
    throw toStorageError(error)
  }
}

export const deleteAssignment = async (clientId: string) => {
  try {
    await fs.rm(getAssignmentPath(clientId), { force: true })
  } catch (error) {
    throw toStorageError(error)
  }
}

export const toPresentationErrorResponse = (error: unknown) => {
  if (error instanceof PresentationRepositoryError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
    }
  }
  return {
    status: 500,
    body: {
      error: 'Unexpected presentation error',
      code: 'PRESENTATION_LOAD_FAILED',
    },
  }
}
