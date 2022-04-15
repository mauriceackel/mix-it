import Playlist from './Playlist';
import Track from './Track';

export type EncodedError = {
  name: string;
  message: string;
  extra: any;
};

export type SuccessResponse<T> = {
  result: T;
};

export type ErrorResponse = {
  error: EncodedError;
};

export type Response<T> = SuccessResponse<T> | ErrorResponse;

interface ElectronApi {
  startSongServer: (host: string, port: number) => Promise<Response<void>>;
  stopSongServer: () => Promise<Response<void>>;
  onSongUpdate: (callback: (track: Track) => void) => void;
  onConnectionUpdate: (callback: (connected: boolean) => void) => void;
  importPlaylists: () => Promise<Response<Playlist[]>>;
}

export default ElectronApi;
