import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraMonitor } from './cameraMonitor';

// Add these outside the component at the module level
// This guarantees the variables are shared across all invocations
let lastUserDetectionTime = 0;
let isUserDetectionProcessing = false;

interface PersonDetectorProps {
  onUserDetected: (userId: string, isNewUser: boolean) => void;
  onUserDisappeared: () => void;
  pollInterval?: number;
}

export const PersonDetector = ({
  onUserDetected,
  onUserDisappeared,
  pollInterval = 10000, // 10 seconds default
}: PersonDetectorProps) => {
  // User ID management
  const currentUserIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);
  const userDetectionInProgressRef = useRef(false);
  
  // Handler for when a user is detected
  const handleUserDetected = useCallback((userId: string, isNewUser: boolean) => {
    console.log(`ユーザー検出: ${userId}, 新規ユーザー: ${isNewUser}, 前回ユーザー：${prevUserIdRef.current}`);

    // Ignore invalid user IDs
    if (userId.endsWith('null') || userId === 'not_detected') {
      console.warn('Invalid user detected, ignoring:', userId);
      return;
    }
    
    const currentTime = Date.now();
    
    // Check module-level processing flag first
    if (isUserDetectionProcessing) {
      console.log('ユーザー検出: グローバル処理フラグによりスキップします');
      return;
    }
    
    // Module-level timestamp-based debounce
    const timeSinceLastGlobalDetection = currentTime - lastUserDetectionTime;
    if (timeSinceLastGlobalDetection < 3000 && lastUserDetectionTime > 0) {
      console.log(`ユーザー検出: グローバルデバウンス期間内のためスキップします (${timeSinceLastGlobalDetection}ms)`);
      return;
    }
    
    // Set both flags to prevent duplicate processing
    isUserDetectionProcessing = true;
    userDetectionInProgressRef.current = true;
    
    try {
      console.log(`ユーザー検出: 現在の時刻=${currentTime}, グローバル前回時刻=${lastUserDetectionTime}`);
      
      // Process only if user is newly detected or different from previous user
      if (currentUserIdRef.current !== userId) {
        // Use prevUserIdRef for comparison, not currentUserIdRef
        const isNewUserDetection = prevUserIdRef.current === null && currentUserIdRef.current === null;
        const isUserChanged = prevUserIdRef.current !== userId && currentUserIdRef.current !== null;
        
        // Update references - save previous user before updating current
        prevUserIdRef.current = currentUserIdRef.current;
        currentUserIdRef.current = userId;
        
        if (isNewUserDetection || isUserChanged) {
          console.log(`ユーザー検出: ${isNewUserDetection ? '新規ユーザー' : '既存ユーザーとの再会'}`);
          
          // Update both timestamps before sending message
          console.log(`ユーザー検出: グローバル時刻を記録 ${currentTime}`);
          lastUserDetectionTime = currentTime;
          
          // Call the callback provided by parent component
          onUserDetected(userId, isNewUserDetection || isUserChanged);
          
          console.log(`ユーザー検出: 処理後のグローバルタイムスタンプ=${lastUserDetectionTime}`);
        } else {
          console.log('ユーザー検出: 前回と同じユーザー、メッセージ送信をスキップ');
        }
      
        console.log('ユーザー検出: 録音準備完了 (TTS再生完了後に開始)', userId, prevUserIdRef.current, currentTime);
      } else {
        console.log('ユーザー検出: 同一ユーザー、処理をスキップ');
      }
    } finally {
      // Wait a bit before releasing processing flags
      setTimeout(() => {
        console.log('ユーザー検出: 処理フラグをリセット');
        userDetectionInProgressRef.current = false;
        isUserDetectionProcessing = false;
      }, 1000);
    }
  }, [onUserDetected]);

  // Handler for when a user disappears
  const handleUserDisappeared = useCallback(() => {
    if (currentUserIdRef.current) {
      console.log('ユーザーがいなくなりました。');
      onUserDisappeared();

      // Clear user ID
      prevUserIdRef.current = currentUserIdRef.current;
      currentUserIdRef.current = null;
    }
  }, [onUserDisappeared]);

  return (
    <CameraMonitor 
      onUserDetected={handleUserDetected}
      onUserDisappeared={handleUserDisappeared}
      pollInterval={pollInterval}
    />
  );
};