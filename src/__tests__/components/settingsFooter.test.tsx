import { render, screen } from '@testing-library/react'

import { Footer } from '@/components/settings/shell/Footer'
import { APP_VERSION } from '@/constants/appVersion'

describe('settings footer', () => {
  it('shows the shared app version', () => {
    render(<Footer />)

    expect(
      screen.getByText(`powered by ChatVRM from Pixiv / ver. ${APP_VERSION}`)
    ).toBeInTheDocument()
  })
})
