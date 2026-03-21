type PromptSource = {
  systemPrompt: string
  personalizationPrompt?: string
  selectedVrmPath?: string
  selectedVrchatModelPath?: string
}
const toLabel = (assetPath: string): string => {
  const clean = assetPath.split('?')[0]
  const name = clean.split('/').pop()
  return name || assetPath
}

export const composeSystemPrompt = ({
  systemPrompt,
  personalizationPrompt,
  selectedVrmPath,
  selectedVrchatModelPath,
}: PromptSource): string => {
  const sections: string[] = [systemPrompt || '']
  const personalization = (personalizationPrompt || '').trim()

  if (personalization) {
    sections.push(
      [
        'Additional personalization (must apply before answering):',
        personalization,
      ].join('\n')
    )
  }

  const avatarLines: string[] = []
  if (selectedVrmPath) {
    avatarLines.push(`- VRM model: ${toLabel(selectedVrmPath)}`)
  }
  if (selectedVrchatModelPath) {
    avatarLines.push(`- VRChat model asset: ${toLabel(selectedVrchatModelPath)}`)
  }

  if (avatarLines.length > 0) {
    sections.push(
      [
        'Avatar context (for persona consistency):',
        ...avatarLines,
        'Treat this as character context, not as factual evidence about the outside world.',
      ].join('\n')
    )
  }

  return sections.filter((section) => section.trim().length > 0).join('\n\n')
}
