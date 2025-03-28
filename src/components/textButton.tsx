import { ButtonHTMLAttributes } from 'react'
type Props = ButtonHTMLAttributes<HTMLButtonElement>

export const TextButton = (props: Props) => {
  return (
    <button
      {...props}
      className={`px-6 py-2 text-white font-bold bg-primary hover:bg-primary-hover active:bg-primary-press-press disabled:bg-primary-disabled rounded-full  ${props.className}`}
    >
      {props.children}
    </button>
  )
}
