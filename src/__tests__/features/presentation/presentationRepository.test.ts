/** @jest-environment node */

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import {
  PresentationRepositoryError,
  deleteAssignment,
  readAssignment,
  readPresentation,
  saveAssignment,
  savePresentation,
} from '@/features/presentation/presentationRepository'
import type { PresentationManifestV1 } from '@/features/presentation/presentationTypes'

const createManifest = (revision = 1): PresentationManifestV1 => ({
  schemaVersion: 1,
  presentationId: 'repository-test',
  revision,
  title: 'Repository test',
  createdAt: '2026-07-14T20:00:00.000Z',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      slides: [{ id: 'slide-1', markdown: '# Test' }],
    },
  ],
})

describe('presentationRepository', () => {
  let storageDir: string

  beforeEach(async () => {
    storageDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'aituber-presentation-')
    )
    process.env.AITUBERKIT_PRESENTATION_STORAGE_DIR = storageDir
  })

  afterEach(async () => {
    delete process.env.AITUBERKIT_PRESENTATION_STORAGE_DIR
    await fs.rm(storageDir, { recursive: true, force: true })
  })

  it('creates, reads, updates, and treats identical revisions as no-op', async () => {
    const created = await savePresentation(createManifest())
    expect(created).toEqual(
      expect.objectContaining({ created: true, noOp: false })
    )
    const noOp = await savePresentation(createManifest())
    expect(noOp).toEqual(
      expect.objectContaining({ created: false, noOp: true })
    )
    const updated = await savePresentation(createManifest(2))
    expect(updated).toEqual(
      expect.objectContaining({ updated: true, revision: 2 })
    )
    expect(
      (await readPresentation('repository-test', 2)).manifest.revision
    ).toBe(2)
  })

  it('preserves a producer theme hint for renderer fallback', async () => {
    const manifest = createManifest()
    manifest.theme = 'product-demo'
    await savePresentation(manifest)
    expect((await readPresentation('repository-test', 1)).manifest.theme).toBe(
      'product-demo'
    )
  })

  it('rejects conflicting and stale revisions', async () => {
    await savePresentation(createManifest(2))
    const conflicting = createManifest(2)
    conflicting.title = 'Different body'
    await expect(savePresentation(conflicting)).rejects.toMatchObject({
      code: 'REVISION_CONFLICT',
    })
    await expect(savePresentation(createManifest(1))).rejects.toMatchObject({
      code: 'STALE_REVISION',
    })
  })

  it('serializes concurrent saves for the same presentation', async () => {
    await savePresentation(createManifest())
    const left = createManifest(2)
    left.title = 'Left update'
    const right = createManifest(2)
    right.title = 'Right update'

    const results = await Promise.allSettled([
      savePresentation(left),
      savePresentation(right),
    ])

    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1)
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    expect(rejected?.reason).toMatchObject({ code: 'REVISION_CONFLICT' })
  })

  it('repairs inconsistent manifest metadata on the next save', async () => {
    await savePresentation(createManifest())
    const metadataPath = path.join(
      storageDir,
      'metadata',
      'repository-test.json'
    )
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    metadata.contentHash = 'sha256:corrupted'
    await fs.writeFile(metadataPath, JSON.stringify(metadata))

    await expect(savePresentation(createManifest(2))).resolves.toEqual(
      expect.objectContaining({ revision: 2, noOp: false })
    )
    await expect(readPresentation('repository-test', 2)).resolves.toEqual(
      expect.objectContaining({
        manifest: expect.objectContaining({ revision: 2 }),
      })
    )
  })

  it('hashes client IDs instead of using them as paths', async () => {
    const assignment = {
      presentationId: 'repository-test',
      revision: 1,
      autoStart: false,
    }
    await saveAssignment('../../unsafe/client', assignment)
    expect(await readAssignment('../../unsafe/client')).toEqual(assignment)
    expect(await fs.readdir(path.join(storageDir, 'assignments'))).toHaveLength(
      1
    )
    await deleteAssignment('../../unsafe/client')
    expect(await readAssignment('../../unsafe/client')).toBeNull()
  })

  it('rejects presentation path traversal before filesystem access', async () => {
    await expect(readPresentation('../../etc/passwd')).rejects.toBeInstanceOf(
      PresentationRepositoryError
    )
    await expect(readPresentation('../../etc/passwd')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  it('reports unavailable storage without exposing its path', async () => {
    const blockingFile = path.join(storageDir, 'not-a-directory')
    await fs.writeFile(blockingFile, 'blocked')
    process.env.AITUBERKIT_PRESENTATION_STORAGE_DIR = blockingFile
    await expect(savePresentation(createManifest())).rejects.toMatchObject({
      code: 'PRESENTATION_STORAGE_UNAVAILABLE',
      status: 503,
      message: 'Presentation storage is unavailable',
    })
  })
})
