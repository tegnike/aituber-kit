import Link from 'next/link'

export const SeoSummary = () => (
  <>
    <section className="sr-only" aria-labelledby="aituberkit-summary-title">
      <h1 id="aituberkit-summary-title">
        AITuberKit - AIキャラクターとの会話・AITuber配信
      </h1>
      <p>
        AITuberKitは、VRM・Live2D・PNGTuberに対応し、AIキャラクターとの会話やYouTubeでのAITuber配信をブラウザで体験できるオープンソースのツールキットです。
      </p>
    </section>
    <Link
      href="/aituber/"
      className="sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:m-0 focus-visible:h-auto focus-visible:w-auto focus-visible:overflow-visible focus-visible:rounded-lg focus-visible:bg-slate-950 focus-visible:px-4 focus-visible:py-3 focus-visible:text-white focus-visible:[clip:auto] focus-visible:[clip-path:none] focus-visible:whitespace-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      AITuberとAITuberKitについて詳しく見る
    </Link>
  </>
)
