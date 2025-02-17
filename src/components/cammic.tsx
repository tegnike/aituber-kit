import React from 'react';

// コンポーネントではなくクラスとして定義
export class CammicApp {
  private recognition: SpeechRecognition | null = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private currentTranscript: string = '';

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      this.currentTranscript = transcript;
      
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  public setTranscriptCallback(callback: (transcript: string) => void): void {
    this.onTranscriptCallback = callback;
  }

  public start(): void {
    if (this.recognition) {
      this.recognition.start();
    }
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export default CammicApp;