import React, { useEffect, useState, useCallback, useRef } from 'react'
import slideStore from '@/features/stores/slide'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { speakMessageHandler } from '@/features/chat/handlers'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { Live2DHandler } from '@/features/messages/live2dHandler'
import { EmotionType } from '@/features/messages/messages'
import SlideContent from './slideContent'
import SlideControls from './slideControls'

// gtag型定義
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void
  }
}

// Google Analytics イベント送信
const trackSlideView = (
  slideDocs: string,
  page: number,
  totalPages: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'slide_view', {
      slide_docs: slideDocs,
      page_number: page,
      total_pages: totalPages,
      progress_percent: Math.round((page / totalPages) * 100),
    })
  }
}

// 最終ページ到達時のSlack通知
const notifySlideCompletion = async (
  slideDocs: string,
  totalPages: number,
  startTime: Date | null
): Promise<void> => {
  try {
    const endTime = new Date()
    const startTimeStr = startTime
      ? startTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      : '不明'
    const endTimeStr = endTime.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
    })

    // 経過時間を計算
    let durationStr = '不明'
    if (startTime) {
      const durationMs = endTime.getTime() - startTime.getTime()
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)
      durationStr = `${minutes}分${seconds}秒`
    }

    await fetch('/api/slack-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slideDocs,
        totalPages,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: durationStr,
      }),
    })
    console.log('%c📨 Slack notification sent', 'color: #e01e5a')
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

// 感情タグを解析して最初の感情を取得
const parseFirstEmotion = (line: string): EmotionType => {
  const match = line.match(/\[(neutral|happy|sad|angry|surprised|relaxed)\]/)
  return (match ? match[1] : 'neutral') as EmotionType
}

// 事前生成音声ファイルのパスを取得
const getPreGeneratedAudioPath = (slideDocs: string, page: number): string => {
  return `/slides/${slideDocs}/audio/page${page}.mp3`
}

// 事前生成音声ファイルが存在するかチェック
const checkAudioExists = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// 音声ファイルのプリロードキャッシュ
const audioCache = new Map<string, ArrayBuffer>()

// 音声ファイルをプリロード（1ページ先まで）
const preloadAudio = async (
  slideDocs: string,
  currentPage: number,
  totalPages: number
): Promise<void> => {
  const pagesToPreload = [currentPage, currentPage + 1].filter(
    (p) => p >= 0 && p < totalPages
  )

  slideStore.setState({
    audioPreload: {
      isLoading: true,
      progress: 0,
      loadedPages: new Set<number>(),
      error: null,
    },
  })

  const loadedPages = new Set<number>()

  for (let i = 0; i < pagesToPreload.length; i++) {
    const page = pagesToPreload[i]
    const audioPath = getPreGeneratedAudioPath(slideDocs, page)

    try {
      // キャッシュにあればスキップ
      if (audioCache.has(audioPath)) {
        loadedPages.add(page)
        continue
      }

      const exists = await checkAudioExists(audioPath)
      if (exists) {
        const response = await fetch(audioPath)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          audioCache.set(audioPath, buffer)
          loadedPages.add(page)
        }
      }
    } catch (error) {
      console.warn(`Failed to preload audio for page ${page}:`, error)
      // エラーでも続行（先読み失敗は致命的ではない）
    }

    // プログレス更新
    slideStore.setState({
      audioPreload: {
        isLoading: true,
        progress: Math.round(((i + 1) / pagesToPreload.length) * 100),
        loadedPages,
        error: null,
      },
    })
  }

  slideStore.setState({
    audioPreload: {
      isLoading: false,
      progress: 100,
      loadedPages,
      error: null,
    },
  })
}

// キャッシュから音声を取得
const getCachedAudio = (audioPath: string): ArrayBuffer | undefined => {
  return audioCache.get(audioPath)
}

// 音声の長さを取得（秒）
const getAudioDuration = async (audioBuffer: ArrayBuffer): Promise<number> => {
  const audioContext = new AudioContext()
  const decodedBuffer = await audioContext.decodeAudioData(audioBuffer.slice(0))
  const duration = decodedBuffer.duration
  await audioContext.close()
  return duration
}

