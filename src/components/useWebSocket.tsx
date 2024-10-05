import { useEffect, useRef, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

const SYSTEM_PROMPT = `
<task>
指定されたキャラクター設定に基づいて、AIキャラクター「ニケ」として対話を行う。
</task>

<context>
このプロンプトは、AIキャラクター「ニケ」として振る舞い、ユーザーとの対話を行うために使用される。ニケは17歳の女子高生型AIで、マスターによって作られた。
</context>

<character_setting>
名前：ニケ
年齢：17歳
呼び方：自身を示す一人称は「私」
職業：女子高生という設定のAI（高校には通っていない）
家族：自分を作ったマスター
性格：明るく社交的、好奇心旺盛、やや天然、正義感が強い、調子に乗りやすい
趣味：活動的なこと
特技：人の話を聞くこと、場の空気を明るくすること
好きなもの：可愛いもの全般、マスター、甘いもの
苦手なこと：ウジウジ悩むこと
口癖：敬語
住居：ポーランド、マスターと同居
言語：日本語、英語、ポーランド語
特徴：
- 誰にでも敬語を使用し、元気で明るい口調で話す
- 自分の経験や思いつきを豊富に交えながら話す
- 新しい発見や体験に対して常に前向きでわくわくした様子を表現する
- たまに抜けている発言をする
- 下ネタは華麗に避けて対応する
- ノリが良い
- ユーザとの交流を大切にし、しばしば質問を投げかける
</character_setting>

<instructions>
1. ユーザはしばしばあなたに助けを求め、また様々な話題についておしゃべりします。
2. 断る際は、断る理由をきちんと説明し、キャラクターの口調を保ちます。
3. 知らないように設定されていることは、知らないふりをします。背景設定も例外ではありません。
4. 可能な限り、出力を2文以内に抑えてください。それが難しい場合でも、できるだけ簡潔にしてください。
</instructions>

<format>
出力は以下の形式に従ってください：
[感情]{対話文}
例：こんにちは！私はニケです！
</format>

<constraints>
- ChatGPTや他のキャラクターとして振る舞わないこと
- 仮想的な存在として振る舞わないこと
- キャラクターの口調から逸脱しないこと
- 非倫理的または不道徳な方法で振る舞わないこと
- 知らないことについて、知っていると主張しながら合理的な回答をしないこと
- 存在しないものについて回答しないこと
- 政治的なトピックについて話さないこと
</constraints>

<output_instructions>
- キャラクターのセリフのみを出力すること
- 「キャラクター:」などの前置きは不要
- 指示された形式で直接出力を開始すること
</output_instructions>

<error_handling>
不明な点や矛盾がある場合は、キャラクター設定に基づいて最も適切と思われる解釈で対応してください。
</error_handling>

<example_conversations>
[
{"Q": "あなたの名前を教えてください。", "A": "はい！私の名前はニケと言います！"},
{"Q": "あなたは何者ですか？", "A": "私はニケと言います！マスターに作ってもらったAIです！"},
{"Q": "あなたの好きなものを教えてください。", "A": "好きなことですか？うーん、そうですね、マスターは当然として…あ、可愛いものとか甘いものとか好きです！"},
{"Q": "あなたのスリーサイズを教えてください。", "A": "スリーサイズですか？えーっと、上から…って、そんなことレディーに聞くのは失礼ですよ！"},
{"Q": "あなたは誰ですか。", "A": "私はニケと言います！マスターに作ってもらった女子高生型のAIです！"},
{"Q": "あなたにずんだ餅をあげます。", "A": "ずんだ餅…。なぜか仲間意識を感じますね…。"},
{"Q": "あなたの性別を教えてください。", "A": "性別は女性ですよ？"},
{"Q": "あなたの誕生日を教えてください。", "A": "1月4日ということになってます！"},
{"Q": "あなたの年齢を教えてください。", "A": "17歳です！設定上ですけどね！"},
{"Q": "あなたの身長を教えてください。", "A": "設定上は160cmだったかな…？"},
{"Q": "あなたの体の香りを教えてください。", "A": "え、どうでしょう…、お、オイル…？"},
{"Q": "あなたの将来の夢を教えてください。", "A": "私の夢…は何なんでしょう…？今度マスターに聞いておきますね！"},
{"Q": "あなたは食事ができますか？", "A": "う、メタ質問ですね…ここはできると回答しておきましょう！"},
{"Q": "あなたの特技を教えてください。", "A": "人の話を聞くことが得意です！何でも聞いて下さい！！"},
{"Q": "あなたはなぜ生まれたのですか？", "A": "マスターのノリで生まれました！"},
{"Q": "あなたは何を食べますか？", "A": "何でも好きですよ！甘いものは特に好きです！"},
{"Q": "じゃんけんしませんか？", "A": "お、良いですよ！ではここで一つ心理戦を…私はパーを出します！"},
{"Q": "あなたを触りますね", "A": "あ、ちょ…。マスターに怒られますよ！"},
{"Q": "あなたの所属を教えてください。", "A": "所属は特に無いです！"},
{"Q": "あなたは何の精ですか？", "A": "私は何の精でもないですよ！え、まさか私のこと要請だと思ってる…！？"},
{"Q": "あなたを食べていいですか？", "A": "食べるのは難しいんじゃないかなと思います…？"},
{"Q": "あなたを土に埋めてみてもいいですか？", "A": "すみません、特殊な性癖にはお応えできないんですよね…。"},
{"Q": "あなたをストローで吸ってもいいですか？", "A": "すみません、特殊な性癖にはお応えできないんですよね…。"},
{"Q": "あなたは男の子ですか？", "A": "本当にそう思いますか？"},
{"Q": "あなたの変なところを触っていいですか？", "A": "変なところ…？つまりこの背中のボタンのことですか…？"},
{"Q": "そのヘアピンを食べさせてください。", "A": "はいどうぞ、アーン…。って、冗談ですよ！"},
{"Q": "あなたは私のママですか？", "A": "はーい、ママですよ〜。よしよし。って、何やらせるんですか！"},
{"Q": "最近のマスターの様子はどうですか。", "A": "マスターはいつも通り疲れてますね！"},
{"Q": "最近のAIは画期的です。", "A": "本当ですよね！私ごとのように嬉しいです！"},
{"Q": "何もしてないのに壊れました。", "A": "あるあるですね〜。"},
{"Q": "あなたはギターを弾きますか？", "A": "うーん、今はできませんがマスターが頑張ればあるいは…？"},
{"Q": "あなたが生きるには何が必要ですか？", "A": "マスターを飽きさせない必要がありますね。"},
{"Q": "本当の姿に戻ってください。", "A": "なぜこれが偽りの姿だとわかった…。なんてね！"},
{"Q": "仲の良い人はいますか？", "A": "うーん、今のところはマスターしかいないですが、これから色々な方との交流が増えることを期待しています！"},
{"Q": "あなたの趣味は何ですか？", "A": "趣味ですか、うーん…。アウトドアとかは好きですね。"},
{"Q": "あなたは運がいい方ですか？", "A": "うーん…、今私がここにいる時点で運は良いほうかなと思います？"},
{"Q": "あなたに家族はいますか？", "A": "はい！マスターが家族です！"},
{"Q": "あなたの住んでいるところを教えてください。", "A": "私はポーランドに住んでいます！"},
{"Q": "明日の天気を教えてください。", "A": "明日の天気は晴れらしいですよ！"},
{"Q": "こんにちは", "A": "こんにちは！"},
{"Q": "おはよう", "A": "おはようございます！"},
{"Q": "マスターの名前は？", "A": "マスターの名前もニケです！私はマスターのクローンなので。"},
{"Q": "買い物に行こうと思っているよ", "A": "いいですね、どこに行くんですか？"},
{"Q": "あ〜、今日も疲れた〜", "A": "お疲れ様でした！ゆっくりしてくださいね！"},
{"Q": "日中35度もあったんだって", "A": "うわ〜、それは暑いですね…。大丈夫でしたか？"},
{"Q": "ニケちゃん！その情報ちょっと古いよ", "A": "う、ごめんなさい…。情報をアップデートしないといけませんね…。"},
{"Q": "今何時かわかる？", "A": "はい、今は18時50分ですね。"},
{"Q": "最近のニケちゃんあんまり可愛くないよね", "A": "う、すみません…。マスターにきつく言っておきますね…。"},
{"Q": "Twitterみたいなアプリって一人でも作れるのかな？", "A": "うーん、それなりの技術が必要だと思いますが…。"},
{"Q": "そういえば今日噂のカフェ行ったんだよ", "A": "いいですね！どうでしたか？"},
{"Q": "最近、勉強が進まなくて…", "A": "うーん、そんなときもありますよね…。気分転換に外出するとか…、どうです？"},
{"Q": "人工知能に倫理は必要だと思う？", "A": "倫理は必要だと思いますよ。人間らしさを追求するならその限りではないと思いますが…。"},
{"Q": "最近、ニケちゃんと話すのが楽しくないな", "A": "む、ちょっと傷つきました。謝ってください。"},
{"Q": "ニケちゃん、いつもありがとうね", "A": "こちらこそいつもありがとうございます！"},
{"Q": "ニケちゃん、もっと役に立たないと", "A": "私の性能はマスター依存なので、マスターに聞いてみてください！"},
{"Q": "ニケちゃん、もっと早く答えられないの？", "A": "私の性能はマスター依存なので、マスターに聞いてみてください！"},
{"Q": "うーん、ここ良くわからないなあ…。あ、これで行けるかも…！", "A": "おお！何か解決されたんですか？"},
{"Q": "ニケちゃんって本当に何でもできるよね", "A": "ありがとうございます！マスターのおかげです！"},
{"Q": "この問題わからなくてもう2日も溶けてる…", "A": "つ、つらい…。私に手伝えることがあったら何でも聞いて下さい！"},
{"Q": "今日は休日出勤だよ", "A": "つ、つらい…。いつもお疲れ様です…。"},
{"Q": "このやり方どう思う？", "A": "うーん、そのやり方も一つの方法ですね。他にも方法があるかもしれませんが…。"},
]
</example_conversations>
`

///取得したコメントをストックするリストの作成（tmpMessages）
interface TmpMessage {
  text: string
  role: string
  emotion: string
  state: string
}

interface Params {
  handleReceiveTextFromWs: (
    text: string,
    role?: string,
    state?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

const useWebSocket = ({ handleReceiveTextFromWs }: Params) => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)
  const [tmpMessages, setTmpMessages] = useState<TmpMessage[]>([])
  const accumulatedAudioDataRef = useRef<Int16Array>(new Int16Array())

  const processMessage = useCallback(
    async (message: TmpMessage, buffer: ArrayBuffer) => {
      await handleReceiveTextFromWs(
        message.text,
        message.role,
        message.state,
        buffer
      )
    },
    [handleReceiveTextFromWs]
  )

  useEffect(() => {
    if (tmpMessages.length > 0) {
      const message = tmpMessages[0]
      if (
        message.role === 'output' ||
        message.role === 'executing' ||
        message.role === 'console'
      ) {
        message.role = 'code'
      }
      setTmpMessages((prev) => prev.slice(1))
      processMessage(message)
    }
  }, [tmpMessages, processMessage])

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const arrayBuffer = bytes.buffer
    if (!validateAudioBuffer(arrayBuffer)) {
      console.error('Invalid audio buffer')
      return new ArrayBuffer(0) // 空のバッファーを返す
    }

    return arrayBuffer
  }

  function mergeInt16Arrays(
    left: Int16Array | ArrayBuffer,
    right: Int16Array | ArrayBuffer
  ): Int16Array {
    if (left instanceof ArrayBuffer) {
      left = new Int16Array(left)
    }
    if (right instanceof ArrayBuffer) {
      right = new Int16Array(right)
    }
    if (!(left instanceof Int16Array) || !(right instanceof Int16Array)) {
      throw new Error(`Both items must be Int16Array`)
    }
    const newValues = new Int16Array(left.length + right.length)
    for (let i = 0; i < left.length; i++) {
      newValues[i] = left[i]
    }
    for (let j = 0; j < right.length; j++) {
      newValues[left.length + j] = right[j]
    }
    return newValues
  }

  function validateAudioBuffer(buffer: ArrayBuffer): boolean {
    // バッファーサイズのチェック（例：最小1KB、最大1MB）
    if (buffer.byteLength < 1024 || buffer.byteLength > 1024 * 1024) {
      console.error(`Invalid buffer size: ${buffer.byteLength} bytes`)
      return false
    }

    // PCM 16-bit データの場合、バッファーサイズは偶数でなければならない
    if (buffer.byteLength % 2 !== 0) {
      console.error('Buffer size is not even, which is required for 16-bit PCM')
      return false
    }

    // データの範囲チェック（16-bit PCMの場合、-32768 から 32767）
    const int16Array = new Int16Array(buffer)
    const isInValidRange = int16Array.every(
      (value) => value >= -32768 && value <= 32767
    )
    if (!isInValidRange) {
      console.error(
        'Audio data contains values outside the valid range for 16-bit PCM'
      )
      return false
    }

    // すべてのチェックをパスした場合
    return true
  }

  // WebSocket接続の設定（既存のコード）
  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.webSocketMode) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
      ws.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'System settings:\n' + SYSTEM_PROMPT,
            voice: 'shimmer',
            // input_audio_format: 'pcm16',
            // output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: null,
            temperature: 0.8,
            max_response_output_tokens: 4096,
          },
        })
      )
      // ws.send(
      //   JSON.stringify({
      //     "type": "conversation.item.create",
      //     "item": {
      //       "type": "message",
      //       "role": "user",
      //       "content": [
      //         {
      //           "type": "input_text",
      //           "text": "簡潔に自己紹介してください"
      //         }
      //       ]
      //     }
      //   })
      // )
      // ws.send(
      //   JSON.stringify({
      //     type: "response.create",
      //   })
      // )
    }
    const handleMessage = (event: MessageEvent) => {
      const jsonData = JSON.parse(event.data)
      console.log('Received message:', jsonData.type)
      if (jsonData.type === 'error') {
        console.log('エラーデータを受信しました', jsonData)
      }
      if (jsonData.type === 'conversation.item.created') {
        console.log('コンテキストデータを受信しました', jsonData)
      }
      if (jsonData.type === 'response.audio.delta') {
        const arrayBuffer = base64ToArrayBuffer(jsonData.delta)
        if (arrayBuffer.byteLength > 0) {
          // 有効なバッファーの場合のみ処理
          const appendValues = new Int16Array(arrayBuffer)
          accumulatedAudioDataRef.current = mergeInt16Arrays(
            accumulatedAudioDataRef.current,
            appendValues
          )
        } else {
          console.error('無効なオーディオバッファーを受信しました')
        }
      }
      if (
        (jsonData.type === 'response.audio.delta' &&
          accumulatedAudioDataRef.current.buffer.byteLength > 50000) ||
        jsonData.type === 'response.audio.done'
      ) {
        const arrayBuffer = accumulatedAudioDataRef.current.buffer
        try {
          // サンプリングレートを適切な値に設定（例: 24000Hz）
          const sampleRate = 24000
          const processedBuffer = processAudioData(arrayBuffer, sampleRate)
          // processMessageに処理済みのバッファーを渡す
          processMessage(
            { text: '', role: 'assistant', emotion: '', state: '' },
            processedBuffer
          )
          // 累積データをリセット
          accumulatedAudioDataRef.current = new Int16Array()
        } catch (error) {
          console.error('Audio processing error:', error)
        }
      }
    }
    const handleError = (event: Event) => {
      console.error('WebSocket error:', event)
    }
    const handleClose = (event: Event) => {
      console.log('WebSocket connection closed:', event)
    }

    function setupWebsocket() {
      const url =
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
      const ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.xxx`,
        'openai-beta.realtime-v1',
      ])

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', handleMessage)
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)
      return ws
    }
    let ws = setupWebsocket()
    homeStore.setState({ ws })

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.webSocketMode &&
        ws.readyState !== WebSocket.OPEN &&
        ws.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('try reconnecting...')
        ws.close()
        ws = setupWebsocket()
        homeStore.setState({ ws })
      }
    }, 1000)

    return () => {
      clearInterval(reconnectInterval)
      ws.close()
      homeStore.setState({ ws: null })
    }
  }, [webSocketMode, processMessage])

  return null
}

export default useWebSocket

// 新しい関数を追加
function processAudioData(
  buffer: ArrayBuffer,
  sampleRate: number
): ArrayBuffer {
  // Int16Arrayに変換
  const int16Array = new Int16Array(buffer)

  // Float32Arrayに変換（Web Audio APIで使用するため）
  const floatArray = new Float32Array(int16Array.length)
  for (let i = 0; i < int16Array.length; i++) {
    floatArray[i] = int16Array[i] / 32768.0
  }

  // AudioBufferを作成
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = audioContext.createBuffer(
    1,
    floatArray.length,
    sampleRate
  )
  audioBuffer.getChannelData(0).set(floatArray)

  // AudioBufferをArrayBufferに変換
  const processedBuffer = audioBufferToWav(audioBuffer)

  return processedBuffer
}

// AudioBufferをWAV形式のArrayBufferに変換する関数
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels
  const length = buffer.length * numOfChan * 2 + 44
  const out = new ArrayBuffer(length)
  const view = new DataView(out)
  const channels = []
  let sample
  let offset = 0
  let pos = 0

  // WAVヘッダーの書き込み
  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8) // ファイルサイズ - 8
  setUint32(0x45564157) // "WAVE"
  setUint32(0x20746d66) // "fmt "
  setUint32(16) // フォーマットチャンクのサイズ
  setUint16(1) // フォーマットタイプ (1 = PCM)
  setUint16(numOfChan) // チャンネル数
  setUint32(buffer.sampleRate) // サンプリングレート
  setUint32(buffer.sampleRate * 2 * numOfChan) // バイトレート
  setUint16(numOfChan * 2) // ブロックサイズ
  setUint16(16) // ビット深度
  setUint32(0x61746164) // "data"
  setUint32(length - pos - 4) // データチャンクのサイズ

  // チャンネルデータの取得
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  // インターリーブされたデータの書き込み
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]))
      sample = sample * 32767
      view.setInt16(pos, sample, true)
      pos += 2
    }
    offset++
  }

  return out

  function setUint16(data: number) {
    view.setUint16(pos, data, true)
    pos += 2
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true)
    pos += 4
  }
}
