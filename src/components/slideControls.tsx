import React from 'react'
import { IconButton } from './iconButton'

interface SlideControlsProps {
  currentSlide: number
  slideCount: number
  isPlaying: boolean
  isReverse?: boolean
  prevSlide: () => void
  nextSlide: () => void
  toggleIsPlaying: () => void
  toggleReverse?: () => void
  goToLastSlide?: () => void
  showPlayButton?: boolean // 中央ボタン表示制御用プロパティ (オプショナル)
}

const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  slideCount,
  isPlaying,
  isReverse = false,
  prevSlide,
  nextSlide,
  toggleIsPlaying,
  toggleReverse,
  goToLastSlide,
  showPlayButton = true, // デフォルトは表示する
}) => {
  return (
    <div className="flex justify-center items-center mt-5 gap-8">
      {' '}
      {/* Tailwindを使って中央揃えと間隔調整 */}
      {/* 各ボタンから mx-16 を削除し、親要素の gap で間隔を制御 */}
      <IconButton
        iconName="24/Prev"
        disabled={currentSlide === 0 || (showPlayButton && isPlaying)} // isPlayingの無効化はshowPlayButtonがtrueの時のみ考慮
        onClick={prevSlide}
        isProcessing={false}
        className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-theme rounded-2xl py-2 px-4 text-center" // mx-16削除
      />
      {showPlayButton && (
        <IconButton
          iconName={isPlaying ? '24/PauseAlt' : '24/Play'}
          onClick={toggleIsPlaying}
          isProcessing={false}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary-disabled text-theme rounded-2xl py-2 px-4 text-center" // mx-16削除
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
      />
      {/* 最終ページへジャンプ */}
      {goToLastSlide && (
        <IconButton
          iconName="24/Next"
          onClick={goToLastSlide}
          isProcessing={false}
          disabled={isPlaying || currentSlide === slideCount - 1}
          backgroundColor="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 disabled:bg-pink-300"
        />
      )}
      {/* 逆再生モード切り替え */}
      {toggleReverse && (
        <IconButton
          iconName="24/Reload"
          onClick={toggleReverse}
          isProcessing={false}
          disabled={isPlaying}
          backgroundColor={isReverse ? 'bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled' : 'bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled'}
        />
      )}
    </div>
  )
}

export default SlideControls
