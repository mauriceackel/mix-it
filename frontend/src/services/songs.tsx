import { ELECTRON_ENABLED } from 'config';
import React, {
  PropsWithChildren,
  ReactElement,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import Track from 'models/Track';

interface SetSongAction {
  type: 'SET_SONG';
  song: Track | undefined;
}

interface SetRunningAction {
  type: 'SET_RUNNING';
  serverRunning: boolean;
}

interface SetConnectedAction {
  type: 'SET_CONNECTED';
  isConnected: boolean;
}

type SongAction = SetSongAction | SetRunningAction | SetConnectedAction;

interface SongStateModel {
  currentSong: Track | undefined;
  serverRunning: boolean;
  isConnected: boolean;
}

interface SongContextModel extends SongStateModel {
  dispatch: React.Dispatch<SongAction>;
}

function songReducer(
  currentState: SongStateModel,
  action: SongAction,
): SongStateModel {
  switch (action.type) {
    case 'SET_SONG': {
      return {
        ...currentState,
        currentSong: action.song,
      };
    }
    case 'SET_RUNNING': {
      return {
        ...currentState,
        serverRunning: action.serverRunning,
      };
    }
    case 'SET_CONNECTED': {
      return {
        ...currentState,
        isConnected: action.isConnected,
      };
    }
    default: {
      return currentState;
    }
  }
}

const defaultSongState: SongStateModel = {
  currentSong: undefined,
  serverRunning: false,
  isConnected: false,
};
const defaultSongContext: SongContextModel = {
  ...defaultSongState,
  dispatch: () => {},
};

const SongContext = React.createContext<SongContextModel>(defaultSongContext);
export default SongContext;

export function SongContextProvider(
  props: PropsWithChildren<unknown>,
): ReactElement {
  const { children } = props;

  const [state, dispatch] = useReducer(songReducer, defaultSongState);

  useEffect(() => {
    window.electronApi.onSongUpdate((track) => {
      dispatch({ type: 'SET_SONG', song: track });
    });

    window.electronApi.onConnectionUpdate((connected) => {
      dispatch({ type: 'SET_CONNECTED', isConnected: connected });
    });
  }, []);

  const contextValue = useMemo(() => {
    return { ...state, dispatch };
  }, [state, dispatch]);

  return (
    <SongContext.Provider value={contextValue}>{children}</SongContext.Provider>
  );
}

export async function startSongServer(host: string, port: number) {
  if (!ELECTRON_ENABLED) {
    throw new Error(
      'This function is only available using the desktop version',
    );
  }

  await window.electronApi.startSongServer(host, port);
}

export async function stopSongServer() {
  if (!ELECTRON_ENABLED) {
    throw new Error(
      'This function is only available using the desktop version',
    );
  }

  await window.electronApi.stopSongServer();
}
