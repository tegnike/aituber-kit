export async function consumeStream(
  stream: ReadableStream<string>
): Promise<string> {
  const reader = stream.getReader()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    if (value) {
      result += value
    }
  }
  return result
}
