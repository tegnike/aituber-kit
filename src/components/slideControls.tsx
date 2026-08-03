import React from 'react'
import { IconButton } from './iconButton'
import type { PresentationPlaybackState } from '@/features/presentation/presentationTypes'

interface SlideControlsProps {
  currentSlide: number
  slideCount: number
  isPlaying: boolean
  prevSlide: () => void
  nextSlide: () => void
  toggleIsPlaying: () => void
  showPlayButton?: boolean // 中央ボタン表示制御用プロパティ (オプショナル)
  currentSectionTitle?: string
  playbackState?: PresentationPlaybackState
  nextSection?: () => void
}

const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  slideCount,
  isPlaying,
  prevSlide,
  nextSlide,
  toggleIsPlaying,
  showPlayButton = true, // デフォルトは表示する
  currentSectionTitle,
  playbackState,
  nextSection,
}) => {
  return (
    <div className="flex flex-col items-center mt-5 gap-2">
      {currentSectionTitle && (
        <div className="theme-surface-elevated rounded-lg border px-3 py-1 text-sm text-text1">
          {currentSectionTitle}
          {playbackState === 'section_paused' && '（セクション停止中）'}
        </div>
      )}
      <div
        className="flex justify-center items-center gap-8"
        data-testid="slide-controls"
        data-current-slide={currentSlide}
        data-slide-count={slideCount}
        data-playing={isPlaying}
      >
        {' '}
        {/* Tailwindを使って中央揃えと間隔調整 */}
        {/* 各ボタンから mx-16 を削除し、親要素の gap で間隔を制御 */}
        <IconButton
          iconName="24/Prev"
          disabled={currentSlide === 0 || (showPlayButton && isPlaying)} // isPlayingの無効化はshowPlayButtonがtrueの時のみ考慮
          onClick={prevSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-theme rounded-2xl py-2 px-4 text-center" // mx-16削除
          data-testid="slide-prev-button"
        />
        {showPlayButton && (
          <IconButton
            iconName={isPlaying ? '24/PauseAlt' : '24/Play'}
            onClick={toggleIsPlaying}
            isProcessing={false}
            className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-theme rounded-2xl py-2 px-4 text-center" // mx-16削除
            aria-pressed={isPlaying}
            data-testid="slide-play-toggle-button"
          />
        )}
        <IconButton
          iconName="24/Next"
          disabled={
            currentSlide === slideCount - 1 || (showPlayButton && isPlaying)
          } // isPlayingの無効化はshowPlayButtonがtrueの時のみ考慮
          onClick={nextSlide}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-theme rounded-2xl py-2 px-4 text-center" // mx-16削除
          data-testid="slide-next-button"
        />
        {nextSection && (
          <button
            type="button"
            onClick={nextSection}
            className="bg-primary hover:bg-primary-hover text-theme rounded-2xl py-2 px-4 text-sm font-bold"
            data-testid="presentation-next-section-button"
          >
            次のセクション
          </button>
        )}
      </div>
    </div>
  )
}

export default SlideControls
