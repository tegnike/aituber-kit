import React from 'react'
import { IconButton } from './iconButton'

interface SlideControlsProps {
  currentSlide: number
  slideCount: number
  isPlaying: boolean
  prevSlide: () => void
  nextSlide: () => void
  toggleIsPlaying: () => void
}

const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  slideCount,
  isPlaying,
  prevSlide,
  nextSlide,
  toggleIsPlaying,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
      }}
    >
      <div>
        <IconButton
          iconName="24/Prev"
          disabled={currentSlide === 0 || isPlaying}
          onClick={prevSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-2xl py-2 px-4 text-center mx-16"
        />
        <IconButton
          iconName={isPlaying ? '24/PauseAlt' : '24/Play'}
          onClick={toggleIsPlaying}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-2xl py-2 px-4 text-center mx-16"
        />
        <IconButton
          iconName="24/Next"
          disabled={currentSlide === slideCount - 1 || isPlaying}
          onClick={nextSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-2xl py-2 px-4 text-center mx-16"
        />
      </div>
    </div>
  )
}

export default SlideControls
