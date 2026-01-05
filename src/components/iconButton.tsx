import { KnownIconType } from '@charcoal-ui/icons'
import { ButtonHTMLAttributes } from 'react'
import Image from 'next/image'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType | 'screen-share' | 'stop'
  isProcessing: boolean
  isProcessingIcon?: keyof KnownIconType
  label?: string
  iconColor?: string
  backgroundColor?: string
}

export const IconButton = ({
  iconName,
  isProcessing,
  isProcessingIcon,
  label,
  iconColor,
  backgroundColor = 'bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled',
  ...rest
}: Props) => {
  return (
    <button
      {...rest}
      className={`${backgroundColor} rounded-2xl text-sm p-2 text-center inline-flex items-center
        ${iconColor || 'text-theme'}
        ${rest.className}
      `}
    >
      {isProcessing ? (
        <pixiv-icon name={(isProcessingIcon || '24/Dot') as any} scale="1" />
      ) : iconName === 'screen-share' ? (
        <Image
          src="/images/icons/screen-share.svg"
          alt="screen share"
          width={24}
          height={24}
        />
      ) : iconName === 'stop' ? (
        <Image src="/images/icons/stop.svg" alt="stop" width={24} height={24} />
      ) : (
        <pixiv-icon name={iconName as any} scale="1" />
      )}
      {label && <div className="mx-2 font-bold">{label}</div>}
    </button>
  )
}
