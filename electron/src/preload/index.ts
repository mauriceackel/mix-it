import { contextBridge, ipcRenderer } from 'electron';

import ElectronApi from '@models/ElectronApi';

const electronApi: ElectronApi = {
  startSongServer: (host, port) =>
    ipcRenderer.invoke('startSongServer', host, port),
  stopSongServer: () => ipcRenderer.invoke('stopSongServer'),
  onSongUpdate: (callback) =>
    ipcRenderer.on('songUpdate', (_, track) => callback(track)),
  onConnectionUpdate: (callback) =>
    ipcRenderer.on('connectionUpdate', (_, connected) => callback(connected)),
  importPlaylists: () => ipcRenderer.invoke('importPlaylists'),
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
