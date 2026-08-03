const FORBIDDEN_BLOCKS =
  /<(script|iframe|object|embed|style|link)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const FORBIDDEN_SINGLE_TAGS =
  /<(script|iframe|object|embed|style|link)\b[^>]*\/?\s*>/gi
const EVENT_ATTRIBUTE = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const UNSAFE_URL_ATTRIBUTE =
  /\s+(href|src|xlink:href)\s*=\s*(["'])\s*(?:javascript|data|file):[\s\S]*?\2/gi

export const sanitizePresentationHtml = (html: string) =>
  html
    .replace(FORBIDDEN_BLOCKS, '')
    .replace(FORBIDDEN_SINGLE_TAGS, '')
    .replace(EVENT_ATTRIBUTE, '')
    .replace(UNSAFE_URL_ATTRIBUTE, '')
