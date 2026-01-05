import { render, screen } from '@testing-library/react'
import { DemoModeNotice } from '@/components/demoModeNotice'
import { useDemoMode } from '@/hooks/useDemoMode'

jest.mock('@/hooks/useDemoMode')
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseDemoMode = useDemoMode as jest.MockedFunction<typeof useDemoMode>

describe('DemoModeNotice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null when demo mode is disabled', () => {
    mockUseDemoMode.mockReturnValue({ isDemoMode: false })

    const { container } = render(<DemoModeNotice />)

    expect(container.firstChild).toBeNull()
  })

  it('should render notice when demo mode is enabled', () => {
    mockUseDemoMode.mockReturnValue({ isDemoMode: true })

    render(<DemoModeNotice />)

    expect(screen.getByText('DemoModeNotice')).toBeInTheDocument()
  })

  it('should render with custom feature key', () => {
    mockUseDemoMode.mockReturnValue({ isDemoMode: true })

    render(<DemoModeNotice featureKey="upload" />)

    expect(screen.getByText('DemoModeNotice')).toBeInTheDocument()
  })

  it('should apply gray styling', () => {
    mockUseDemoMode.mockReturnValue({ isDemoMode: true })

    render(<DemoModeNotice />)

    const notice = screen.getByText('DemoModeNotice').closest('div')
    expect(notice).toHaveClass('text-gray-500')
  })
})
