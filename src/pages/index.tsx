import { Form } from '@/components/form'
import MessageReceiver from '@/components/messageReceiver'
import { Introduction } from '@/components/introduction'
import { Menu } from '@/components/menu'
import { Meta } from '@/components/meta'
import ModalImage from '@/components/modalImage'
import VrmViewer from '@/components/vrmViewer'
import { Toasts } from '@/components/toasts'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import '@/lib/i18n'
import { buildUrl } from '@/utils/buildUrl'
import { useEffect } from 'react'

const Home = () => {
  const bgUrl = homeStore((s) => `url(${buildUrl(s.backgroundImageUrl)})`)
  const messageReceiverEnabled = settingsStore((s) => s.messageReceiverEnabled)

  useEffect(() => {
    // ページがロードされたときにトーストメッセージを表示
    toastStore.getState().addToast({
      message: 'ページが正常にロードされました',
      type: 'success',
      duration: 500000,
      tag: 'page-load-success',
    })
    toastStore.getState().addToast({
      message: 'エラーが発生しました',
      type: 'error',
      duration: 5000,
      tag: 'page-load-error',
    })
    toastStore.getState().addToast({
      message: '情報メッセージ',
      type: 'info',
      duration: 5000,
      tag: 'page-load-info',
    })
  }, [])

  return (
    <div className="min-h-screen bg-cover" style={{ backgroundImage: bgUrl }}>
      <Meta />
      <Introduction />
      <VrmViewer />
      <Form />
      <Menu />
      <ModalImage />
      {messageReceiverEnabled && <MessageReceiver />}
      <Toasts />
    </div>
  )
}

export default Home
