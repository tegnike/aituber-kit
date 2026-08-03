/**
 * @jest-environment node
 *
 * APIルートの静的チェック。
 *
 * 1. `return new Response(...)` パターンの再発防止（B1）:
 *    Pages Router の Node.js ランタイムでは、ハンドラーの返り値の
 *    Web標準 Response は無視され、クライアントはタイムアウトまでハングする。
 *
 * 2. 統一アクセスポリシーの登録保証（F1 / docs/access-policy-design.md §7.2）:
 *    全ルートが routePolicies に登録され withAccessPolicy でラップされて
 *    いることを保証する。新ルート追加時にポリシー未登録だとここで落ちる。
 *
 * 3. RoutePolicy.resources の実行時検証（S17）:
 *    resources は元々「宣言のみで参照されない記述メタデータ」だったため、
 *    書き間違えても検知できなかった（update-voicevox-speakers.ts等で実例あり）。
 *    各 ApiResource 種別ごとに、宣言と実際のガード実装が対応していることを
 *    grepベースで検証する。
 */
import fs from 'fs'
import path from 'path'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'
import type { RoutePolicy } from '@/lib/accessPolicy/types'

const API_DIR = path.join(process.cwd(), 'src', 'pages', 'api')

/**
 * Object.entries(routePolicies) の型ヘルパー。
 *
 * routePolicies は `satisfies Record<string, RoutePolicy>` で定義された
 * 46メンバーの大きな判別共用体型のため、`Object.entries(...).filter(...)`
 * を素で使うと巨大ユニオンの絞り込みで `tsc --noEmit`（プロジェクト全体
 * ビルド）側だけで `never` 型の誤検知が起きる（ts-jestの分離コンパイルでは
 * 再現しない既知のTS挙動）。ここでキャストして一箇所に閉じ込める。
 */
function policyEntries(): [string, RoutePolicy][] {
  return Object.entries(routePolicies) as [string, RoutePolicy][]
}

/**
 * withAccessPolicy への移行が完了していないルート。
 * F1移行完了により空。新規ルートは必ず withAccessPolicy でラップすること
 * （ここへの追加は禁止）。
 */
const PENDING_MIGRATION: string[] = []

/**
 * resources に 'server-url' を宣言しているが、意図的にURL検証を行わない
 * ルートの許可リスト（S17）。
 *
 * - `/api/ai/custom`: カスタムAPIエンドポイント機能そのものが「ユーザーが
 *   任意のエンドポイントを設定できる」ことを目的としており、serverUrlGuard
 *   によるオリジン制限はその機能と両立しない。
 * - `/api/difyChat`: 同様にユーザーが任意のDifyデプロイ先URLを指定できる
 *   ことを目的とした機能で、serverUrlGuardを呼ばず任意URLへのfetchを許容
 *   する（既存挙動）。
 *
 * いずれも secret.kind: 'dynamic' の gate.guardServerSecret() で
 * サーバー秘匿情報側のガードのみ行う設計。
 */
const SERVER_URL_VALIDATION_EXEMPT: string[] = [
  '/api/ai/custom',
  '/api/difyChat',
]

function routeFilePath(policyPath: string): string {
  return path.join(process.cwd(), 'src', 'pages', `${policyPath.slice(1)}.ts`)
}

function routePathFromFile(file: string): string {
  const relative = path.relative(path.join(process.cwd(), 'src', 'pages'), file)
  return `/${relative.replace(/\\/g, '/').replace(/\.tsx?$/, '')}`
}

function listRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return listRouteFiles(fullPath)
    }
    if (/\.tsx?$/.test(entry.name)) {
      return [fullPath]
    }
    return []
  })
}

