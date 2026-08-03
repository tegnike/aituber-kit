/**
 * 感情タグ・モーションタグ・文の抽出（handlers.tsから移設した純粋関数群）
 *
 * 正規表現は移設前と同一であること（変更する場合は設計ドキュメント
 * docs/streaming-pipeline-design.md §7 に意図的変更として列挙する）。
 */

/**
 * テキストから感情タグ `[...]` を抽出する
 * @param text 入力テキスト
 * @returns 感情タグと残りのテキスト
 */
export const extractEmotion = (
  text: string
): { emotionTag: string; remainingText: string } => {
  // 先頭のスペースを無視して、感情タグを検出
  const emotionMatch = text.match(/^\s*\[(.*?)\]/)
  if (emotionMatch?.[0]) {
    // モーションタグは感情タグとして扱わない
    if (/^\s*\[motion:/i.test(text)) {
      return { emotionTag: '', remainingText: text }
    }
    return {
      emotionTag: emotionMatch[0].trim(), // タグ自体の前後のスペースは除去
      // 先頭のスペースも含めて削除し、さらに前後のスペースを除去
      remainingText: text
        .slice(text.indexOf(emotionMatch[0]) + emotionMatch[0].length)
        .trimStart(),
    }
  }
  return { emotionTag: '', remainingText: text }
}

/**
 * テキストからモーションタグ `[motion:xxx]` を抽出する
 * @param text 入力テキスト
 * @returns モーションタグと残りのテキスト
 */
export const extractMotionTag = (
  text: string
): { motionTag: string; remainingText: string } => {
  const motionMatch = text.match(/^\s*\[motion:([^\]\s]+)\]/i)
  if (motionMatch?.[0]) {
    return {
      motionTag: motionMatch[1],
      remainingText: text
        .slice(text.indexOf(motionMatch[0]) + motionMatch[0].length)
        .trimStart(),
    }
  }
  return { motionTag: '', remainingText: text }
}

/**
 * テキストから文法的に区切りの良い文を抽出する
 * @param text 入力テキスト
 * @returns 抽出された文と残りのテキスト
 */
export const extractSentence = (
  text: string,
  { commaMinChars = 10 }: { commaMinChars?: number } = {}
): { sentence: string; remainingText: string } => {
  const normalizedCommaMinChars = Math.max(2, Math.floor(commaMinChars))
  const sentencePattern = new RegExp(
    `^(.{1,${normalizedCommaMinChars - 1}}?(?:[。．!?！？\\n]|(?<!\\d)\\.|\\.(?=[^\\d])|(?=\\[))|.{${normalizedCommaMinChars},}?(?:[、。．!?！？\\n]|(?<!\\d)[,.]|[,.](?=[^\\d])|(?=\\[)))`
  )
  const sentenceMatch = text.match(sentencePattern)
  if (sentenceMatch?.[0]) {
    return {
      sentence: sentenceMatch[0],
      remainingText: text.slice(sentenceMatch[0].length).trimStart(),
    }
  }
  return { sentence: '', remainingText: text }
}

/**
 * 発話に値するテキストかを判定する（記号・空白のみの文字列を除外）。
 * handlers.ts の handleSpeakAndStateUpdate にあった判定の移設。
 */
export const isSpeakableText = (text: string): boolean => {
  if (text === '') return false
  return (
    text.replace(
      /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
      ''
    ) !== ''
  )
}
