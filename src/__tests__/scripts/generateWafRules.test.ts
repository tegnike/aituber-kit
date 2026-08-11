/**
 * @jest-environment node
 *
 * WAF生成スクリプトの検証（docs/access-policy-design.md §6.2）。
 *
 * 1. 生成ルールが、以前ワークフローYAMLにハードコードされていたルールへ
 *    明示した公開SEOパスの除外だけを加えた内容であること（`in {…}` 集合は
 *    順序不問の集合比較、それ以外は文字列一致）。
 * 2. ポリシー整合: 生成される保護対象/embed許可のAPIパス集合が
 *    routePolicies の waf フラグと一致すること。
 * 3. 実行互換性: child_process で実際にスクリプトを実行することで、
 *    Node の type stripping による routePolicies.ts の import が
 *    動作し続けることを保証する（ts-jest 経由では検出できない）。
 */
import { execFileSync } from 'child_process'
import path from 'path'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

type WafRule = {
  ref: string
  description: string
  expression: string
  action: string
  action_parameters?: unknown
  enabled: boolean
}

/**
 * ワークフローYAMLにハードコードされていた移行前のルール定義
 * （.github/workflows/apply-cloudflare-waf.yml の 2026-07-06 時点）を
 * ベースラインとした期待値スナップショット。
 *
 * 移行後のポリシー追加は以下のみ（それ以外は移行時と完全等価であること）:
 * - 2026-07-08 F3: `/api/ai/audio` を embed許可集合へ追加
 *   （audioモードのサーバー中継ルート。docs/audio-mode-auth-design.md）
 * - 2026-07-08 Realtime API ephemeral化:
 *   `/api/ai/realtime-client-secret` を embed許可集合へ追加
 */
const LEGACY_RULES: WafRule[] = [
  {
    ref: 'aituberkit-nikechan-embed-skip',
    description: 'AITuberKit: allow embedded widget on nikechan.com',
    expression:
      '(http.host in {"aituberkit.com" "www.aituberkit.com"} and ((http.referer contains "https://nikechan.com" and starts_with(http.request.uri.path, "/embed")) or ((http.referer contains "https://aituberkit.com/" or http.referer contains "https://www.aituberkit.com/") and (starts_with(http.request.uri.path, "/vrm/") or starts_with(http.request.uri.path, "/live2d/") or starts_with(http.request.uri.path, "/pngtuber/") or starts_with(http.request.uri.path, "/models/") or starts_with(http.request.uri.path, "/poses/") or ends_with(http.request.uri.path, ".vrma"))) or (http.request.method eq "POST" and (http.referer contains "https://aituberkit.com/embed" or http.referer contains "https://www.aituberkit.com/embed") and http.request.uri.path in {"/api/ai/audio" "/api/ai/custom" "/api/ai/realtime-client-secret" "/api/ai/vercel" "/api/tts-aivis-cloud-api" "/api/save-chat-log"})))',
    action: 'skip',
    action_parameters: {
      ruleset: 'current',
      phases: [
        'http_ratelimit',
        'http_request_sbfm',
        'http_request_firewall_managed',
      ],
      products: [
        'bic',
        'hot',
        'rateLimit',
        'securityLevel',
        'uaBlock',
        'waf',
        'zoneLockdown',
      ],
    },
    enabled: true,
  },
  {
    ref: 'aituberkit-browser-clearance',
    description: 'AITuberKit: issue browser clearance before protected API use',
    expression:
      '(http.host in {"aituberkit.com" "www.aituberkit.com"} and http.request.method eq "GET" and http.request.uri.path ne "/aituber" and http.request.uri.path ne "/aituber/" and http.request.uri.path ne "/robots.txt" and http.request.uri.path ne "/sitemap.xml" and http.request.uri.path ne "/llms.txt" and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/_next/") and not starts_with(http.request.uri.path, "/assets/") and not ends_with(http.request.uri.path, ".js") and not ends_with(http.request.uri.path, ".css") and not ends_with(http.request.uri.path, ".png") and not ends_with(http.request.uri.path, ".jpg") and not ends_with(http.request.uri.path, ".jpeg") and not ends_with(http.request.uri.path, ".webp") and not ends_with(http.request.uri.path, ".svg") and not ends_with(http.request.uri.path, ".ico") and not cf.client.bot)',
    action: 'managed_challenge',
    enabled: true,
  },
  {
    ref: 'aituberkit-protected-api-clearance',
    description:
      'AITuberKit: challenge protected server-secret API calls without clearance',
    expression:
      '(http.host in {"aituberkit.com" "www.aituberkit.com"} and http.request.method eq "POST" and http.request.uri.path in {"/api/ai/custom" "/api/tts-aivis-cloud-api"} and not http.cookie contains "cf_clearance" and not cf.client.bot)',
    action: 'managed_challenge',
    enabled: true,
  },
]

