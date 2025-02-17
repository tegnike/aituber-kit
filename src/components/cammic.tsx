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
    if (!this.recognition) {
      console.error('Speech recognition is not initialized');
      return;
    }

    try {
      // Check if recognition is already running
      const isStarted = this.isRecognitionActive();
      if (!isStarted) {
        this.recognition.start();
      } else {
        console.warn('Speech recognition is already running');
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // Add this new method to check recognition state
  private isRecognitionActive(): boolean {
    return this.recognition?.state === 'activated' || this.recognition?.state === 'listening';
  }
}

export default CammicApp;