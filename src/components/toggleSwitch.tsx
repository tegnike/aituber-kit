import { Switch } from '@headlessui/react'

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

export const ToggleSwitch = ({
  enabled,
  onChange,
  disabled = false,
}: ToggleSwitchProps) => {
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      disabled={disabled}
      className={`${enabled ? 'bg-primary' : 'bg-[#c0c0c0]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        relative inline-flex h-7 w-12 shrink-0 rounded-full
        border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
          pointer-events-none inline-block h-6 w-6
          transform rounded-full bg-white shadow-lg ring-0
          transition duration-200 ease-in-out`}
      />
    </Switch>
  )
}