/** `in {…}` 集合の中身をソートして順序差を正規化する */
function canonicalizeExpression(expression: string): string {
  return expression.replace(/in \{([^}]*)\}/g, (_match, contents: string) => {
    const sorted = (contents.match(/"[^"]*"/g) || []).sort()
    return `in {${sorted.join(' ')}}`
  })
}

function extractPathSet(expression: string, marker: string): string[] {
  const index = expression.indexOf(marker)
  expect(index).toBeGreaterThanOrEqual(0)
  const setMatch = expression.slice(index).match(/in \{([^}]*)\}/)
  expect(setMatch).not.toBeNull()
  return (setMatch![1].match(/"([^"]*)"/g) || [])
    .map((quoted) => quoted.slice(1, -1))
    .sort()
}

describe('generate-waf-rules.mjs', () => {
  let generated: WafRule[]

  beforeAll(() => {
    const scriptPath = path.join(
      process.cwd(),
      'scripts',
      'waf',
      'generate-waf-rules.mjs'
    )
    // Node < 22.18 でも動くよう type stripping フラグを明示する
    // （22.18+/23.6+/24 ではフラグは冗長だが無害）
    const stdout = execFileSync(
      process.execPath,
      ['--experimental-strip-types', scriptPath, '--print'],
      { encoding: 'utf8' }
    )
    generated = JSON.parse(stdout)
  })

  it('generates the three expected rules including public SEO paths', () => {
    expect(generated).toHaveLength(LEGACY_RULES.length)

    generated.forEach((rule, index) => {
      const legacy = LEGACY_RULES[index]
      expect(rule.ref).toBe(legacy.ref)
      expect(rule.description).toBe(legacy.description)
      expect(rule.action).toBe(legacy.action)
      expect(rule.enabled).toBe(legacy.enabled)
      expect(rule.action_parameters).toEqual(legacy.action_parameters)
      expect(canonicalizeExpression(rule.expression)).toBe(
        canonicalizeExpression(legacy.expression)
      )
    })
  })

  it('derives challenge API paths from routePolicies waf.challenge flags', () => {
    const expected = Object.values(routePolicies)
      .filter((policy) => policy.waf?.challenge)
      .map((policy) => policy.path)
      .sort()

    const rule = generated.find(
      (candidate) => candidate.ref === 'aituberkit-protected-api-clearance'
    )!
    expect(extractPathSet(rule.expression, 'http.request.uri.path')).toEqual(
      expected
    )
  })

  it('derives embed-allowed API paths from routePolicies waf.embedAllowed flags', () => {
    const expected = Object.values(routePolicies)
      .filter((policy) => policy.waf?.embedAllowed)
      .map((policy) => policy.path)
      .sort()

    const rule = generated.find(
      (candidate) => candidate.ref === 'aituberkit-nikechan-embed-skip'
    )!
    expect(extractPathSet(rule.expression, 'http.request.uri.path in')).toEqual(
      expected
    )
  })
})
