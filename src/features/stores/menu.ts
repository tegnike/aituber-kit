// TODO: (7741) create an index
import { create } from 'zustand';

interface MenuState {
  showWebcam: boolean;
  fileInput: HTMLInputElement | null;
  bgFileInput: HTMLInputElement | null;
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  fileInput: null,
  bgFileInput: null,
}));
export default menuStore;
