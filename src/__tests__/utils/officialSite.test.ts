import { isOfficialSite } from '@/utils/officialSite'

describe('isOfficialSite', () => {
  const originalValue = process.env.NEXT_PUBLIC_OFFICIAL_SITE

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_OFFICIAL_SITE
    } else {
      process.env.NEXT_PUBLIC_OFFICIAL_SITE = originalValue
    }
  })

  it('is disabled by default', () => {
    delete process.env.NEXT_PUBLIC_OFFICIAL_SITE
    expect(isOfficialSite()).toBe(false)
  })

  it('is enabled only by the exact true value', () => {
    process.env.NEXT_PUBLIC_OFFICIAL_SITE = 'true'
    expect(isOfficialSite()).toBe(true)

    process.env.NEXT_PUBLIC_OFFICIAL_SITE = 'TRUE'
    expect(isOfficialSite()).toBe(false)
  })
})