function isEdgeRuntime(source: string): boolean {
  return /runtime:\s*['"]edge['"]/.test(source)
}

describe('API route static checks', () => {
  const routeFiles = listRouteFiles(API_DIR)

  it('should find API route files', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  it('should not return new Response() from Node runtime routes', () => {
    const violations: string[] = []

    for (const file of routeFiles) {
      const source = fs.readFileSync(file, 'utf8')
      if (isEdgeRuntime(source)) continue

      const lines = source.split('\n')
      lines.forEach((line, index) => {
        if (/return\s+new\s+Response\s*\(/.test(line)) {
          violations.push(
            `${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`
          )
        }
      })
    }

    expect(violations).toEqual([])
  })

  describe('unified access policy (F1)', () => {
    const routePaths = routeFiles.map(routePathFromFile)
    const policyPaths = Object.keys(routePolicies)

    it('should register every API route file in routePolicies', () => {
      const unregistered = routePaths.filter(
        (routePath) => !policyPaths.includes(routePath)
      )
      expect(unregistered).toEqual([])
    })

    it('should not declare policies for nonexistent routes', () => {
      const stale = policyPaths.filter(
        (policyPath) => !routePaths.includes(policyPath)
      )
      expect(stale).toEqual([])
    })

    it('should keep policy keys consistent with their path field', () => {
      const mismatched = policyEntries()
        .filter(([key, policy]) => key !== policy.path)
        .map(([key, policy]) => `${key} != ${policy.path}`)
      expect(mismatched).toEqual([])
    })

    it('should wrap every migrated route with withAccessPolicy', () => {
      const violations: string[] = []

      for (const file of routeFiles) {
        const routePath = routePathFromFile(file)
        if (PENDING_MIGRATION.includes(routePath)) continue

        const source = fs.readFileSync(file, 'utf8')
        if (!/export\s+default\s+withAccessPolicy\s*\(/.test(source)) {
          violations.push(routePath)
        }
      }

      expect(violations).toEqual([])
    })

    it('should call gate.guardServerSecret in dynamic-secret routes', () => {
      const violations: string[] = []

      for (const [policyPath, policy] of policyEntries()) {
        if (policy.secret.kind !== 'dynamic') continue
        if (PENDING_MIGRATION.includes(policyPath)) continue

        const file = path.join(
          process.cwd(),
          'src',
          'pages',
          `${policyPath.slice(1)}.ts`
        )
        const source = fs.readFileSync(file, 'utf8')
        if (!/gate\.guardServerSecret\s*\(/.test(source)) {
          violations.push(policyPath)
        }
      }

      expect(violations).toEqual([])
    })

    it('should keep routePolicies.ts free of runtime imports (WAF type stripping)', () => {
      const source = fs.readFileSync(
        path.join(
          process.cwd(),
          'src',
          'lib',
          'accessPolicy',
          'routePolicies.ts'
        ),
        'utf8'
      )
      const runtimeImports = source
        .split('\n')
        .filter((line) => /^\s*import\s/.test(line))
        .filter((line) => !/^\s*import\s+type\s/.test(line))
      expect(runtimeImports).toEqual([])
    })

    it('should not add unauthenticated external-control routes beyond the known legacy queue', () => {
      const legacyAllowed = ['/api/messages']
      const violations = policyEntries()
        .filter(
          ([, policy]) =>
            policy.resources.includes('external-control') &&
            !policy.requiresApiKey
        )
        .map(([key]) => key)
        .filter((key) => !legacyAllowed.includes(key))
      expect(violations).toEqual([])
    })

    // S17: resources 宣言が実際のガード実装と対応していることの検証。
    // resources は元々どのガード分岐からも参照されない記述メタデータだった
    // ため、書き間違えても静的テスト・ランタイムいずれも検知できなかった
    // （update-voicevox-speakers.ts等で実例あり、作業単位3完了後レビュー）。
    describe('resources declarations match actual guard implementations (S17)', () => {
      it('server-secret routes must not declare secret.kind: none', () => {
        const violations = policyEntries()
          .filter(
            ([, policy]) =>
              policy.resources.includes('server-secret') &&
              policy.secret.kind === 'none'
          )
          .map(([key]) => key)
        expect(violations).toEqual([])
      })

      it('routes with a non-none secret policy must declare server-secret', () => {
        const violations = policyEntries()
          .filter(
            ([, policy]) =>
              policy.secret.kind !== 'none' &&
              !policy.resources.includes('server-secret')
          )
          .map(([key]) => key)
        expect(violations).toEqual([])
      })

      it('server-url routes must declare a serverUrl policy or call serverUrlGuard directly (unless exempted)', () => {
        const violations: string[] = []

        for (const [policyPath, policy] of policyEntries()) {
          if (!policy.resources.includes('server-url')) continue
          if (SERVER_URL_VALIDATION_EXEMPT.includes(policyPath)) continue
          if (policy.serverUrl) continue

          const file = routeFilePath(policyPath)
          const source = fs.readFileSync(file, 'utf8')
          const callsServerUrlGuard =
            (/isAllowedConfiguredOrListedUrl\s*\(/.test(source) &&
              /isHttpUrl\s*\(/.test(source)) ||
            (/isLoopbackHost\s*\(/.test(source) &&
              /isHttpUrl\s*\(/.test(source)) ||
            /guardLocalLlmUrl\s*\(/.test(source)
          if (!callsServerUrlGuard) {
            violations.push(policyPath)
          }
        }

        expect(violations).toEqual([])
      })

      it('should not silently grow the server-url validation exemption list', () => {
        expect(SERVER_URL_VALIDATION_EXEMPT).toEqual([
          '/api/ai/custom',
          '/api/difyChat',
        ])
      })

      it('fs-read/fs-write routes must import fs or delegate to the presentation repository', () => {
        const violations: string[] = []

        for (const [policyPath, policy] of policyEntries()) {
          if (
            !policy.resources.includes('fs-read') &&
            !policy.resources.includes('fs-write')
          ) {
            continue
          }

          const file = routeFilePath(policyPath)
          const source = fs.readFileSync(file, 'utf8')
          const importsFs = /from\s+['"]fs(\/promises)?['"]/.test(source)
          const repositoryImport = source.match(
            /import\s*{([^}]+)}\s*from\s*['"]@\/features\/presentation\/presentationRepository['"]/
          )
          const repositoryFunctions = repositoryImport?.[1]
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
          const delegatesToFsRepository = repositoryFunctions?.some((name) =>
            new RegExp(`\\b${name}\\s*\\(`).test(source)
          )
          if (!importsFs && !delegatesToFsRepository) {
            violations.push(policyPath)
          }
        }

        expect(violations).toEqual([])
      })

      it('external-control routes must require an API key unless legacy-allowed', () => {
        const legacyAllowed = ['/api/messages']
        const violations = policyEntries()
          .filter(
            ([key, policy]) =>
              policy.resources.includes('external-control') &&
              !policy.requiresApiKey &&
              !legacyAllowed.includes(key)
          )
          .map(([key]) => key)
        expect(violations).toEqual([])
      })

      it('client-proxy routes must not declare a server-secret guard', () => {
        const violations = policyEntries()
          .filter(
            ([, policy]) =>
              policy.resources.includes('client-proxy') &&
              policy.secret.kind !== 'none'
          )
          .map(([key]) => key)
        expect(violations).toEqual([])
      })
    })
  })
})
