import { KnownIconType } from '@charcoal-ui/icons'
import { ButtonHTMLAttributes } from 'react'

// Auroraデザイン準拠の白抜き（アウトライン）アイコン。
// ここに定義があるアイコン名はpixiv-icon（塗りつぶし）の代わりにこちらを描画する。
const OUTLINE_ICONS: Record<string, JSX.Element> = {
  '24/Settings': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  '24/CommentFill': (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <line x1="8" y1="11.5" x2="8.01" y2="11.5" />
      <line x1="12" y1="11.5" x2="12.01" y2="11.5" />
      <line x1="16" y1="11.5" x2="16.01" y2="11.5" />
    </>
  ),
  '24/CommentOutline': (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="13" y2="12" />
    </>
  ),
  '24/Menu': (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  '24/Close': (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  '24/Microphone': (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </>
  ),
  '24/Send': (
    <>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </>
  ),
  '24/PauseAlt': (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  '24/Camera': (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  '24/AddImage': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  '24/FrameEffect': (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  '24/Video': (
    <>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </>
  ),
  '24/Search': (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  '24/Add': (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  '24/Subtract': <line x1="5" y1="12" x2="19" y2="12" />,
  '24/Expand': (
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  ),
  '24/Hide': (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  '24/Show': (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  '24/Next': <polyline points="9 18 15 12 9 6" />,
  '24/Prev': <polyline points="15 18 9 12 15 6" />,
  '24/Play': <polygon points="6 4 20 12 6 20" />,
  '24/Shutter': (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
      <line x1="9.69" y1="8" x2="21.17" y2="8" />
      <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
      <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
      <line x1="14.31" y1="16" x2="2.83" y2="16" />
      <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
    </>
  ),
  '24/Trash': (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  '24/Dot': (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  'game-controller': (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="4" y1="12" x2="8" y2="12" />
      <circle cx="15.5" cy="13.5" r="1" />
      <circle cx="18.5" cy="10.5" r="1" />
    </>
  ),
  stop: <rect x="5" y="5" width="14" height="14" rx="2" />,
  'screen-share': (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </>
  ),
}

const OutlineIcon = ({
  children,
  name,
  size = 20,
}: {
  children: JSX.Element
  name?: string
  size?: number
}) => (
  <svg
    data-icon={name}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

// IconButtonを介さず単体でアウトラインアイコンを描画する用
export const InlineOutlineIcon = ({
  name,
  size = 20,
}: {
  name: string
  size?: number
}) => {
  const icon = OUTLINE_ICONS[name]
  return icon ? (
    <OutlineIcon name={name} size={size}>
      {icon}
    </OutlineIcon>
  ) : (
    <pixiv-icon name={name as any} scale="1" />
  )
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType | 'screen-share' | 'stop' | 'game-controller'
  isProcessing: boolean
  isProcessingIcon?: keyof KnownIconType
  label?: string
  labelClassName?: string
  iconColor?: string
  backgroundColor?: string
}

export const IconButton = ({
  iconName,
  isProcessing,
  isProcessingIcon,
  label,
  labelClassName = '',
  iconColor,
  backgroundColor = 'bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled',
  ...rest
}: Props) => {
  const resolvedName = String(
    isProcessing ? isProcessingIcon || '24/Dot' : iconName
  )
  const outlineIcon = OUTLINE_ICONS[resolvedName]

  // OUTLINE_ICONSにないアイコン名のみpixiv-icon（塗りつぶし）にフォールバック
  const iconElement = outlineIcon ? (
    <OutlineIcon name={resolvedName}>{outlineIcon}</OutlineIcon>
  ) : (
    <pixiv-icon name={resolvedName as any} scale="1" />
  )

  return (
    <button
      {...rest}
      className={`${backgroundColor} rounded-2xl text-sm p-2 min-w-[44px] min-h-[44px] justify-center text-center inline-flex items-center
        ${iconColor || 'text-theme'}
        ${rest.className}
      `}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        {iconElement}
      </span>
      {label && (
        <div className={`mx-2 font-bold ${labelClassName}`}>{label}</div>
      )}
    </button>
  )
}
