export async function loadPreset(filename: string): Promise<string | null> {
  try {
    const response = await fetch(`/presets/${filename}`)
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}
