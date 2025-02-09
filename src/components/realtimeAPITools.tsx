class RealtimeAPITools {
  async get_current_weather(
    latitude: number,
    longitude: number,
    timezone: string,
    location: string
  ): Promise<string> {
    console.log(
      `Getting weather for ${location} (${latitude}, ${longitude}), timezone: ${timezone}`
    )

    // Open-Meteo APIにリクエストを送信
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=${encodeURIComponent(timezone)}`
    const response = await fetch(url)
    const data = await response.json()

    console.log(data)

    // 最初の値を取得
    const temperature = data.hourly.temperature_2m[0]
    const weathercode = data.hourly.weathercode[0]

    // 天気コードを天気状況に変換
    const weatherStatus = this.getWeatherStatus(weathercode)

    return `天気情報: ${location}の現在の気温は${temperature}°C、天気は${weatherStatus}です。`
  }

  // 天気コードを天気状況に変換するヘルパー関数
  private getWeatherStatus(code: number): string {
    // 天気コードに応じて適切な天気状況を返す
    if (code === 0) return '快晴'
    if ([1, 2, 3].includes(code)) return '晴れ'
    if (code >= 51 && code <= 55) return '霧雨'
    if (code >= 61 && code <= 65) return '雨'
    if (code === 80) return 'にわか雨'
    // その他の天気コードに対応
    if (code === 45) return '霧'
    if (code >= 71 && code <= 75) return '雪'
    return '不明'
  }

  // Add other functions here
}

const realtimeAPITools = new RealtimeAPITools()
export default realtimeAPITools
