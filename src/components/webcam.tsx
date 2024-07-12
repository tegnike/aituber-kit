import { get } from "http";
import { IconButton } from "./iconButton";
import React, { useEffect, useRef, useState, useCallback } from "react";

type Props = {
    onChangeModalImage: (image: string) => void;
    triggerShutter: boolean;
    showWebcam: boolean;
};

export const Webcam: React.FC<Props> = ({
    onChangeModalImage,
    triggerShutter,
    showWebcam,
}:Props) => {

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [Shutter, setShutter] = useState<boolean>(false);
  const [showRotateButton, setShowRotateButton] = useState(true);

    
  const videoRef = useRef<HTMLVideoElement>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices) return;
    try {
        const latestDevices = (await navigator.mediaDevices.enumerateDevices())
            .filter((d) => d.kind === "videoinput")
        setDevices(latestDevices);
        setShowRotateButton(latestDevices.length <= 1);
        if (latestDevices.length > 0 && !selectedDevice) {
            setSelectedDevice(latestDevices[0].deviceId);
        }
    } catch (error) {
        console.error("Error refreshing devices:", error);
    }
  }, [selectedDevice]);

  useEffect(() => {
    refreshDevices();
    const handleDeviceChange = () => {
        refreshDevices();
        //stopCamera();
    };
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
        navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
}, [refreshDevices]);


    useEffect(() => {
      console.log("refreshDevices")
      refreshDevices();
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          refreshDevices
        );
      };
    }, []);


  const stopCamera = useCallback(() => {
    console.log("stopCamera")
    if (videoRef.current?.srcObject) {
      /*
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        console.log("stopCamera2")
        videoRef.current.srcObject = null;
        */
        //setCameraActive(false);
    } else {
      console.log("stopCamera3")
  }
  }, []);

  //const getDevice = devices && selectedDevice && devices.find((d) => d.deviceId === selectedDevice);

  const constraints = {
    video: {width:{min:512}, height:{min:512}},
  };
  
  //カメラのon/offボタンのstateを管理
  const [cameraState, setCameraState] = useState(false);

  //カメラのon/offボタンの実装
  useEffect(() => {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { deviceId: { exact: selectedDevice } }})
      .then((stream) => {
        videoRef.current!.srcObject = cameraState ? null : stream;
      }).catch((e) => {
        console.log(e)
        // エラー処理
      });
  }, [cameraState, selectedDevice]);

  useEffect(() => {
    //console.log("mount show webcam:", showWebcam)
    refreshDevices();
    /*
    if (!showWebcam) {
      stopCamera();
    }
    return () => {
      console.log("dismount show webcam")
      stopCamera();
    }
    */
  },[showWebcam]);

  useEffect(() => {
    // 利用デバイスの初期化
    devices && devices?.[0] && setSelectedDevice(devices[0].deviceId);
    if (devices.length < 2) {
      // 2つ未満の場合はカメラの回転ボタンを非表示にする
      setShowRotateButton(false);
    }
    // デバイス情報をconsole.logで確認
    //devices.map((d) => console.log(d.label, d.deviceId));
  }, [devices]);

  //カメラの回転ボタンの実装 deviceが2つ以上の場合のみ実行
  // ボタンを押すたびにカメラを切り替える
  const handleRotateCamera = useCallback(() => {
    if (!navigator.mediaDevices) return;
    if ( devices.length < 2) return;
    // 次のデバイスidを取得
    const index = devices.findIndex((d) => d.deviceId === selectedDevice);
    setSelectedDevice(devices[(index + 1) % devices.length].deviceId);

  },[selectedDevice]);

  // videorefから画像を取得する
  const handleCapture = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current!.videoWidth;
    canvas.height = videoRef.current!.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current!, 0, 0);
    const data = canvas.toDataURL("image/png");
    onChangeModalImage(data);
  },[videoRef]);

  // triggerShutterがtrueの時に画像を取得する
  useEffect(() => {
    if (triggerShutter) {
      handleCapture();
    }
  }, [triggerShutter]);

  return (
    <div className="row-span-1 flex flex-col flex-nowrap relative items-end">
      <video
        ref={videoRef}
        width={512}
        height={512}
        id="local-video"
        autoPlay
        playsInline
        muted
      />
      <br />
      <div>
        <IconButton
              iconName="24/Shutter"
              className="z-30 bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={false}
              disabled={cameraState}
              onClick={handleCapture}
            />
        <IconButton
              iconName="24/Roll"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={false}
              disabled={showRotateButton}
              onClick={handleRotateCamera}
            />
      </div>
    </div>
  );
};