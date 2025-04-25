import React, { useEffect, useState, useCallback, KeyboardEvent } from 'react' // KeyboardEvent をインポート
import { useRouter } from 'next/router'
import slideStore from '@/features/stores/slide'
import SlideContent from '@/components/slideContent'
import SlideControls from '@/components/slideControls'

// goToSlide関数はslides.tsxからインポートするか、ここで再定義
export const goToSlide = (index: number) => {
  slideStore.setState({
    currentSlide: index,
  })
}

const SlideEditorPage: React.FC = () => {
  const router = useRouter()
  const { slideName } = router.query

  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const currentSlide = slideStore((state) => state.currentSlide)
  const [slideCount, setSlideCount] = useState(0)
  const [scripts, setScripts] = useState<
    { page: number; line: string; notes?: string }[]
  >([])
  const [currentScript, setCurrentScript] = useState('')
  const [currentNotes, setCurrentNotes] = useState('')
  const [supplementContent, setSupplementContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [initialScripts, setInitialScripts] = useState<typeof scripts>([])
  const [initialSupplementContent, setInitialSupplementContent] = useState('')
  const [isComposing, setIsComposing] = useState(false) // IME変換中フラグ
  const [screenWidth, setScreenWidth] = useState(0) // 画面幅を管理するstate

  // 画面幅の取得と更新
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }

    updateScreenWidth()

    window.addEventListener('resize', updateScreenWidth)

    return () => {
      window.removeEventListener('resize', updateScreenWidth)
    }
  }, [])

  // Marp スライドの取得と表示
  useEffect(() => {
    if (!slideName) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setIsError(false)
    setErrorMessage('')

    let styleElement: HTMLStyleElement | null = null
    let customStyleElement: HTMLStyleElement | null = null
    const controller = new AbortController() //
    const signal = controller.signal

    const convertMarkdown = async () => {
      try {
        const response = await fetch('/api/convertMarkdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideName: slideName as string }),
          signal: signal,
        })
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              `指定されたスライド "${slideName}" が見つかりません。`
            )
          }
          throw new Error(
            `Failed to fetch converted markdown: ${response.status} ${response.statusText}`
          )
        }
        const data = await response.json()

        const parser = new DOMParser()
        const doc = parser.parseFromString(data.html, 'text/html')
        const marpitElement = doc.querySelector('.marpit')
        setMarpitContainer(marpitElement)

        if (marpitElement) {
          const slides = marpitElement.querySelectorAll(':scope > svg')
          setSlideCount(slides.length)
          slides.forEach((slide, i) => {
            const svg = slide as SVGElement
            svg.style.display = i === 0 ? 'block' : 'none'
          })
        }

        styleElement = document.createElement('style')
        styleElement.textContent = data.css
        styleElement.setAttribute('data-marp-css', 'true')
        document.head.appendChild(styleElement)

        const customStyle = `div.marpit > svg > foreignObject > section { padding: 2em; }`
        customStyleElement = document.createElement('style')
        customStyleElement.textContent = customStyle
        customStyleElement.setAttribute('data-custom-css', 'true')
        document.head.appendChild(customStyleElement)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted: convertMarkdown')
          return
        }
        console.error('Error converting markdown:', error)
        setIsError(true)
        setErrorMessage(
          error.message || 'スライドデータの読み込み中にエラーが発生しました。'
        )
      }
    }

    convertMarkdown()

    return () => {
      controller.abort()
      const addedStyle = document.head.querySelector(
        'style[data-marp-css="true"]'
      )
      const addedCustomStyle = document.head.querySelector(
        'style[data-custom-css="true"]'
      )
      if (addedStyle) document.head.removeChild(addedStyle)
      if (addedCustomStyle) document.head.removeChild(addedCustomStyle)
    }
  }, [slideName])

  // スライド表示の更新
  useEffect(() => {
    if (!marpitContainer) return
    const slides = marpitContainer.querySelectorAll(':scope > svg')
    slides.forEach((slide, i) => {
      ;(slide as SVGElement).style.display =
        i === currentSlide ? 'block' : 'none'
    })
  }, [currentSlide, marpitContainer])

  // scripts.json の読み込み
  useEffect(() => {
    if (!slideName || isError) return
    const controller = new AbortController()
    const signal = controller.signal

    const fetchScripts = async () => {
      try {
        const response = await fetch(`/slides/${slideName}/scripts.json`, {
          signal: signal,
        })
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(
              `scripts.json not found for slide "${slideName}". Proceeding with empty scripts.`
            )
            setScripts([])
            setInitialScripts([])
            return
          }
          throw new Error(
            `Failed to fetch scripts: ${response.status} ${response.statusText}`
          )
        }
        const data = await response.json()
        if (
          Array.isArray(data) &&
          data.every(
            (item) =>
              typeof item.page === 'number' && typeof item.line === 'string'
          )
        ) {
          const fetchedScripts = data as typeof scripts
          setScripts(fetchedScripts)
          setInitialScripts(fetchedScripts)
        } else {
          console.error(
            'Fetched scripts data is not in the expected format:',
            data
          )
          setScripts([])
          setInitialScripts([])
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted: fetchScripts')
          return
        }
        console.error('Error fetching scripts:', error)
        setIsError(true)
        setErrorMessage(
          error.message ||
            'スクリプトデータの読み込み中にエラーが発生しました。'
        )
        setScripts([])
        setInitialScripts([])
      }
    }
    fetchScripts()

    return () => {
      controller.abort()
    }
  }, [slideName, isError])

  // supplement.txt の読み込み
  useEffect(() => {
    if (!slideName || isError) return
    const controller = new AbortController()
    const signal = controller.signal

    const fetchSupplement = async () => {
      try {
        const response = await fetch(
          `/api/getSupplement?slideName=${slideName}`,
          { signal: signal }
        )
        if (!response.ok && response.status !== 404) {
          throw new Error(
            `Failed to fetch supplement content: ${response.status} ${response.statusText}`
          )
        }
        // 404の場合でも .json() を呼ぶとエラーになるため、okの場合のみ処理する
        let fetchedContent = ''
        if (response.ok) {
          const data = await response.json()
          fetchedContent = data.content || ''
        } else {
          // 404 の場合は空文字列として扱う
          console.warn(
            `supplement.txt not found for slide "${slideName}". Proceeding with empty content.`
          )
        }

        setSupplementContent(fetchedContent)
        setInitialSupplementContent(fetchedContent)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted: fetchSupplement')
          return
        }
        console.error('Error fetching supplement content:', error)
        setIsError(true)
        setErrorMessage(
          error.message || '補足情報の読み込み中にエラーが発生しました。'
        )
        setSupplementContent('')
        setInitialSupplementContent('')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSupplement()

    // クリーンアップ関数で abort を呼び出す
    return () => {
      controller.abort()
    }
  }, [slideName, isError])

  // 現在のスライドに対応するセリフと追加情報を更新
  useEffect(() => {
    const script = scripts.find((s) => s.page === currentSlide)
    setCurrentScript(script ? script.line : '')
    setCurrentNotes(script && script.notes ? script.notes : '')
  }, [currentSlide, scripts])

  // スライド移動関数
  const nextSlide = useCallback(() => {
    slideStore.setState((state) => ({
      currentSlide: Math.min(state.currentSlide + 1, slideCount - 1),
    }))
  }, [slideCount])

  const prevSlide = useCallback(() => {
    slideStore.setState((state) => ({
      currentSlide: Math.max((state.currentSlide ?? 0) - 1, 0),
    }))
  }, [])

  // scripts ステートを更新する関数
  const updateScriptsState = useCallback(
    (pageIndex: number, field: 'line' | 'notes', value: string) => {
      setScripts((prevScripts) => {
        const scriptIndex = prevScripts.findIndex((s) => s.page === pageIndex)
        let updatedScripts
        if (scriptIndex !== -1) {
          updatedScripts = prevScripts.map((script, index) =>
            index === scriptIndex ? { ...script, [field]: value } : script
          )
        } else {
          const newLine = field === 'line' ? value : ''
          const newNotes = field === 'notes' ? value : ''
          updatedScripts = [
            ...prevScripts,
            { page: pageIndex, line: newLine, notes: newNotes },
          ]
          updatedScripts.sort((a, b) => a.page - b.page)
        }
        return updatedScripts
      })
    },
    []
  )

  // セリフ編集ハンドラ
  const handleScriptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = event.target.value
    setCurrentScript(newValue)
    // IME変換中でなければ、入力のたびにscriptsステートも更新
    if (!isComposing) {
      updateScriptsState(currentSlide, 'line', newValue)
    }
  }

  // 追加情報編集ハンドラ
  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    setCurrentNotes(newValue)
    // IME変換中でなければ、入力のたびにscriptsステートも更新
    if (!isComposing) {
      updateScriptsState(currentSlide, 'notes', newValue)
    }
  }

  // 補足情報編集ハンドラ
  const handleSupplementChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSupplementContent(event.target.value)
  }

  // 保存処理 (useCallbackでメモ化)
  const handleSave = useCallback(async () => {
    if (!slideName) return
    console.log(
      'Saving data for slide:',
      slideName,
      'Scripts:',
      scripts,
      'Supplement:',
      supplementContent
    )

    try {
      const response = await fetch('/api/updateSlideData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideName: slideName as string,
          scripts: scripts,
          supplementContent: supplementContent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save script: ${response.statusText}`)
      }

      await response.json()
      console.log('Save successful')
      alert('Scripts and supplementary information have been saved.')

      setInitialScripts(scripts)
      setInitialSupplementContent(supplementContent)
    } catch (error) {
      console.error('Error saving script:', error)
      alert('Failed to save scripts and supplementary information.')
    }
  }, [slideName, scripts, supplementContent])

  // 変更を元に戻す処理
  const handleRevert = useCallback(() => {
    setScripts(initialScripts)
    setSupplementContent(initialSupplementContent)
    const script = initialScripts.find((s) => s.page === currentSlide)
    setCurrentScript(script ? script.line : '')
    setCurrentNotes(script && script.notes ? script.notes : '')
  }, [initialScripts, initialSupplementContent, currentSlide])

  const calculateSlideSize = useCallback(() => {
    let maxHeight = '65vh'
    let maxWidth = '70vw'

    // 画面幅に基づいてサイズを調整
    if (screenWidth < 768) {
      // スマートフォンなど小さい画面
      maxHeight = '80vh'
      maxWidth = '90vw'
    } else if (screenWidth < 1024) {
      // タブレットなど中程度の画面
      maxHeight = '70vh'
      maxWidth = '80vw'
    }
    // 1024px以上はデフォルト値を使用

    const width = `calc(${maxHeight} * (16 / 9))`
    return {
      width: `min(${width}, ${maxWidth})`,
      height: `min(calc(${maxWidth} * (9 / 16)), ${maxHeight})`,
    }
  }, [screenWidth])

  const slideSize = calculateSlideSize()

  // isDirty の計算
  const isDirty = React.useMemo(() => {
    const currentScriptsJson = JSON.stringify(
      [...scripts].sort((a, b) => a.page - b.page)
    )
    const initialScriptsJson = JSON.stringify(
      [...initialScripts].sort((a, b) => a.page - b.page)
    )
    const isScriptsDirty = currentScriptsJson !== initialScriptsJson
    const isSupplementDirty = supplementContent !== initialSupplementContent
    return isScriptsDirty || isSupplementDirty
  }, [scripts, supplementContent, initialScripts, initialSupplementContent])

  // Ctrl+S / Cmd+S で保存する処理
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (isDirty) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDirty, handleSave])

  // 左右矢印キーでページ移動
  useEffect(() => {
    const handleArrowKeys = (event: globalThis.KeyboardEvent) => {
      if (
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLInputElement
      ) {
        return
      }
      if (event.key === 'ArrowLeft') {
        prevSlide()
      } else if (event.key === 'ArrowRight') {
        nextSlide()
      }
    }
    window.addEventListener('keydown', handleArrowKeys)
    return () => {
      window.removeEventListener('keydown', handleArrowKeys)
    }
  }, [prevSlide, nextSlide])

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">読み込み中...</p>
      </div>
    )
  }

  // エラー発生時の表示
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <h1 className="text-2xl font-bold mb-4">エラー</h1>
        <p>{errorMessage}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
        >
          戻る
        </button>
      </div>
    )
  }

  // 通常の表示
  return (
    <div className="flex flex-col items-center text-black min-h-screen bg-purple-50 py-8">
      <div className="w-full px-4 md:px-8">
        <h1 className="text-text-primary text-3xl font-bold mb-8 text-center">
          スライド編集: {slideName}
        </h1>
        <div
          className="bg-white shadow-md w-full mb-8 rounded-xl shadow-md"
          style={{ width: slideSize.width, margin: '0 auto' }}
        >
          <div className="mb-2 bg-white px-4 pt-4 rounded-xl">
            <div style={{ height: slideSize.height, position: 'relative' }}>
              <SlideContent marpitContainer={marpitContainer} />
            </div>
          </div>
          <div className="mb-8 bg-white pt-2">
            <SlideControls
              currentSlide={currentSlide}
              slideCount={slideCount}
              isPlaying={false}
              prevSlide={prevSlide}
              nextSlide={nextSlide}
              toggleIsPlaying={() => {}}
              showPlayButton={false} // 中央ボタンを非表示にする
            />
          </div>
          <div className="bg-white p-6 rounded-xl">
            {/* セリフ編集 */}
            <div className="mb-6">
              <h2 className="text-text-primary text-lg font-bold mb-3">
                ページ {currentSlide + 1} のセリフ
              </h2>
              <textarea
                value={currentScript}
                onChange={handleScriptChange}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => {
                  setIsComposing(false)
                  updateScriptsState(
                    currentSlide,
                    'line',
                    (e.target as HTMLTextAreaElement).value
                  )
                }}
                // onBlur は不要になったので削除
                rows={4}
                className="border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white rounded-xl w-full px-4 text-text-primary text-base font-medium transition-all duration-200"
                style={{
                  lineHeight: '1.5',
                  padding: '12px 16px',
                  resize: 'vertical',
                }}
                placeholder="このページのセリフを入力..."
              />
            </div>
            {/* 追加情報編集 */}
            <div className="mb-6">
              <h2 className="text-text-primary text-lg font-bold mb-3">
                追加情報
              </h2>
              <textarea
                value={currentNotes}
                onChange={handleNotesChange}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => {
                  setIsComposing(false)
                  updateScriptsState(
                    currentSlide,
                    'notes',
                    (e.target as HTMLTextAreaElement).value
                  )
                }}
                // onBlur は不要になったので削除
                rows={3}
                className="border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white rounded-xl w-full px-4 text-text-primary text-base font-medium transition-all duration-200"
                style={{
                  lineHeight: '1.5',
                  padding: '12px 16px',
                  resize: 'vertical',
                }}
                placeholder="追加情報を入力..."
              />
            </div>
            {/* スライド全体の補足情報編集 */}
            <div className="mb-6">
              <h2 className="text-text-primary text-lg font-bold mb-3">
                スライド全体の補足情報 (supplement.txt)
              </h2>
              <textarea
                value={supplementContent}
                onChange={handleSupplementChange}
                rows={5}
                className="border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white rounded-xl w-full px-4 text-text-primary text-base font-medium transition-all duration-200"
                style={{
                  lineHeight: '1.5',
                  padding: '12px 16px',
                  resize: 'vertical',
                }}
                placeholder="スライド全体に関する補足情報を入力..."
              />
            </div>
            {/* ボタンエリア */}
            <div className="flex justify-center gap-4 mt-8">
              {' '}
              {/* 右寄せに戻し、gapで間隔調整 */}
              {/* 元に戻すボタン */}
              <button
                onClick={handleRevert}
                className={`px-6 py-3 rounded-xl font-bold transition-colors duration-200 ${
                  !isDirty
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                disabled={!isDirty}
              >
                元に戻す
              </button>
              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-colors duration-200 ${
                  !slideName || !isDirty
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
                disabled={!slideName || !isDirty}
              >
                {isDirty ? '変更を保存 *' : '保存済み'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlideEditorPage
