import type { GetServerSidePropsContext } from 'next'
import { sendOfficialSiteTextResponse } from '@/utils/officialSiteTextResponse'

describe('sendOfficialSiteTextResponse', () => {
  const originalValue = process.env.NEXT_PUBLIC_OFFICIAL_SITE

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_OFFICIAL_SITE
    } else {
      process.env.NEXT_PUBLIC_OFFICIAL_SITE = originalValue
    }
  })

  it('returns notFound outside the official site', () => {
    delete process.env.NEXT_PUBLIC_OFFICIAL_SITE
    const context = {
      res: {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      },
    } as unknown as GetServerSidePropsContext

    expect(
      sendOfficialSiteTextResponse(context, {
        body: 'test',
        contentType: 'text/plain',
      })
    ).toEqual({ notFound: true })
    expect(context.res.write).not.toHaveBeenCalled()
  })

  it('writes the response on the official site', () => {
    process.env.NEXT_PUBLIC_OFFICIAL_SITE = 'true'
    const context = {
      res: {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      },
    } as unknown as GetServerSidePropsContext

    expect(
      sendOfficialSiteTextResponse(context, {
        body: 'test',
        contentType: 'text/plain',
      })
    ).toEqual({ props: {} })
    expect(context.res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain'
    )
    expect(context.res.write).toHaveBeenCalledWith('test')
    expect(context.res.end).toHaveBeenCalled()
  })
})
