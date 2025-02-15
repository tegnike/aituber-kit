import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Save, Settings } from 'lucide-react';

class CAMMICApp {
  private videoStream: MediaStream | null = null;
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private onTranscriptEndCallback: ((transcript: string) => void) | null = null;
  private hasPermission: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.setupRecognition();
    } else {
      throw new Error('Speech recognition is not supported in this browser');
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      // まず基本的な音声ストリームの取得を試みる
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('マイクストリームの取得に成功:', stream);
        // テストストリームをクリーンアップ
        stream.getTracks().forEach(track => track.stop());
        this.hasPermission = true;
        
        // 成功したら利用可能なデバイスを確認
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioDevices.length === 0) {
          console.warn('マイクデバイスが見つかりません');
          this.hasPermission = false;
          return false;
        }

        return true;

      } catch (streamError) {
        console.error('マイクストリームの取得に失敗:', streamError);
        
        // NotAllowedError の場合は権限が明示的に拒否されている
        if (streamError instanceof Error && streamError.name === 'NotAllowedError') {
          console.error('マイクの使用が拒否されています');
          this.hasPermission = false;
          return false;
        }
        
        // その他のエラーの場合
        this.hasPermission = false;
        return false;
      }

    } catch (error) {
      console.error('マイク権限の確認中にエラーが発生:', error);
      this.hasPermission = false;
      return false;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript);
      }
      if (this.onTranscriptEndCallback) {
        this.onTranscriptEndCallback(transcript);
      }

    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Auto restart recognition if it was previously running
      if (this.recognition && this.isListening) {
        setTimeout(() => this.startListening(), 1000);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        console.error('Microphone permission denied');
      }
      this.isListening = false;
    };
  }

  public async start(): Promise<boolean> {
    console.log('CAMMICApp 起動中...');
    
    try {
      // Check for permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        const error = new Error('マイクの使用が許可されていません');
        error.name = 'PermissionDeniedError';
        throw error;
      }

      await this.startListening();
      console.log('CAMMICApp 起動完了');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('CAMMICApp 起動エラー:', error.message);
      }
      throw error;
    }
  }

  public stop() {
    this.stopListening();
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
  }

  public setVideoStream(stream: MediaStream) {
    this.videoStream = stream;
  }

  public setTranscriptCallback(callback: (transcript: string) => void) {
    this.onTranscriptCallback = callback;
  }

  private async startListening(): Promise<void> {
    if (!this.recognition || this.isListening) {
      console.log('Recognition already active or not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        return reject(new Error('Recognition not initialized'));
      }

      // Set up success handler
      this.recognition.onstart = () => {
        console.log('Recognition started successfully');
        this.isListening = true;
        resolve();
      };

      // Set up error handler
      this.recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        this.isListening = false;
        
        if (event.error === 'not-allowed') {
          reject(new Error('マイクの使用が拒否されました。ブラウザの設定を確認してください。'));
        } else {
          reject(new Error(`音声認識エラー: ${event.error}`));
        }
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        console.error('Failed to start recognition:', error);
        reject(error);
      }
    });
  }

  private stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('Recognition stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  public getConfig(): SpeechRecognition | null {
    return this.recognition;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getHasPermission(): boolean {
    return this.hasPermission;
  }
  
  //話終わってからcallbackを呼び出す
  public setTranscriptEndCallback(timeout: number = 1000, callback: (transcript: string) => void): Promise<void> {
    this.onTranscriptEndCallback = null; // 初期化
    let lastTranscriptTime = Date.now();
    let lastTranscript = '';

    return new Promise((resolve, reject) => {
      // 音声認識の結果を監視する関数
      const transcriptHandler = (transcript: string) => {
        lastTranscriptTime = Date.now();
        lastTranscript = transcript;
      };

      // 一時的なコールバックとして設定
      this.onTranscriptCallback = transcriptHandler;

      const checkSilence = () => {
        const currentTime = Date.now();
        const silentDuration = currentTime - lastTranscriptTime;

        if (silentDuration >= timeout) {
          // 無音期間が閾値を超えたらcallbackを実行
          if (lastTranscript) {
            callback(lastTranscript);
          }
          this.onTranscriptCallback = null;
          resolve();
        } else if (this.isListening) {
          setTimeout(checkSilence, 100);
        } else {
          // 音声認識が停止した場合
          if (lastTranscript) {
            callback(lastTranscript);
          }
          this.onTranscriptCallback = null;
          resolve();
        }
      };

      checkSilence();
    });
  }
}

export default CAMMICApp;