import React, { useEffect, useState, useCallback } from 'react'
import { IconButton } from './iconButton'
import slideStore from '../features/stores/slide'
import homeStore from '../features/stores/home'
import { processReceivedMessage } from '../features/chat/handlers'

interface MarpSlidesProps {
  markdown: string
}

export const goToSlide = (index: number) => {
  slideStore.setState({
    currentSlide: index,
  })
}

const MarpSlides: React.FC<MarpSlidesProps> = ({ markdown }) => {
  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const isPlaying = slideStore((state) => state.isPlaying)
  const currentSlide = slideStore((state) => state.currentSlide)
  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const [slideCount, setSlideCount] = useState(0)

  useEffect(() => {
    const marpitContainer = document.querySelector('.marpit')
    if (marpitContainer) {
      const slides = marpitContainer.querySelectorAll(':scope > svg')
      slides.forEach((slide, i) => {
        const svgElement = slide as SVGElement
        if (i === currentSlide) {
          svgElement.style.display = 'block'
        } else {
          svgElement.style.display = 'none'
        }
      })
    }
  }, [currentSlide])

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
    (slideIndex: number) => {
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
      processReceivedMessage(currentLines)

      if (currentSlide === slideCount - 1) {
        slideStore.setState({
          isPlaying: false,
        })
      }
    },
    [currentSlide, selectedSlideDocs, slideCount]
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

  const prevSlide = useCallback(() => {
    slideStore.setState((state) => ({
      currentSlide: Math.max(state.currentSlide - 1, 0),
    }))
  }, [])

  const toggleIsPlaying = () => {
    const newIsPlaying = !isPlaying
    slideStore.setState({
      isPlaying: newIsPlaying,
    })
    if (newIsPlaying) {
      readSlide(currentSlide)
    }
  }

  useEffect(() => {
    if (
      chatProcessingCount === 0 &&
      isPlaying &&
      currentSlide < slideCount - 1
    ) {
      nextSlide()
    }
  }, [chatProcessingCount, isPlaying, nextSlide, currentSlide, slideCount])

  return (
    <div className="ml-16">
      <div
        style={{
          width: '60vw',
          height: 'calc(60vw * (9 / 16))',
          overflow: 'hidden',
          border: '2px solid #333',
          boxSizing: 'border-box',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}
      >
        {marpitContainer && (
          <div
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: marpitContainer.outerHTML }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px',
        }}
      >
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            iconName="24/Prev"
            disabled={currentSlide === 0 || isPlaying}
            onClick={prevSlide}
            isProcessing={false}
            className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
          ></IconButton>
          <IconButton
            iconName="24/Next"
            disabled={currentSlide === slideCount - 1 || isPlaying}
            onClick={nextSlide}
            isProcessing={false}
            className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
          ></IconButton>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            iconName={isPlaying ? '24/PauseAlt' : '24/Play'}
            onClick={toggleIsPlaying}
            isProcessing={false}
            className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
          />
        </div>
      </div>
    </div>
  )
}
export default MarpSlides