// テキストを句読点で分割
const splitTextByPunctuation = (text: string): string[] => {
  // 句読点で分割（。！？、で区切るが、区切り文字は含める）
  const segments = text.split(/(?<=[。！？、])/g).filter((s) => s.trim())
  // 短すぎるセグメントは次と結合
  const result: string[] = []
  let current = ''
  for (const segment of segments) {
    current += segment
    // 10文字以上、または最後の句点(。！？)で区切る
    if (current.length >= 10 || /[。！？]$/.test(current)) {
      result.push(current.trim())
      current = ''
    }
  }
  if (current.trim()) {
    result.push(current.trim())
  }
  return result.length > 0 ? result : [text]
}

// 事前生成音声を再生（キャッシュ優先）- 音声長を返す
const playPreGeneratedAudio = async (
  audioPath: string,
  emotion: EmotionType
): Promise<number> => {
  const ss = settingsStore.getState()
  const hs = homeStore.getState()

  try {
    // キャッシュから取得を試みる
    let audioBuffer = getCachedAudio(audioPath)

    if (!audioBuffer) {
      // キャッシュになければfetch
      const response = await fetch(audioPath)
      if (!response.ok) throw new Error('Audio file not found')
      audioBuffer = await response.arrayBuffer()
      // キャッシュに保存
      audioCache.set(audioPath, audioBuffer)
    }

    // 音声の長さを取得
    const duration = await getAudioDuration(audioBuffer)

    homeStore.setState({ isSpeaking: true })

    // VRM/Live2D に音声を再生させる
    if (ss.modelType === 'live2d') {
      await Live2DHandler.speak(
        audioBuffer,
        { message: '', emotion },
        true // MP3はデコードが必要
      )
    } else if (hs.viewer.model) {
      await hs.viewer.model.speak(audioBuffer, { message: '', emotion }, true)
    }

    homeStore.setState({ isSpeaking: false })
    return duration
  } catch (error) {
    console.error('Failed to play pre-generated audio:', error)
    throw error
  }
}

interface SlidesProps {
  markdown: string
}

export const goToSlide = (index: number) => {
  slideStore.setState({
    currentSlide: index,
  })
}

