import React from 'react'
import { IconButton } from './iconButton'

interface SlideControlsProps {
  currentSlide: number
  slideCount: number
  isPlaying: boolean
  prevSlide: () => void
  nextSlide: () => void
  toggleIsPlaying: () => void
  obsConnected?: boolean
  isRecording?: boolean
}

const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  slideCount,
  isPlaying,
  prevSlide,
  nextSlide,
  toggleIsPlaying,
  obsConnected,
  isRecording,
}) => {
  return (
    <div className="flex items-center justify-center bg-gray-100 p-2 rounded-lg">
      <div>
        <IconButton
          iconName="24/Prev"
          disabled={currentSlide === 0 || isPlaying}
          onClick={prevSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
        />
        <IconButton
          iconName={isPlaying ? '24/PauseAlt' : '24/Play'}
          onClick={toggleIsPlaying}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
        />
        <IconButton
          iconName="24/Next"
          disabled={currentSlide === slideCount - 1 || isPlaying}
          onClick={nextSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-white rounded-16 py-8 px-16 text-center mx-16"
        />
      </div>
      
      {/* OBS接続状態と録画状態を表示 */}
      {obsConnected !== undefined && (
        <div className="ml-4 flex items-center">
          <span className={`w-3 h-3 rounded-full mr-1 ${obsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-xs">OBS {obsConnected ? '接続中' : '未接続'}</span>
          
          {obsConnected && isRecording !== undefined && (
            <div className="ml-2 flex items-center">
              <span className={`w-3 h-3 rounded-full mr-1 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="text-xs">{isRecording ? '録画中' : '録画停止'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SlideControls
