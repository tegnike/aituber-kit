import { fireEvent, render, screen } from '@testing-library/react'
import SendMessage from '@/pages/send-message'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: {
    getState: () => ({ clientId: 'test-client' }),
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'ApiConsole.title': 'API Console',
          'ApiConsole.description': 'API description',
          'ApiConsole.v1Endpoints': 'v1 API',
          'ApiConsole.presentationEndpoints': 'Presentation API',
          'ApiConsole.legacyEndpoints': 'Legacy API',
          'ApiConsole.apiKey': 'API キー',
          'ApiConsole.apiKeyPlaceholder': 'API key placeholder',
          'ApiConsole.requestBody': 'リクエスト本文',
          'ApiConsole.sending': '送信中...',
          'ApiConsole.send': '実行',
          'ApiConsole.response': 'レスポンス',
          'ApiConsole.noResponse': 'まだレスポンスはありません。',
          ClientID: 'Client ID',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}))

describe('API Console Presentation endpoints', () => {
  it('lists all Presentation API operations and builds a register request', () => {
    render(<SendMessage />)

    expect(screen.getByText('Presentation API')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'PUT Register / Update' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'GET Get Manifest' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'POST Activate' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'POST Control' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'GET Presentation Status' })
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'PUT Register / Update' })
    )

    expect(
      screen.getByRole('heading', { name: 'Register / Update' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Presentation ID')).toHaveValue(
      'api-console-demo'
    )
    expect(
      screen.getByText('http://localhost/api/v1/presentations/api-console-demo')
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Client ID')).not.toBeInTheDocument()
  })

  it('adds an optional revision query to the manifest request', () => {
    render(<SendMessage />)

    fireEvent.click(screen.getByRole('button', { name: 'GET Get Manifest' }))
    fireEvent.change(screen.getByLabelText('Revision（任意）'), {
      target: { value: '3' },
    })

    expect(
      screen.getByText(
        'http://localhost/api/v1/presentations/api-console-demo?revision=3'
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Client ID')).not.toBeInTheDocument()
  })
})
