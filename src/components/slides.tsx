import React, { useEffect, useState, useCallback, useRef } from 'react'
import slideStore from '@/features/stores/slide'
import homeStore from '@/features/stores/home'
import { speakMessageHandler } from '@/features/chat/handlers'
import SlideContent from './slideContent'
import SlideControls from './slideControls'
import * as OBSWebSocketModule from 'obs-websocket-js'

const OBSWebSocket = OBSWebSocketModule.default || OBSWebSocketModule;

// OBS接続用の設定を環境変数から取得
const obsConfig = {
  url: process.env.NEXT_PUBLIC_OBS_WEBSOCKET_URL || 'ws://localhost:4455',
  password: process.env.NEXT_PUBLIC_OBS_WEBSOCKET_PASSWORD || '', // パスワードを.envから取得
}

interface SlidesProps {
  markdown: string
}

export const goToSlide = (index: number) => {
  slideStore.setState({
    currentSlide: index,
  })
}

const Slides: React.FC<SlidesProps> = ({ markdown }) => {
  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const isPlaying = slideStore((state) => state.isPlaying)
  const currentSlide = slideStore((state) => state.currentSlide)
  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const isAutoplay = slideStore((state) => state.isAutoplay)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const [slideCount, setSlideCount] = useState(0)
  
  // スライドの準備状態を追跡
  const [slidesReady, setSlidesReady] = useState(false)
  
  // 動画の再生状態を追跡
  const [videoPlaying, setVideoPlaying] = useState(false)
  // 現在のスライドの動画要素を追跡するref
  const currentVideosRef = useRef<HTMLVideoElement[]>([])
  // 自動再生の開始状態を追跡するためのRef
  const playbackStartedRef = useRef(false);
  
  // OBS接続関連の状態を追加
  const [obs, setObs] = useState<any>(null);
  const [obsConnected, setObsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // コンポーネントマウント時にOBSインスタンスを作成
  useEffect(() => {
    const obsInstance = new OBSWebSocket();
    setObs(obsInstance);
  }, []);
  
  // OBS録画状態を確認する関数
  const checkRecordingStatus = useCallback(async () => {
    if (!obs || !obsConnected) return;
    
    try {
      // OBSの録画状態を取得
      const { outputActive } = await obs.call('GetRecordStatus');
      // 現在の状態と異なる場合のみ更新（無駄なレンダリングを避ける）
      if (outputActive !== isRecording) {
        console.log(`録画状態を更新: ${outputActive ? '録画中' : '録画停止'}`);
        setIsRecording(outputActive);
      }
    } catch (error) {
      console.error('録画状態の取得に失敗しました:', error);
    }
  }, [obs, obsConnected, isRecording]);
  
  // OBSに接続する関数
  const connectToOBS = useCallback(async () => {
    if (!obs) {
      console.error('OBSWebSocketインスタンスが作成されていません');
      return;
    }
    
    try {
      console.log('OBS Studioに接続を試みています...');
      await obs.connect(obsConfig.url, obsConfig.password);
      console.log('OBS Studio に接続しました');
      setObsConnected(true);
      
      // 接続後すぐに録画状態を確認
      await checkRecordingStatus();
      
      // OBSからのイベント通知を設定
      obs.on('RecordStateChanged', (event: { outputActive: boolean }) => {
        console.log(`OBSの録画状態が変更されました: ${event.outputActive ? '録画中' : '録画停止'}`);
        setIsRecording(event.outputActive);
      });
    } catch (error) {
      console.error('OBS Studioへの接続に失敗しました:', error);
      setObsConnected(false);
    }
  }, [obs, checkRecordingStatus]);

  // 録画を開始する関数
  const startRecording = useCallback(async () => {
    if (!obs || !obsConnected) return;
    
    try {
      // 録画状態を最新に更新
      await checkRecordingStatus();
      
      // 録画中でない場合のみ録画開始
      if (!isRecording) {
        await obs.call('StartRecord');
        setIsRecording(true);
        console.log('録画を開始しました');
      } else {
        console.log('既に録画中です');
      }
    } catch (error) {
      console.error('録画開始に失敗しました:', error);
    }
  }, [obs, obsConnected, isRecording, checkRecordingStatus]);

  // 録画を停止する関数
  const stopRecording = useCallback(async () => {
    if (!obs || !obsConnected) return;
    
    try {
      // 録画状態を最新に更新
      await checkRecordingStatus();
      
      // 録画中の場合のみ録画停止
      if (isRecording) {
        await obs.call('StopRecord');
        setIsRecording(false);
        console.log('録画を停止しました');
      } else {
        console.log('録画が停止されていません');
      }
    } catch (error) {
      console.error('録画停止に失敗しました:', error);
    }
  }, [obs, obsConnected, isRecording, checkRecordingStatus]);
  
  // 定期的に録画状態を確認
  useEffect(() => {
    if (!obsConnected) return;
    
    // 5秒ごとに録画状態を確認
    const interval = setInterval(() => {
      checkRecordingStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [obsConnected, checkRecordingStatus]);

  // コンポーネントマウント時にOBSに接続
  useEffect(() => {
    // obsインスタンスが作成されたら接続を試みる
    if (obs) {
      connectToOBS();
    }
    
    // コンポーネントアンマウント時に接続を切断
    return () => {
      if (obs && obsConnected) {
        // 録画中なら停止
        if (isRecording) {
          stopRecording();
        }
        // 接続を切断
        try {
          obs.disconnect();
          console.log('OBS Studioとの接続を切断しました');
        } catch (error) {
          console.error('OBS Studioとの接続切断に失敗しました:', error);
        }
      }
    }
  }, [connectToOBS, obs, obsConnected, isRecording, stopRecording]);

  // 全てのビデオの再生状態をチェックする関数
  const checkAllVideosEnded = useCallback(() => {
    if (currentVideosRef.current.length === 0) {
      return true; // ビデオがない場合は終了している判定
    }
    
    // すべてのビデオが終了しているかチェック
    return currentVideosRef.current.every(video => 
      video.ended || video.paused || video.currentTime >= video.duration - 0.5
    );
  }, []);

  // スライドの音声を読み上げる関数
  const readSlide = useCallback(
    (slideIndex: number) => {
      const getCurrentLines = () => {
        try {
          const scripts = require(
            `../../public/slides/${selectedSlideDocs}/scripts.json`
          )
          const currentScript = scripts.find(
            (script: { page: number }) => script.page === slideIndex
          )
          return currentScript ? currentScript.line : ''
        } catch (error) {
          console.error(`スライド「${selectedSlideDocs}」のスクリプト読み込みに失敗しました:`, error);
          return '';
        }
      }

      const currentLines = getCurrentLines()
      console.log(`スライド${slideIndex}を読み上げ: ${currentLines}`)
      speakMessageHandler(currentLines)
    },
    [selectedSlideDocs]
  )

  // 現在表示しているスライドの動画要素を追跡
  useEffect(() => {
    const currentMarpitContainer = document.querySelector('.marpit')
    if (!currentMarpitContainer) return
    const slides = currentMarpitContainer.querySelectorAll(':scope > svg')

    slides.forEach((slide, i) => {
      if (i === currentSlide) {
        // 表示するスライド
        slide.removeAttribute('hidden')
        slide.setAttribute('style', 'display: block;')

        // 新しく表示されるスライド内の video を再生し、イベントリスナーを追加
        const videos = slide.querySelectorAll('video') as NodeListOf<HTMLVideoElement>
        const videoArray: HTMLVideoElement[] = [];
        
        if (videos.length > 0) {
          console.log(`スライド${currentSlide}には${videos.length}個の動画があります`);
          setVideoPlaying(true);
        } else {
          setVideoPlaying(false);
        }
        
        videos.forEach((video) => {
          // ビデオの再生が終了したときのイベントリスナーを設定
          video.addEventListener('ended', () => {
            console.log('動画の再生が終了しました');
            // すべての動画が終了したかチェック
            if (checkAllVideosEnded()) {
              console.log('すべての動画の再生が終了しました');
              setVideoPlaying(false);
            }
          });
          
          // ビデオの再生開始
          video.play().catch((err) => {
            console.warn('Video autoplay failed:', err)
            // 自動再生に失敗した場合は、再生中でないと判断
            setVideoPlaying(false);
          });
          
          videoArray.push(video);
        });
        
        // 現在のビデオ要素を保存
        currentVideosRef.current = videoArray;
      } else {
        // 非表示にするスライド
        slide.setAttribute('hidden', '')
        slide.setAttribute('style', 'display: none;')

        // 非表示になったスライド内の video を停止
        // TODO: video一時停止するとplay()がエラーで動かないため一度流したら止めないで対応した
        const videos = slide.querySelectorAll('video') as NodeListOf<HTMLVideoElement>
        videos.forEach((video) => {
          //video.pause()
          //video.currentTime = 0 // 最初に巻き戻したい場合は指定
        })
      }
    })
  }, [currentSlide, marpitContainer, checkAllVideosEnded])

  // スライドの読み込み処理
  useEffect(() => {
    const convertMarkdown = async () => {
      // 読み込み開始時は準備完了フラグをリセット
      setSlidesReady(false);
      
      console.log(`スライド「${selectedSlideDocs}」の読み込みを開始します...`);
      
      try {
        const response = await fetch('/api/convertMarkdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slideName: selectedSlideDocs }),
        });
        
        if (!response.ok) {
          throw new Error(`スライドの変換に失敗しました: ${response.statusText}`);
        }
        
        const data = await response.json();

        // HTMLをパースしてmarpit要素を取得
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.html, 'text/html');
        const marpitElement = doc.querySelector('.marpit');
        
        if (!marpitElement) {
          throw new Error('スライドのHTMLが正しく生成されませんでした');
        }
        
        setMarpitContainer(marpitElement);

        // スライド数を設定
        const slides = marpitElement.querySelectorAll(':scope > svg');
        setSlideCount(slides.length);
        console.log(`スライド数: ${slides.length}枚`);

        // 初期状態で最初のスライド以外は非表示にしておく
        slides.forEach((slide, i) => {
          if (i === 0) {
            slide.removeAttribute('hidden');
            slide.setAttribute('style', 'display: block;');
          } else {
            slide.setAttribute('hidden', '');
            slide.setAttribute('style', 'display: none;');
          }
        });

        // CSSを動的に適用
        const styleElement = document.createElement('style');
        styleElement.textContent = data.css;
        document.head.appendChild(styleElement);

        // スライドの準備が完了したことを通知
        console.log(`スライド「${selectedSlideDocs}」の読み込みが完了しました`);
        setSlidesReady(true);
        
        return () => {
          document.head.removeChild(styleElement);
        };
      } catch (error) {
        console.error('スライドの読み込み中にエラーが発生しました:', error);
        setSlidesReady(false);
      }
    };

    convertMarkdown();
  }, [selectedSlideDocs]);

  // カスタムCSSの適用
  useEffect(() => {
    // カスタムCSSを適用
    const customStyle = `
      div.marpit > svg > foreignObject > section {
        padding: 2em;
      }
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyle;
    document.head.appendChild(styleElement);

    // コンポーネントのアンマウント時にスタイルを削除
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // スライドが準備完了したときに、自動再生モードであれば再生を開始
  useEffect(() => {
    // すでに再生を開始している場合は何もしない
    if (slidesReady && isAutoplay && !isPlaying && !playbackStartedRef.current) {
      console.log('スライドの準備が完了し、自動再生モードが有効なため、再生を開始します');
      // 再生開始フラグを設定
      playbackStartedRef.current = true;
      
      // 現在のスライドを明示的に0に設定
      slideStore.setState({ currentSlide: 0 });
      
      // 少し遅延を入れてから再生開始（スライドが確実に表示されてから）
      setTimeout(() => {
        // 状態が変わっていないことを確認
        if (isAutoplay && !slideStore.getState().isPlaying) {
          console.log('スライド0の音声を読み上げ、再生を開始します');
          readSlide(0);
          slideStore.setState({ isPlaying: true });
        }
      }, 1000);
    }
  }, [slidesReady, isAutoplay, isPlaying, readSlide]);

  // 最後のスライドに到達時の処理を強化
  useEffect(() => {
    // 最後のスライドに達し、かつ音声と動画が終了した場合にisPlayingをfalseに設定
    if (currentSlide === slideCount - 1 && chatProcessingCount === 0 && !videoPlaying) {
      console.log('最後のスライドの再生が終了しました。自動再生を停止します');
      
      // 再生状態と自動再生状態を停止に設定
      slideStore.setState({ 
        isPlaying: false,
        // 自動再生モードも無効化して再ループを防止
        isAutoplay: false 
      });
      
      // 再生フラグもリセット
      playbackStartedRef.current = false;
      
      // 録画中なら停止
      if (obsConnected && isRecording) {
        stopRecording();
      }
    }
  }, [currentSlide, slideCount, chatProcessingCount, videoPlaying, obsConnected, isRecording, stopRecording]);
  
  // コンポーネントのアンマウント時や選択スライドの変更時に自動再生状態をリセット
  useEffect(() => {
    // 選択スライドが変更された場合、再生開始フラグをリセット
    playbackStartedRef.current = false;
    
    // コンポーネントのアンマウント時や選択スライドの変更時に実行されるクリーンアップ関数
    return () => {
      playbackStartedRef.current = false;
      
      // 自動再生状態をリセット（コンポーネントのアンマウント時のみ）
      if (slideStore.getState().isAutoplay) {
        slideStore.setState({ 
          isPlaying: false,
        });
      }
    };
  }, [selectedSlideDocs]);

  // 次のスライドに進む関数
  const nextSlide = useCallback(() => {
    slideStore.setState((state) => {
      const newSlide = Math.min(state.currentSlide + 1, slideCount - 1);
      
      // 再生中の場合は音声を読み上げる
      if (isPlaying) {
        readSlide(newSlide);
      }
      
      return { currentSlide: newSlide };
    });
  }, [isPlaying, readSlide, slideCount]);

  // 前のスライドに戻る関数
  const prevSlide = useCallback(() => {
    slideStore.setState((state) => ({
      currentSlide: Math.max(state.currentSlide - 1, 0),
    }));
  }, []);

  // 再生/停止を切り替える関数
  const toggleIsPlaying = useCallback(() => {
    const newIsPlaying = !isPlaying;
    
    // 状態を更新
    slideStore.setState({ isPlaying: newIsPlaying });
    
    // 再生開始時には現在のスライドの音声を読み上げる
    if (newIsPlaying) {
      console.log(`手動再生: スライド${currentSlide}の音声を読み上げます`);
      readSlide(currentSlide);
    }
  }, [isPlaying, currentSlide, readSlide]);

  // isPlayingの変更を監視して録画を制御
  useEffect(() => {
    if (isPlaying && obsConnected && !isRecording) {
      // スライドショー開始時に録画開始
      startRecording();
    } else if (!isPlaying && obsConnected && isRecording) {
      // スライドショー終了時に録画停止
      stopRecording();
    }
  }, [isPlaying, obsConnected, isRecording, startRecording, stopRecording]);

  // 音声ナレーションと動画が終了したら次のスライドへ進む
  useEffect(() => {
    // 再生中で、最後のスライドではなく、音声と動画の両方が終了した場合
    if (isPlaying && currentSlide < slideCount - 1 && chatProcessingCount === 0 && !videoPlaying) {
      // すぐに次に進むのではなく、少し間を取る
      const timerId = setTimeout(() => {
        // 状態をダブルチェック（タイマー実行までに状態が変わっている可能性がある）
        if (slideStore.getState().isPlaying && 
            currentSlide < slideCount - 1 && 
            homeStore.getState().chatProcessingCount === 0 && 
            !videoPlaying) {
          console.log('音声ナレーションと動画の両方が終了したため、次のスライドへ進みます');
          nextSlide();
        }
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [chatProcessingCount, videoPlaying, isPlaying, currentSlide, slideCount, nextSlide]);

  // スライドの縦のサイズを70%に制限し、アスペクト比を維持
  const calculateSlideSize = () => {
    // 縦のサイズの上限を70vhに設定
    const maxHeight = '70vh'
    // 横幅をアスペクト比に合わせて計算（16:9）
    const width = 'calc(70vh * (16 / 9))'
    // 横幅が大きすぎる場合は80vwを上限とする
    const maxWidth = '80vw'

    return {
      width: `min(${width}, ${maxWidth})`,
      height: `min(calc(${maxWidth} * (9 / 16)), ${maxHeight})`,
    }
  }

  const slideSize = calculateSlideSize()

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        height: '100vh',
        padding: '10px 0',
        position: 'absolute',
        width: '100%',
      }}
    >
      <div
        style={{
          width: slideSize.width,
          height: slideSize.height,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <SlideContent marpitContainer={marpitContainer} />
      </div>
      {/* 自動再生モードでない場合のみコントロールを表示 */}
      {!isAutoplay && (
      <div
        style={{
          width: slideSize.width,
          margin: '10px auto 0',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <SlideControls
          currentSlide={currentSlide}
          slideCount={slideCount}
          isPlaying={isPlaying}
          prevSlide={prevSlide}
          nextSlide={nextSlide}
          toggleIsPlaying={toggleIsPlaying}
          obsConnected={obsConnected}
          isRecording={isRecording}
        />
      </div>
      )}
    </div>
  )
}
export default Slides
