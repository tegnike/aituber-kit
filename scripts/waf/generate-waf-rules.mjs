/**
 * Cloudflare WAF ルールを統一アクセスポリシー定義から生成する。
 *
 * 保護対象APIパス（protected-api-clearance）と embed 許可APIパス
 * （nikechan-embed-skip）は src/lib/accessPolicy/routePolicies.ts の
 * waf.challenge / waf.embedAllowed フラグから導出し、デプロイ固有の条件
 * （hosts, referer, 静的アセットパス）は waf.config.json から読む。
 *
 * 実行には Node の TypeScript type stripping が必要:
 * - Node >= 22.18 / 23.6 / 24: フラグ不要
 * - それ未満の 22.x: `node --experimental-strip-types`
 *
 * 使い方: node scripts/waf/generate-waf-rules.mjs --print
 *
 * 設計ドキュメント: docs/access-policy-design.md §6
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routePolicies } from '../../src/lib/accessPolicy/routePolicies.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))

export function loadWafConfig() {
  const configPath = path.join(scriptDir, 'waf.config.json')
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

function quoteSet(values) {
  return `{${values.map((value) => `"${value}"`).join(' ')}}`
}

function derivedPaths(flag) {
  return Object.values(routePolicies)
    .filter((policy) => policy.waf?.[flag])
    .map((policy) => policy.path)
    .sort()
}

export function generateWafRules(config = loadWafConfig()) {
  const hostIn = `http.host in ${quoteSet(config.hosts)}`

  const embedAllowedApiPaths = derivedPaths('embedAllowed')
  const challengeApiPaths = derivedPaths('challenge')

  const embed = config.embed
  const externalEmbedCondition = `(${embed.externalReferers
    .map((referer) => `http.referer contains "${referer}"`)
    .join(
      ' or '
    )} and starts_with(http.request.uri.path, "${embed.embedPathPrefix}"))`

  const internalAssetCondition = `((${embed.internalRefererPrefixes
    .map((prefix) => `http.referer contains "${prefix}"`)
    .join(' or ')}) and (${[
    ...embed.assetPathPrefixes.map(
      (prefix) => `starts_with(http.request.uri.path, "${prefix}")`
    ),
    ...embed.assetPathSuffixes.map(
      (suffix) => `ends_with(http.request.uri.path, "${suffix}")`
    ),
  ].join(' or ')}))`

  const embedReferers = embed.internalRefererPrefixes.map(
    (prefix) => `${prefix}${embed.embedPathPrefix.replace(/^\//, '')}`
  )
  const embedApiCondition = `(http.request.method eq "POST" and (${embedReferers
    .map((referer) => `http.referer contains "${referer}"`)
    .join(
      ' or '
    )}) and http.request.uri.path in ${quoteSet(embedAllowedApiPaths)})`

  const browser = config.browserClearance
  const browserClearanceExpression = `(${hostIn} and http.request.method eq "GET" and ${[
    ...browser.excludedPaths.map(
      (excludedPath) => `http.request.uri.path ne "${excludedPath}"`
    ),
    ...browser.excludedPathPrefixes.map(
      (prefix) => `not starts_with(http.request.uri.path, "${prefix}")`
    ),
    ...browser.excludedPathSuffixes.map(
      (suffix) => `not ends_with(http.request.uri.path, "${suffix}")`
    ),
  ].join(' and ')} and not cf.client.bot)`

  return [
    {
      ref: 'aituberkit-nikechan-embed-skip',
      description: embed.description,
      expression: `(${hostIn} and (${externalEmbedCondition} or ${internalAssetCondition} or ${embedApiCondition}))`,
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
      description: browser.description,
      expression: browserClearanceExpression,
      action: 'managed_challenge',
      enabled: true,
    },
    {
      ref: 'aituberkit-protected-api-clearance',
      description: config.protectedApiClearance.description,
      expression: `(${hostIn} and http.request.method eq "POST" and http.request.uri.path in ${quoteSet(challengeApiPaths)} and not http.cookie contains "cf_clearance" and not cf.client.bot)`,
      action: 'managed_challenge',
      enabled: true,
    },
  ]
}

if (process.argv.includes('--print')) {
  process.stdout.write(JSON.stringify(generateWafRules(), null, 2) + '\n')
}
