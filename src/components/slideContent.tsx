import React from 'react'

interface SlideContentProps {
  marpitContainer: Element | null
}

const SlideContent: React.FC<SlideContentProps> = ({ marpitContainer }) => {
  return (
    <div
      data-testid="slide-content"
      style={{
        aspectRatio: '16 / 9',
        background: '#f4f7ff',
        border: '2px solid #333',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {marpitContainer && (
        <div
          data-testid="slide-marpit-container"
          style={{
            background: '#f4f7ff',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: marpitContainer.outerHTML }}
        />
      )}
    </div>
  )
}

export default SlideContent
