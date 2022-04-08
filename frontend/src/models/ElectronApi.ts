import Playlist from './Playlist';
import Track from './Track';

interface ElectronApi {
  startSongServer: (host: string, port: number) => Promise<void>;
  stopSongServer: () => Promise<void>;
  onSongUpdate: (callback: (track: Track) => void) => void;
  onConnectionUpdate: (callback: (connected: boolean) => void) => void;
  importPlaylists: () => Promise<Playlist[]>;
}

export default ElectronApi;
