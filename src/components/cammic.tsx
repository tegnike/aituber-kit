import React from 'react';

// コンポーネントではなくクラスとして定義
export class CammicApp {
  private recognition: SpeechRecognition | null = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private currentTranscript: string = '';
  private audioStream: MediaStream | null = null;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private async initializeSpeechRecognition() {
    try {
      // Check if SpeechRecognition is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser');
      }

      // Get internal microphone
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const internalMic = audioInputs.find(device => 
        device.label.toLowerCase().includes('built-in') || 
        device.label.toLowerCase().includes('internal')
      );

      if (!internalMic) {
        throw new Error('Internal microphone not found');
      }

      // Request microphone permissions first
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: internalMic.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Initialize speech recognition after getting audio stream
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ja-JP';

      // Add onstart handler to confirm initialization
      this.recognition.onstart = () => {
        console.log('Speech recognition started successfully');
      };

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
        // Attempt to restart recognition on error
        if (this.recognition && this.isRecognitionActive()) {
          this.stop();
          this.start();
        }
      };

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      throw new Error(`Speech recognition initialization failed: ${error.message}`);
    }
  }

  public setTranscriptCallback(callback: (transcript: string) => void): void {
    this.onTranscriptCallback = callback;
  }

  // Modify start method to ensure initialization is complete
  public async start(): Promise<void> {
    try {
      if (!this.recognition) {
        await this.initializeSpeechRecognition();
      }

      if (!this.isRecognitionActive()) {
        this.recognition?.start();
      } else {
        console.warn('Speech recognition is already running');
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      throw error;
    }
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    // オーディオストリームも停止
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
  }

  // Add this new method to check recognition state
  private isRecognitionActive(): boolean {
    return this.recognition?.state === 'activated' || this.recognition?.state === 'listening';
  }
}

export default CammicApp;