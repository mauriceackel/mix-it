import { TrashIcon } from '@heroicons/react/outline';
import objectHash from 'object-hash';
import React, { ReactElement, useCallback, useContext, useMemo } from 'react';

import ConfigContext from 'services/config';
import PlaylistContext, { importPlaylists } from 'services/playlists';

import Playlist from 'models/Playlist';

import Checkbox from './Checkbox';

type PlaylistsProps = {
  className?: string;
};
function Playlists(props: PlaylistsProps): ReactElement {
  const { className } = props;

  const { playlists, dispatch } = useContext(PlaylistContext);

  const handleImportPlaylists = useCallback(async () => {
    const importedPlaylists = await importPlaylists();
    dispatch({ type: 'ADD', playlists: importedPlaylists });
  }, [dispatch]);

  return (
    <div className={className}>
      <div className="flex flex-col w-full h-full p-2 bg-gray-700 text-white overflow-hidden">
        <header className="flex items-center justify-between">
          <h6 className="font-bold">Playlists</h6>
          <button
            type="button"
            className="text-green-400 font-bold px-4 py-2"
            onClick={handleImportPlaylists}
          >
            +
          </button>
        </header>

        <div className="flex flex-col flex-grow overflow-y-auto">
          {playlists.map((playlist) => (
            <PlaylistEntry key={objectHash(playlist)} playlist={playlist} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlaylistEntryProps {
  playlist: Playlist;
}
function PlaylistEntry(props: PlaylistEntryProps): ReactElement {
  const { playlist } = props;

  const { selectedPlaylists, dispatch } = useContext(PlaylistContext);
  const { editEnabled } = useContext(ConfigContext);

  const selected = useMemo(() => {
    return selectedPlaylists.includes(playlist);
  }, [playlist, selectedPlaylists]);

  const handleSelection = useCallback(() => {
    if (selected) {
      dispatch({ type: 'DESELECT', playlist });
    } else {
      dispatch({ type: 'SELECT', playlist });
    }
  }, [dispatch, playlist, selected]);

  const handleDelete = useCallback(() => {
    dispatch({ type: 'REMOVE', playlist });
  }, [dispatch, playlist]);

  return (
    <div className="flex items-center justify-between">
      <Checkbox checked={selected} onChange={handleSelection}>
        <p className="select-none">{playlist.name}</p>
      </Checkbox>

      {editEnabled && (
        <TrashIcon className="text-pink-600 h-4" onClick={handleDelete} />
      )}
    </div>
  );
}

export default Playlists;
