import Image from 'next/image'

import { IconButton } from '@/components/iconButton'
import homeStore from '@/features/stores/home'

const ModalImage = () => {
  const modalImage = homeStore((s) => s.modalImage)

  if (!modalImage) return null

  return (
    <div
      className="absolute row-span-1 flex right-0 max-h-[40vh] z-10"
      style={{
        top: '40vh',
      }}
    >
      <div className="relative w-full md:max-w-[512px] max-w-[50%] m-4">
        <Image
          src={modalImage}
          width={512}
          height={512}
          alt="Modal Image"
          className="rounded-lg w-auto object-contain max-h-[100%] ml-auto"
        />
        <div className="absolute top-2 right-2">
          <IconButton
            iconName="24/Trash"
            className="hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
            isProcessing={false}
            onClick={() => homeStore.setState({ modalImage: '' })}
          />
        </div>
      </div>
    </div>
  )
}
export default ModalImage
