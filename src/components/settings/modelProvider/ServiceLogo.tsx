import Image from 'next/image'

const aiServiceLogos = {
  openai: '/images/ai-logos/openai.svg',
  anthropic: '/images/ai-logos/anthropic.svg',
  google: '/images/ai-logos/google.svg',
  azure: '/images/ai-logos/azure.svg',
  xai: '/images/ai-logos/xai.svg',
  groq: '/images/ai-logos/groq.svg',
  cohere: '/images/ai-logos/cohere.svg',
  mistralai: '/images/ai-logos/mistralai.svg',
  perplexity: '/images/ai-logos/perplexity.svg',
  fireworks: '/images/ai-logos/fireworks.svg',
  deepseek: '/images/ai-logos/deepseek.svg',
  openrouter: '/images/ai-logos/openrouter.svg',
  lmstudio: '/images/ai-logos/lmstudio.svg',
  ollama: '/images/ai-logos/ollama.svg',
  dify: '/images/ai-logos/dify.svg',
  'custom-api': '/images/ai-logos/custom-api.svg',
}

interface ServiceLogoProps {
  service: keyof typeof aiServiceLogos
}

export const ServiceLogo = ({ service }: ServiceLogoProps) => {
  return (
    <div
      className="inline-flex items-center justify-center mr-2"
      style={{ width: '32px', height: '32px' }}
    >
      <Image
        src={aiServiceLogos[service]}
        alt={`${service} logo`}
        width={24}
        height={24}
        style={{ objectFit: 'contain' }}
      />
    </div>
  )
}
