import React from 'react';

// コンポーネントではなくクラスとして定義
export class CammicApp {
  private recognition: SpeechRecognition | null = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private currentTranscript: string = '';
  private audioStream: MediaStream | null = null;
  private isRecognizing: boolean = false; // Add a more reliable state tracking variable

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
        this.isRecognizing = true;
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isRecognizing = false;
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
        this.isRecognizing = false;
        
        // Attempt to restart recognition on certain errors, but not on "aborted" or "not-allowed"
        if (this.recognition && event.error !== 'aborted' && event.error !== 'not-allowed') {
          setTimeout(() => {
            if (!this.isRecognizing) {
              this.start().catch(err => console.error('Failed to restart recognition:', err));
            }
          }, 1000);
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

      if (!this.isRecognizing) {
        this.recognition?.start();
      } else {
        console.log('Speech recognition is already running');
        // Don't throw an error here, just log and continue
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        // This is the error we're trying to fix
        console.log('Recognition already started. Setting isRecognizing to true');
        this.isRecognizing = true;
      } else {
        console.error('Failed to start speech recognition:', error);
        throw error;
      }
    }
  }

  public stop(): void {
    try {
      if (this.recognition && this.isRecognizing) {
        this.recognition.stop();
      }
      // オーディオストリームも停止
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Error stopping recognition:', error);
      // Force state reset even if stop failed
      this.isRecognizing = false;
    }
  }

  // Improve the recognition state check
  private isRecognitionActive(): boolean {
    return this.isRecognizing;
  }
}

export default CammicApp;