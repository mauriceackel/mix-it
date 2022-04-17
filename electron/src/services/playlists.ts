import { dialog, ipcMain } from 'electron';

import PlaylistParser from 'utils/PlaylistParser';
import { handlerWrapper } from 'utils/errorBridge';

import type Playlist from 'models/Playlist';

// Import playlist
ipcMain.handle('importPlaylists', handlerWrapper(importPlaylists));

async function importPlaylists(): Promise<Playlist[]> {
  const dialogResult = await dialog.showOpenDialog({
    title: 'Open playlists',
    message: 'Select playlists to open',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Traktor/iTunes Playlist', extensions: ['nml', 'xml'] }],
  });

  if (dialogResult.canceled) {
    return [];
  }

  const playlistPromises = dialogResult.filePaths.map((playlistPath) => {
    return PlaylistParser.parsePlaylist(playlistPath);
  });

  const settledPlaylistPromises = await Promise.allSettled(playlistPromises);

  const importedPlaylists: Playlist[] = settledPlaylistPromises
    .filter(
      (entry): entry is PromiseFulfilledResult<Playlist[]> =>
        entry.status === 'fulfilled',
    )
    .flatMap((entry) => entry.value);

  return importedPlaylists;
}
