import Link from 'next/link'
import { Meta, SITE_URL } from '@/components/meta'

const faq = [
  {
    question: 'AITuberとは何ですか？',
    answer:
      'AITuber（AI VTuber）は、生成AIによる会話、音声合成、2D・3Dアバターなどを組み合わせ、視聴者との対話や配信を行うAIキャラクターです。',
  },
  {
    question: 'AITuberKitはブラウザだけで試せますか？',
    answer:
      'はい。デモサイトではインストールせずにAIキャラクターとの会話を体験できます。自分の環境で構築する場合は、GitHubのソースコードと公式ドキュメントを利用できます。',
  },
  {
    question: 'どのキャラクターモデルに対応していますか？',
    answer:
      '3DのVRM、2DのLive2D、静止画や動画を使うPNGTuberに対応しています。用途や用意している素材に合わせて選べます。',
  },
  {
    question: 'YouTubeでAITuber配信ができますか？',
    answer:
      'はい。YouTubeの配信コメントを取得し、AIキャラクターが応答する配信を構築できます。詳しい設定手順は公式ドキュメントで案内しています。',
  },
]

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/aituber/#faq`,
  mainEntity: faq.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
}

const features = [
  {
    title: 'AIキャラクターとの会話',
    description:
      'OpenAI、Anthropic Claude、Google Geminiなど、複数のLLMを使った会話に対応しています。',
  },
  {
    title: 'VRM・Live2D・PNGTuber',
    description:
      '3D、2D、画像・動画ベースのキャラクターを選び、音声に合わせて表情や口元を動かせます。',
  },
  {
    title: 'AITuber配信',
    description:
      'YouTubeコメントへの自動応答、アイドルモード、ゲーム実況など、ライブ配信向けの機能を備えています。',
  },
  {
    title: '音声合成・音声認識',
    description:
      'VOICEVOX、AivisSpeech、OpenAI TTSなどの音声合成と、ブラウザ音声認識やWhisperに対応しています。',
  },
  {
    title: 'オープンソース',
    description:
      'ソースコードをGitHubで公開しています。自分のAIキャラクターアプリや配信環境の土台として利用できます。',
  },
  {
    title: 'ブラウザですぐ体験',
    description:
      'デモサイトなら、AITuberKitのAIキャラクターとの対話をインストールなしで試せます。',
  },
]

export default function AITuberPage() {
  return (
    <>
      <Meta
        canonicalPath="/aituber/"
        title="AITuberとは？AIキャラクター配信を作れるAITuberKit"
        description="AITuber（AI VTuber）の仕組みと作り方を解説。AITuberKitなら、VRM・Live2D・PNGTuber、LLM、音声合成、YouTubeコメント連携を組み合わせ、AIキャラクターとの会話や配信をブラウザで体験・構築できます。"
        structuredData={faqStructuredData}
      />
      <main className="min-h-screen bg-slate-950 px-5 py-12 font-M_PLUS_2 text-slate-100 sm:px-8">
        <article className="mx-auto max-w-5xl">
          <header className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-fuchsia-400/10 p-7 shadow-2xl shadow-cyan-950/30 sm:p-12">
            <p className="mb-3 text-sm font-bold tracking-[0.2em] text-cyan-300">
              OPEN-SOURCE AI CHARACTER TOOLKIT
            </p>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              AITuberを、ブラウザから始めよう。
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              AITuberKitは、AIキャラクターとの会話やAITuber（AI
              VTuber）配信を体験・構築できるオープンソースのツールキットです。
              LLM、音声、アバター、配信コメント連携をひとつのWebアプリにまとめています。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-full bg-cyan-300 px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                AITuberKitを体験する
              </Link>
              <a
                href="https://docs.aituberkit.com/guide/quickstart"
                className="rounded-full border border-slate-500 px-6 py-3 text-center font-bold transition hover:border-cyan-300 hover:text-cyan-300"
              >
                作り方を見る
              </a>
            </div>
          </header>

          <section className="py-14" aria-labelledby="about-aituber">
            <h2 id="about-aituber" className="text-2xl font-black sm:text-3xl">
              AITuber（AI VTuber）とは
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300">
              AITuberは、生成AIによる会話、音声合成、VRMやLive2Dなどのアバターを組み合わせて活動するAIキャラクターです。
              視聴者のコメントに応答するライブ配信だけでなく、Webサイトでの接客、イベント案内、デジタルサイネージなどにも活用できます。
              AITuberKitは、それらに必要な要素を自分で組み合わせて試せる実装基盤です。
            </p>
          </section>

          <section aria-labelledby="features">
            <h2 id="features" className="text-2xl font-black sm:text-3xl">
              AITuberKitでできること
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <section
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
                >
                  <h3 className="text-lg font-bold text-cyan-300">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {feature.description}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section className="py-14" aria-labelledby="start">
            <h2 id="start" className="text-2xl font-black sm:text-3xl">
              AITuberを始める3つの方法
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              <li className="rounded-2xl bg-slate-900 p-6">
                <span className="text-sm font-bold text-cyan-300">01</span>
                <h3 className="mt-2 font-bold">デモで会話する</h3>
                <p className="mt-2 leading-7 text-slate-300">
                  ブラウザでAIキャラクターとの会話を体験します。
                </p>
              </li>
              <li className="rounded-2xl bg-slate-900 p-6">
                <span className="text-sm font-bold text-cyan-300">02</span>
                <h3 className="mt-2 font-bold">ローカルで構築する</h3>
                <p className="mt-2 leading-7 text-slate-300">
                  GitHubから取得し、自分のAPIキーやモデルを設定します。
                </p>
              </li>
              <li className="rounded-2xl bg-slate-900 p-6">
                <span className="text-sm font-bold text-cyan-300">03</span>
                <h3 className="mt-2 font-bold">配信・アプリへ発展</h3>
                <p className="mt-2 leading-7 text-slate-300">
                  YouTube連携や外部APIを使い、用途に合わせて拡張します。
                </p>
              </li>
            </ol>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-black sm:text-3xl">
              AITuberKitについてよくある質問
            </h2>
            <div className="mt-6 space-y-4">
              {faq.map(({ question, answer }) => (
                <details
                  key={question}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 open:border-cyan-400/40"
                >
                  <summary className="cursor-pointer font-bold">
                    {question}
                  </summary>
                  <p className="mt-4 leading-7 text-slate-300">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <footer className="mt-14 border-t border-slate-800 py-10 text-sm text-slate-400">
            <nav aria-label="関連リンク" className="flex flex-wrap gap-5">
              <Link href="/" className="hover:text-cyan-300">
                デモサイト
              </Link>
              <a
                href="https://docs.aituberkit.com/"
                className="hover:text-cyan-300"
              >
                公式ドキュメント
              </a>
              <a
                href="https://github.com/tegnike/aituber-kit"
                className="hover:text-cyan-300"
              >
                GitHub
              </a>
            </nav>
          </footer>
        </article>
      </main>
    </>
  )
}
