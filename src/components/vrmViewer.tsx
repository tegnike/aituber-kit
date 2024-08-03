import { useCallback } from 'react';
import { buildUrl } from '@/utils/buildUrl';

import store from '@/features/stores/app';

type Props = {
  onImageDropped: (image: string) => void;
};

export default function VrmViewer({ onImageDropped }: Props) {
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        const { viewer } = store.getState();
        viewer.setup(canvas);
        viewer.loadVrm(buildUrl('/AvatarSample_B.vrm'));

        // Drag and DropでVRMを差し替え
        canvas.addEventListener('dragover', function (event) {
          event.preventDefault();
        });

        canvas.addEventListener('drop', function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }
          const file_type = file.name.split('.').pop();
          if (file_type === 'vrm') {
            const blob = new Blob([file], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            viewer.loadVrm(url);
          } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
              onImageDropped(reader.result as string);
            };
          }
        });
      }
    },
    [onImageDropped],
  );

  return (
    <div className={'absolute top-0 left-0 w-screen h-[100svh]'}>
      <canvas ref={canvasRef} className={'h-full w-full'}></canvas>
    </div>
  );
}
