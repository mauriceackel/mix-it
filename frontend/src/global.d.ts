import ElectronApi from 'models/ElectronApi';

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}

export {};
