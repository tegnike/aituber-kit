import React, { useState } from 'react';
import { Marp } from '@marp-team/marp-react';

const MarpSlides = ({ markdown }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const slides = markdown.split('---').map(slide => slide.trim());

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
  `;

  return (
    <div>
      <div style={{
        width: 'calc(60vh * (16 / 9))',
        height: '60vh',
        overflow: 'hidden',
        border: '2px solid #333',
        boxSizing: 'border-box',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}>
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <Marp
            markdown={slides[currentSlide]}
            options={{
              inlineSVG: true,
              themeSet: { custom: customTheme },
              theme: 'custom',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={prevSlide} disabled={currentSlide === 0} style={buttonStyle}>Previous</button>
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} style={buttonStyle}>Next</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <button key={num} onClick={() => goToSlide(num - 1)} style={buttonStyle}>
            {`Go to Slide ${num}`}
          </button>
        ))}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 20px',
  margin: '0 10px',
  fontSize: '1em',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default MarpSlides;