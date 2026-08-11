import Link from 'next/link'

export const SeoSummary = () => (
  <section className="sr-only" aria-labelledby="aituberkit-summary-title">
    <h1 id="aituberkit-summary-title">
      AITuberKit - AIキャラクターとの会話・AITuber配信
    </h1>
    <p>
      AITuberKitは、VRM・Live2D・PNGTuberに対応し、AIキャラクターとの会話やYouTubeでのAITuber配信をブラウザで体験できるオープンソースのツールキットです。
    </p>
    <Link href="/aituber/">AITuberとAITuberKitについて詳しく見る</Link>
  </section>
)
