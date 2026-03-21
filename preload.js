const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronApp', {
  isDesktop: true,
  openMobileWindow: async () => ipcRenderer.invoke('window:open-mobile'),
  closeMobileWindow: async () => ipcRenderer.invoke('window:close-mobile'),
  focusMainWindow: async () => ipcRenderer.invoke('window:focus-main'),
  hideMainWindow: async () => ipcRenderer.invoke('window:hide-main'),
  getMobileWindowBounds: async () =>
    ipcRenderer.invoke('window:get-mobile-bounds'),
  setMobileWindowPosition: async (x, y) =>
    ipcRenderer.invoke('window:set-mobile-position', x, y),
})
