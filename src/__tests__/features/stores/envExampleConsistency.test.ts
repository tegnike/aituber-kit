/**
 * @jest-environment node
 *
 * .env.example と NEXT_PUBLIC_* 変数の整合性チェック（S14）。
 *
 * settingsStore ほぼ全項目が NEXT_PUBLIC_* 環境変数で初期値を設定可能という
 * プロジェクトルール（AGENTS.md）に対し、これまで整合性を機械的に検証する
 * 手段がなく、コードで参照されているのに `.env.example` に載っていない変数
 * （セルフホスト時に「キーが読まれない」混乱の原因）や、逆に `.env.example`
 * にだけ残る廃止済み変数が見過ごされてきた。
 *
 * ドリフトが発生したらこのテストが落ちる。スキーマからの自動生成は範囲外
 * （docs/settings-migration-design.md 参照）。
 */
import fs from 'fs'
import path from 'path'

const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example')
const SRC_DIR = path.join(process.cwd(), 'src')

// BASE_PATH から next.config.js がクライアント用に生成する。
const GENERATED_BY_NEXT = new Set(['NEXT_PUBLIC_BASE_PATH'])

// .env.example にのみ存在してよい（コードから直接参照されない）変数。
// 追加する場合は理由をコメントで明記すること。
const ALLOWED_UNREFERENCED_IN_CODE: string[] = []

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.name === '__tests__' || entry.name === '__mocks__') {
      return []
    }
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath)
    }
    if (/\.tsx?$/.test(entry.name)) {
      return [fullPath]
    }
    return []
  })
}

function extractDeclaredVars(): Set<string> {
  const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8')
  const matches = content.matchAll(/^(NEXT_PUBLIC_[A-Z0-9_]+)=/gm)
  return new Set(Array.from(matches, (m) => m[1]))
}

function extractReferencedVars(): Set<string> {
  const referenced = new Set<string>()
  for (const file of listSourceFiles(SRC_DIR)) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const match of content.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      referenced.add(match[0])
    }
  }
  return referenced
}

describe('.env.example / NEXT_PUBLIC_* consistency', () => {
  const declaredVars = extractDeclaredVars()
  const referencedVars = extractReferencedVars()

  it('should find declared and referenced variables', () => {
    expect(declaredVars.size).toBeGreaterThan(0)
    expect(referencedVars.size).toBeGreaterThan(0)
  })

  it('should not reference NEXT_PUBLIC_* variables missing from .env.example', () => {
    const missing = Array.from(referencedVars)
      .filter((v) => !declaredVars.has(v) && !GENERATED_BY_NEXT.has(v))
      .sort()

    expect(missing).toEqual([])
  })

  it('should not declare stale NEXT_PUBLIC_* variables unused by any source file', () => {
    const stale = Array.from(declaredVars)
      .filter(
        (v) =>
          !referencedVars.has(v) && !ALLOWED_UNREFERENCED_IN_CODE.includes(v)
      )
      .sort()

    expect(stale).toEqual([])
  })
})
