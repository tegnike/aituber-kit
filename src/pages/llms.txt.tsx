import type { GetServerSideProps } from 'next'
import { sendOfficialSiteTextResponse } from '@/utils/officialSiteTextResponse'

const body = `# AITuberKit

> AITuberKit is an open-source toolkit for building and experiencing conversational AI characters and AITuber (AI VTuber) streams in a web browser.

## Main capabilities

- Conversational AI with OpenAI, Anthropic Claude, Google Gemini, and other providers
- VRM, Live2D, and PNGTuber character models
- Text-to-speech and speech recognition
- YouTube comment integration for interactive AITuber streaming
- Kiosk, idle, slide, memory, and presence-detection modes

## Official resources

- Website: https://aituberkit.com/
- AITuber overview: https://aituberkit.com/aituber/
- Documentation: https://docs.aituberkit.com/
- Source code: https://github.com/tegnike/aituber-kit
`

export const getServerSideProps: GetServerSideProps = async (context) =>
  sendOfficialSiteTextResponse(context, {
    body,
    contentType: 'text/plain; charset=utf-8',
  })

export default function LlmsTxt() {
  return null
}
