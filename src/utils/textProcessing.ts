import englishToJapanese from '@/utils/englishToJapanese.json'

interface EnglishToJapanese {
  [key: string]: string
}

const typedEnglishToJapanese = englishToJapanese as EnglishToJapanese

// ソート済みキーをあらかじめメモ化
const sortedEnglishKeys = Object.keys(typedEnglishToJapanese).sort(
  (a, b) => b.length - a.length
)

// 重要な単語を明示的に含める
const importantWords = ['mastra', 'Mastra']

// 最適化: 10文字以下の単語と重要な単語を含める
const commonWordsKeys = [
  ...sortedEnglishKeys.filter((key) => key.length <= 10),
  ...importantWords,
]

// 正規表現をあらかじめコンパイルして再利用
const regexCache = new Map<string, RegExp>()

/**
 * 英語テキストを日本語読みに変換する
 * @param text 変換元の文字列
 * @returns 変換後の文字列
 */
export function convertEnglishToJapaneseReading(text: string): string {
  // 大文字小文字を区別せずに変換するために、テキストを小文字化してキャッシュ
  const lowerText = text.toLowerCase()

  // メモ化されたキーを使用
  return commonWordsKeys.reduce((result, englishWord) => {
    // 最適化: 大文字小文字を区別せずに単語の有無をチェック
    if (!lowerText.includes(englishWord.toLowerCase())) {
      return result
    }

    // 正規表現のキャッシュを利用
    let regex = regexCache.get(englishWord)
    if (!regex) {
      // 大文字小文字を区別せず、単語境界に一致する正規表現
      regex = new RegExp(`\\b${englishWord}\\b`, 'gi')
      regexCache.set(englishWord, regex)
    }

    const japaneseReading = typedEnglishToJapanese[englishWord]
    return result.replace(regex, japaneseReading)
  }, text)
}

/**
 * 非同期で英語テキストを日本語読みに変換する
 * UIスレッドをブロックしないように設計
 * @param text 変換元の文字列
 * @returns 変換後の文字列を含むPromise
 */
export async function asyncConvertEnglishToJapaneseReading(
  text: string
): Promise<string> {
  // UIスレッドをブロックしないよう、次のティックまで待機
  await new Promise((resolve) => setTimeout(resolve, 0))

  return convertEnglishToJapaneseReading(text)
}

/**
 * テキスト内に英語（ラテン文字）が含まれているかチェック
 * @param text チェック対象のテキスト
 * @returns 英語が含まれている場合はtrue
 */
export function containsEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text)
}
