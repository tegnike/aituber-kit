import { Form } from '@/components/form';
import { Introduction } from '@/components/introduction';
import { Menu } from '@/components/menu';
import { Meta } from '@/components/meta';
import ModalImage from '@/components/modal-image';
import VrmViewer from '@/components/vrmViewer';
import homeStore from '@/features/stores/home';
import '@/lib/i18n';
import { buildUrl } from '@/utils/buildUrl';
import c from '@/styles/home.module.scss';

const Home = () => {
  const backgroundImage = homeStore(
    (s) => `url(${buildUrl(s.backgroundImageUrl)})`,
  );

  return (
    <div className={c.home} style={{ backgroundImage }}>
      <Meta />
      <Introduction />
      <VrmViewer />
      <Form />
      <Menu />
      <ModalImage />
    </div>
  );
};
export default Home;
