import React, { useEffect, useState, useCallback } from 'react'
import slideStore from '@/features/stores/slide'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { speakMessageHandler } from '@/features/chat/handlers'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { Live2DHandler } from '@/features/messages/live2dHandler'
import { EmotionType } from '@/features/messages/messages'
import SlideContent from './slideContent'
import SlideControls from './slideControls'

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

// 事前生成音声を再生
const playPreGeneratedAudio = async (
  audioPath: string,
  emotion: EmotionType
): Promise<void> => {
  const ss = settingsStore.getState()
  const hs = homeStore.getState()

  try {
    const response = await fetch(audioPath)
    if (!response.ok) throw new Error('Audio file not found')

    const audioBuffer = await response.arrayBuffer()

    homeStore.setState({ isSpeaking: true })

    // VRM/Live2D に音声を再生させる
    if (ss.modelType === 'live2d') {
      await Live2DHandler.speak(
        audioBuffer,
        { message: '', emotion },
        false // MP3はデコード不要
      )
    } else if (hs.viewer.model) {
      await hs.viewer.model.speak(audioBuffer, { message: '', emotion }, false)
    }

    homeStore.setState({ isSpeaking: false })
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

const Slides: React.FC<SlidesProps> = ({ markdown }) => {
  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const isPlaying = slideStore((state) => state.isPlaying)
  const isReverse = slideStore((state) => state.isReverse)
  const currentSlide = slideStore((state) => state.currentSlide)
  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const [slideCount, setSlideCount] = useState(0)

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
    const convertMarkdown = async () => {
      const response = await fetch('/api/convertMarkdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slideName: selectedSlideDocs }),
      })
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
      console.log(currentLines)

      // 事前生成音声ファイルのパスをチェック
      const audioPath = getPreGeneratedAudioPath(selectedSlideDocs, slideIndex)
      const audioExists = await checkAudioExists(audioPath)

      if (audioExists) {
        // 事前生成音声があれば再生
        console.log(`🎵 Playing pre-generated audio: ${audioPath}`)
        const emotion = parseFirstEmotion(currentLines)
        try {
          await playPreGeneratedAudio(audioPath, emotion)
        } catch {
          // 音声再生に失敗した場合は TTS にフォールバック
          console.log('⚠️ Fallback to TTS')
          speakMessageHandler(currentLines)
        }
      } else {
        // なければ TTS API を使用
        console.log('🔊 Using TTS API')
        speakMessageHandler(currentLines)
      }
    },
    [selectedSlideDocs]
  )

  const nextSlide = useCallback(() => {
    slideStore.setState((state) => {
      const newSlide = Math.min(state.currentSlide + 1, slideCount - 1)
      if (isPlaying) {
        readSlide(newSlide)
      }
      return { currentSlide: newSlide }
    })
  }, [isPlaying, readSlide, slideCount])

  useEffect(() => {
    // 最後/最初のスライドに達した場合、isPlayingをfalseに設定
    if (isReverse) {
      if (currentSlide === 0 && chatProcessingCount === 0) {
        slideStore.setState({ isPlaying: false })
      }
    } else {
      if (currentSlide === slideCount - 1 && chatProcessingCount === 0) {
        slideStore.setState({ isPlaying: false })
      }
    }
  }, [currentSlide, slideCount, chatProcessingCount, isReverse])

  const prevSlide = useCallback(() => {
    slideStore.setState((state) => {
      const newSlide = Math.max(state.currentSlide - 1, 0)
      if (isPlaying && isReverse) {
        readSlide(newSlide)
      }
      return { currentSlide: newSlide }
    })
  }, [isPlaying, isReverse, readSlide])

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

  useEffect(() => {
    if (chatProcessingCount === 0 && isPlaying) {
      if (isReverse) {
        if (currentSlide > 0) {
          prevSlide()
        }
      } else {
        if (currentSlide < slideCount - 1) {
          nextSlide()
        }
      }
    }
  }, [
    chatProcessingCount,
    isPlaying,
    isReverse,
    nextSlide,
    prevSlide,
    currentSlide,
    slideCount,
  ])

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
      </div>
    </div>
  )
}
export default Slides
