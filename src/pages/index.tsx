import { Form } from '@/components/form'
import MessageReceiver from '@/components/messageReceiver'
import { Introduction } from '@/components/introduction'
import { Menu } from '@/components/menu'
import { Meta } from '@/components/meta'
import ModalImage from '@/components/modalImage'
import VrmViewer from '@/components/vrmViewer'
import homeStore from '@/features/stores/home'
import '@/lib/i18n'
import { buildUrl } from '@/utils/buildUrl'

const Home = () => {
  const bgUrl = homeStore((s) => `url(${buildUrl(s.backgroundImageUrl)})`)

  return (
    <div className="min-h-screen bg-cover" style={{ backgroundImage: bgUrl }}>
      <Meta />
      <Introduction />
      <VrmViewer />
      <Form />
      <Menu />
      <ModalImage />
      <MessageReceiver />
    </div>
  )
}
export default Home