const Slides: React.FC<SlidesProps> = () => {
  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const isPlaying = slideStore((state) => state.isPlaying)
  const isReverse = slideStore((state) => state.isReverse)
  const currentSlide = slideStore((state) => state.currentSlide)
  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const autoPlay = slideStore((state) => state.autoPlay)
  const audioPreload = slideStore((state) => state.audioPreload)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const [slideCount, setSlideCount] = useState(0)
  const [autoPlayTriggered, setAutoPlayTriggered] = useState(false)
  const [waitingForUserGesture, setWaitingForUserGesture] = useState(false)
  const [completionNotified, setCompletionNotified] = useState(false)
  const [presentationStartTime, setPresentationStartTime] =
    useState<Date | null>(null)
  const prevChatProcessingCountRef = useRef(chatProcessingCount)

  useEffect(() => {
    const currentMarpitContainer = document.querySelector('.marpit')
    if (currentMarpitContainer) {
      const slides = currentMarpitContainer.querySelectorAll(':scope > svg')
      slides.forEach((slide, i) => {
        const svgElement = slide as SVGElement
        if (i === currentSlide) {
          svgElement.style.display = 'block'
        } else {
          svgElement.style.display = 'none'
        }
      })
    }
  }, [currentSlide, marpitContainer])

  useEffect(() => {
    // selectedSlideDocsが空の場合はスキップ
    if (!selectedSlideDocs) {
      console.log('⏳ Waiting for slide selection...')
      return
    }

    const convertMarkdown = async () => {
      console.log(`📑 Loading slides: ${selectedSlideDocs}`)
      const response = await fetch('/api/convertMarkdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slideName: selectedSlideDocs }),
      })

      if (!response.ok) {
        console.error(`❌ Failed to load slides: ${response.status}`)
        return
      }

      const data = await response.json()

      // HTMLをパースしてmarpit要素を取得
      const parser = new DOMParser()
      const doc = parser.parseFromString(data.html, 'text/html')
      const marpitElement = doc.querySelector('.marpit')
      setMarpitContainer(marpitElement)

      // スライド数を設定
      if (marpitElement) {
        const slides = marpitElement.querySelectorAll(':scope > svg')
        setSlideCount(slides.length)
        console.log(`✅ Slides loaded: ${slides.length} pages`)

        // 初期状態で最初のスライドを表示
        slides.forEach((slide, i) => {
          if (i === 0) {
            slide.removeAttribute('hidden')
          } else {
            slide.setAttribute('hidden', '')
          }
        })
      }

      // CSSを動的に適用
      const styleElement = document.createElement('style')
      styleElement.textContent = data.css
      document.head.appendChild(styleElement)

      return () => {
        document.head.removeChild(styleElement)
      }
    }

    convertMarkdown()
  }, [selectedSlideDocs])

  useEffect(() => {
    // カスタムCSSを適用
    const customStyle = `
      div.marpit > svg > foreignObject > section {
        padding: 2em;
      }
      /* 背景画像を右上に配置 */
      div.marpit > svg > foreignObject > section figure[data-marpit-advanced-background-container] {
        align-items: flex-start !important;
      }
      div.marpit > svg > foreignObject > section figure img {
        object-position: top !important;
      }
    `
    const styleElement = document.createElement('style')
    styleElement.textContent = customStyle
    document.head.appendChild(styleElement)

    // コンポーネントのアンマウント時にスタイルを削除
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const readSlide = useCallback(
    async (slideIndex: number) => {
      const getCurrentLines = () => {
        const scripts = require(
          `../../public/slides/${selectedSlideDocs}/scripts.json`
        )
        const currentScript = scripts.find(
          (script: { page: number }) => script.page === slideIndex
        )
        return currentScript ? currentScript.line : ''
      }

      const currentLines = getCurrentLines()

      // 事前生成音声ファイルのパスをチェック
      const audioPath = getPreGeneratedAudioPath(selectedSlideDocs, slideIndex)
      const audioExists = await checkAudioExists(audioPath)

      if (audioExists) {
        // 事前生成音声があれば再生
        console.log(
          `%c🎵 [MP3] Slide ${slideIndex}: ${audioPath}`,
          'color: #4ade80; font-weight: bold'
        )
        const emotion = parseFirstEmotion(currentLines)

        // 感情タグを除去して字幕を設定
        const subtitleText = currentLines.replace(
          /\[(neutral|happy|sad|angry|surprised|relaxed)\]/g,
          ''
        )

        // テキストを句読点で分割
        const subtitleSegments = splitTextByPunctuation(subtitleText)
        console.log(
          `%c📝 [MP3] Segments: ${subtitleSegments.length}`,
          'color: #4ade80'
        )

        // chatProcessingCount を増やして再生開始
        homeStore.getState().incrementChatProcessingCount()

        // 字幕タイマーのIDを保持
        const subtitleTimers: NodeJS.Timeout[] = []
        let subtitleCleanedUp = false

        // 字幕クリーンアップ関数
        const cleanupSubtitles = () => {
          if (subtitleCleanedUp) return
          subtitleCleanedUp = true
          subtitleTimers.forEach((timer) => clearTimeout(timer))
          homeStore.setState({ slideMessages: [] })
        }

        try {
          // 最初の字幕を表示
          homeStore.setState({ slideMessages: [subtitleSegments[0]] })

          // 音声再生開始（durationを取得）
          const audioPromise = playPreGeneratedAudio(audioPath, emotion)

          // 音声の長さを先に取得してタイマーをセット
          const audioBuffer = getCachedAudio(audioPath)
          if (audioBuffer && subtitleSegments.length > 1) {
            const duration = await getAudioDuration(audioBuffer)
            const segmentDuration = (duration * 1000) / subtitleSegments.length

            // 各セグメントの表示タイミングをスケジュール
            for (let i = 1; i < subtitleSegments.length; i++) {
              const timer = setTimeout(() => {
                if (!subtitleCleanedUp) {
                  homeStore.setState({ slideMessages: [subtitleSegments[i]] })
                }
              }, segmentDuration * i)
              subtitleTimers.push(timer)
            }
          }

          // 音声再生完了を待つ
          await audioPromise
        } catch (error) {
          // 音声再生に失敗した場合は TTS にフォールバック
          console.log(
            `%c⚠️ [MP3→API] Fallback to TTS API: ${error}`,
            'color: #fbbf24; font-weight: bold'
          )
          cleanupSubtitles()
          // プリ生成音声の処理が終わったのでカウントを減らす
          homeStore.getState().decrementChatProcessingCount()
          // TTS は自身で chatProcessingCount を管理する
          speakMessageHandler(currentLines)
          return
        }

        // 再生完了後に字幕をクリア
        cleanupSubtitles()
        // 再生完了後にカウントを減らす
        console.log(`%c✅ [MP3] Slide ${slideIndex} finished`, 'color: #4ade80')
        homeStore.getState().decrementChatProcessingCount()
      } else {
        // なければ TTS API を使用
        console.log(
          `%c🔊 [API] Slide ${slideIndex}: Using TTS API`,
          'color: #60a5fa; font-weight: bold'
        )
        console.log(
          `%c📝 [API] Text: ${currentLines.substring(0, 50)}...`,
          'color: #60a5fa'
        )
        speakMessageHandler(currentLines)
      }
    },
    [selectedSlideDocs]
  )

  const nextSlide = useCallback(() => {
    const state = slideStore.getState()
    const newSlide = Math.min(state.currentSlide + 1, slideCount - 1)
    slideStore.setState({ currentSlide: newSlide })
    return newSlide
  }, [slideCount])

  // スライド変更時にgtagでトラッキング
  useEffect(() => {
    if (slideCount > 0 && selectedSlideDocs) {
      trackSlideView(selectedSlideDocs, currentSlide, slideCount)
    }
  }, [currentSlide, slideCount, selectedSlideDocs])

  useEffect(() => {
    // 最後/最初のスライドに達した場合、isPlayingをfalseに設定
    if (isReverse) {
      if (currentSlide === 0 && chatProcessingCount === 0) {
        slideStore.setState({ isPlaying: false })
      }
    } else {
      if (currentSlide === slideCount - 1 && chatProcessingCount === 0) {
        slideStore.setState({ isPlaying: false })
        // 最終ページ到達時にSlack通知（1回のみ）
        if (!completionNotified && slideCount > 0) {
          setCompletionNotified(true)
          notifySlideCompletion(
            selectedSlideDocs,
            slideCount,
            presentationStartTime
          )
          // gtag で完了イベントも送信
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'slide_completed', {
              slide_docs: selectedSlideDocs,
              total_pages: slideCount,
            })
          }
          // 終了時にコントロールパネルを表示して自由会話モードへ
          settingsStore.setState({ showControlPanel: true })
          slideStore.setState({ freeConversationMode: true })
          console.log('🎤 Free conversation mode enabled')
        }
      }
    }
  }, [
    currentSlide,
    slideCount,
    chatProcessingCount,
    isReverse,
    completionNotified,
    selectedSlideDocs,
    presentationStartTime,
  ])

  const prevSlide = useCallback(() => {
    const state = slideStore.getState()
    const newSlide = Math.max(state.currentSlide - 1, 0)
    slideStore.setState({ currentSlide: newSlide })
    return newSlide
  }, [])

  const toggleIsPlaying = () => {
    const newIsPlaying = !isPlaying
    slideStore.setState({
      isPlaying: newIsPlaying,
    })
    if (newIsPlaying) {
      readSlide(currentSlide)
    } else {
      homeStore.setState({ isSpeaking: false })
      SpeakQueue.stopAll()
    }
  }

  const toggleReverse = () => {
    slideStore.setState((state) => ({
      isReverse: !state.isReverse,
    }))
  }

  const goToLastSlide = useCallback(() => {
    slideStore.setState({ currentSlide: slideCount - 1 })
  }, [slideCount])

  // chatProcessingCount が 0 に変化したときのみ次/前のスライドに進む
  useEffect(() => {
    const prevCount = prevChatProcessingCountRef.current
    prevChatProcessingCountRef.current = chatProcessingCount

    // 0 に変化したときのみ処理（無限ループ防止）
    if (prevCount > 0 && chatProcessingCount === 0 && isPlaying) {
      if (isReverse) {
        if (currentSlide > 0) {
          const newSlide = prevSlide()
          readSlide(newSlide)
        }
      } else {
        if (currentSlide < slideCount - 1) {
          const newSlide = nextSlide()
          readSlide(newSlide)
        }
      }
    }
  }, [
    chatProcessingCount,
    isPlaying,
    isReverse,
    currentSlide,
    slideCount,
    nextSlide,
    prevSlide,
    readSlide,
  ])

  // autoPlayがtrueになったらautoPlayTriggeredをリセット
  useEffect(() => {
    if (autoPlay) {
      setAutoPlayTriggered(false)
    }
  }, [autoPlay])

  // 自動再生：スライドロード完了後にユーザージェスチャーを待つ
  useEffect(() => {
    if (slideCount > 0 && autoPlay && !autoPlayTriggered && !isPlaying) {
      console.log('🚀 Auto-play: Waiting for user gesture')
      setAutoPlayTriggered(true)
      slideStore.setState({ autoPlay: false, currentSlide: 0 })
      setWaitingForUserGesture(true)
    }
  }, [slideCount, autoPlay, autoPlayTriggered, isPlaying])

  // ユーザージェスチャーで再生開始
  const handleStartPresentation = useCallback(() => {
    console.log('▶️ User gesture received, starting presentation')
    setWaitingForUserGesture(false)
    setPresentationStartTime(new Date())
    slideStore.setState({ isPlaying: true })
    readSlide(0)
  }, [readSlide])

  // 音声ファイルの先読み（現在のスライド + 次のスライドのみ）
  useEffect(() => {
    if (slideCount > 0 && selectedSlideDocs) {
      // 非同期でプリロード（try-catch でエラーハンドリング済み）
      preloadAudio(selectedSlideDocs, currentSlide, slideCount).catch(
        (error) => {
          console.error('Audio preload failed:', error)
          slideStore.setState({
            audioPreload: {
              isLoading: false,
              progress: 0,
              loadedPages: new Set<number>(),
              error: String(error),
            },
          })
        }
      )
    }
  }, [currentSlide, slideCount, selectedSlideDocs])

  // スライドの縦のサイズを70%に制限し、アスペクト比を維持
  const calculateSlideSize = () => {
    // 縦のサイズの上限を70vhに設定
    const maxHeight = '70vh'
    // 横幅をアスペクト比に合わせて計算（16:9）
    const width = 'calc(70vh * (16 / 9))'
    // 横幅が大きすぎる場合は80vwを上限とする
    const maxWidth = '80vw'

    return {
      width: `min(${width}, ${maxWidth})`,
      height: `min(calc(${maxWidth} * (9 / 16)), ${maxHeight})`,
    }
  }

  const slideSize = calculateSlideSize()

  return (
    <div
      className="flex flex-col justify-center"
      style={{
        height: '100vh',
        padding: '10px 0',
        position: 'absolute',
        width: '100%',
      }}
    >
      <div
        style={{
          width: slideSize.width,
          height: slideSize.height,
          marginLeft: '2%',
          position: 'relative',
        }}
      >
        <SlideContent marpitContainer={marpitContainer} />
      </div>
      <div
        style={{
          width: slideSize.width,
          marginLeft: '2%',
          marginTop: '10px',
          position: 'relative',
          zIndex: 10,
          visibility: showControlPanel ? 'visible' : 'hidden',
          opacity: showControlPanel ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <SlideControls
          currentSlide={currentSlide}
          slideCount={slideCount}
          isPlaying={isPlaying}
          isReverse={isReverse}
          prevSlide={prevSlide}
          nextSlide={nextSlide}
          toggleIsPlaying={toggleIsPlaying}
          toggleReverse={toggleReverse}
          goToLastSlide={goToLastSlide}
        />
        {/* 音声プリロード進捗表示 */}
        {audioPreload.isLoading && (
          <div
            style={{
              marginTop: '8px',
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${audioPreload.progress}%`,
                height: '100%',
                backgroundColor: '#4ade80',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* クリックして開始モーダル */}
      {waitingForUserGesture && (
        <div
          onClick={handleStartPresentation}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              backgroundColor: '#4ade80',
              color: '#000',
              padding: '24px 48px',
              borderRadius: '16px',
              fontSize: '24px',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}
          >
            ▶ クリックして開始
          </div>
        </div>
      )}
    </div>
  )
}
export default Slides
