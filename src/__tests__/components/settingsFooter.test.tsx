import { render, screen } from '@testing-library/react'

import { Footer } from '@/components/settings/shell/Footer'
import appVersion from '@/constants/appVersion.json'

describe('settings footer', () => {
  it('shows the shared app version', () => {
    render(<Footer />)

    expect(
      screen.getByText(
        `powered by ChatVRM from Pixiv / ver. ${appVersion.version}`
      )
    ).toBeInTheDocument()
  })
})
