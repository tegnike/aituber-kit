import { render, screen } from '@testing-library/react'
import SendMessage from '@/pages/send-message'

// react-i18nextはモックしない。初期化前はuseTranslationがHooksを呼ばずに返るため、
// ページ側で初期化していないと、後からの初期化でHooksの順序が変わり画面が落ちる
describe('API Console i18n', () => {
  it('initializes i18n before the first render', () => {
    render(<SendMessage />)

    expect(screen.queryByText('ApiConsole.title')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /API/, level: 1 })
    ).toBeInTheDocument()
  })
})
