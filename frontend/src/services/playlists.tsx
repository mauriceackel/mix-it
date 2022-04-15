import { ELECTRON_ENABLED } from 'config';
import React, {
  PropsWithChildren,
  ReactElement,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import Playlist from 'models/Playlist';

interface AddPlaylistsAction {
  type: 'ADD';
  playlists: Playlist[];
}

interface RemovePlaylistsAction {
  type: 'REMOVE';
  playlist: Playlist;
}

interface SelectPlaylistsAction {
  type: 'SELECT';
  playlist: Playlist;
}

interface DeselectPlaylistsAction {
  type: 'DESELECT';
  playlist: Playlist;
}

interface OverwriteAction {
  type: 'OVERWRITE';
  state: PlaylistStateModel;
}

type PlaylistAction =
  | AddPlaylistsAction
  | SelectPlaylistsAction
  | DeselectPlaylistsAction
  | OverwriteAction
  | RemovePlaylistsAction;

interface PlaylistStateModel {
  playlists: Playlist[];
  selectedPlaylists: Playlist[];
}

interface SerializedPlaylistStateModel {
  playlists: Playlist[];
  selectedPlaylistIds: string[];
}

interface PlaylistContextModel extends PlaylistStateModel {
  dispatch: React.Dispatch<PlaylistAction>;
}

function playlistReducer(
  currentState: PlaylistStateModel,
  action: PlaylistAction,
): PlaylistStateModel {
  switch (action.type) {
    case 'OVERWRITE': {
      return action.state;
    }
    case 'ADD': {
      return {
        ...currentState,
        playlists: [...currentState.playlists, ...action.playlists],
      };
    }
    case 'REMOVE': {
      return {
        ...currentState,
        playlists: currentState.playlists.filter((p) => p !== action.playlist),
        selectedPlaylists: currentState.selectedPlaylists.filter(
          (p) => p !== action.playlist,
        ),
      };
    }
    case 'SELECT': {
      return {
        ...currentState,
        selectedPlaylists: [...currentState.selectedPlaylists, action.playlist],
      };
    }
    case 'DESELECT': {
      return {
        ...currentState,
        selectedPlaylists: currentState.selectedPlaylists.filter(
          (p) => p.id !== action.playlist.id,
        ),
      };
    }
    default: {
      return currentState;
    }
  }
}

const defaultState: PlaylistStateModel = {
  playlists: [],
  selectedPlaylists: [],
};
export const defaultContext: PlaylistContextModel = {
  ...defaultState,
  dispatch: () => {},
};

const PlaylistContext =
  React.createContext<PlaylistContextModel>(defaultContext);
export default PlaylistContext;

export function PlaylistContextProvider(
  props: PropsWithChildren<unknown>,
): ReactElement {
  const { children } = props;

  const [state, dispatch] = useReducer(playlistReducer, defaultState);

  // Load data from localStorage
  useEffect(() => {
    const rawData = localStorage.getItem('playlists');
    if (!rawData) return;

    const serializedState: SerializedPlaylistStateModel = JSON.parse(rawData);

    const deserializedState: PlaylistStateModel = {
      playlists: serializedState.playlists,
      selectedPlaylists: serializedState.selectedPlaylistIds
        .map((id) => serializedState.playlists.find((p) => p.id === id))
        .filter((p): p is Playlist => !!p),
    };

    dispatch({ type: 'OVERWRITE', state: deserializedState });
  }, []);

  // Store data to localStorage
  useEffect(() => {
    const serializedState: SerializedPlaylistStateModel = {
      playlists: state.playlists,
      selectedPlaylistIds: state.selectedPlaylists.map((p) => p.id),
    };

    localStorage.setItem('playlists', JSON.stringify(serializedState));
  }, [state]);

  const contextValue = useMemo(
    () => ({ ...state, dispatch }),
    [state, dispatch],
  );

  return (
    <PlaylistContext.Provider value={contextValue}>
      {children}
    </PlaylistContext.Provider>
  );
}

export async function importPlaylists(): Promise<Playlist[]> {
  if (ELECTRON_ENABLED) {
    return importPlaylistsElectron();
  }

  return importPlaylistsWeb();
}

export async function importPlaylistsWeb(): Promise<Playlist[]> {
  throw new Error('Function not defined');
}

export async function importPlaylistsElectron(): Promise<Playlist[]> {
  const playlists: Playlist[] = await window.electronApi.importPlaylists();

  return playlists;
}
