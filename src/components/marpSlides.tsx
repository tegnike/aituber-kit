import React, { useState } from 'react'
import { Marp } from '@marp-team/marp-react'
import { MarpOptions } from '@marp-team/marp-core'
import { IconButton } from './iconButton'
import slideStore from '../features/stores/slide'

interface MarpSlidesProps {
  markdown: string
}

const MarpSlides: React.FC<MarpSlidesProps> = ({ markdown }) => {
  const isPlaying = slideStore((state) => state.isPlaying)
  const currentSlide = slideStore((state) => state.currentSlide)

  const slides: string[] = markdown.split('---').map((slide) => slide.trim())

  const nextSlide = () => {
    slideStore.setState({
      currentSlide: Math.min(currentSlide + 1, slides.length - 1),
    })
  }

  const prevSlide = () => {
    slideStore.setState({
      currentSlide: Math.max(currentSlide - 1, 0),
    })
  }

  const goToSlide = (index: number) => {
    slideStore.setState({
      currentSlide: index,
    })
  }

  const toggleIsPlaying = () => {
    const newIsPlaying = !isPlaying
    slideStore.setState({
      isPlaying: newIsPlaying,
    })
    if (newIsPlaying) {
      console.log(getCurrentLines())
    }
  }

  const getCurrentLines = () => {
    const scripts = require('../../public/slides/demo/scripts.json')
    const currentScript = scripts.find(
      (script: { page: number }) => script.page === currentSlide
    )
    return currentScript ? currentScript.line : ''
  }

  const customTheme = `
    /* @theme custom */

    section {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
      box-sizing: border-box;
      background-color: #ffffff;
    }

    h1 {
      font-size: 2.5em;
      color: #333;
      margin-bottom: 0.5em;
    }

    h2 {
      font-size: 1.8em;
      color: #555;
      margin-bottom: 0.5em;
    }

    ul {
      font-size: 1.2em;
      color: #444;
      margin-left: 1em;
    }

    li {
      margin-bottom: 0.5em;
    }
  `

  const marpOptions: MarpOptions = {
    inlineSVG: true,
  }

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
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <Marp
            markdown={`<!-- ${customTheme} -->\n${slides[currentSlide]}`}
            options={marpOptions}
          />
        </div>
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
            disabled={currentSlide === slides.length - 1 || isPlaying}
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
          display: 'none',
        }}
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <button key={num} onClick={() => goToSlide(num - 1)}>
            {`Go to Slide ${num}`}
          </button>
        ))}
      </div>
    </div>
  )
}
export default MarpSlides
