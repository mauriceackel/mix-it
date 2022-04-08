import classNames from 'classnames';
import React, { ReactElement, useCallback, useContext } from 'react';

import ConfigContext from 'services/config';
import SongContext, { startSongServer, stopSongServer } from 'services/songs';

type SongServerProps = {
  className?: string;
};
function SongServer(props: SongServerProps): ReactElement {
  const { className } = props;

  const {
    serverRunning,
    isConnected,
    currentSong,
    dispatch: dispatchSong,
  } = useContext(SongContext);

  const {
    host,
    port,
    editEnabled,
    dispatch: dispatchConfig,
  } = useContext(ConfigContext);

  const handleServerToggle = useCallback(async () => {
    if (serverRunning) {
      await stopSongServer();
      dispatchSong({ type: 'SET_RUNNING', serverRunning: false });
    } else {
      await startSongServer(host, port);
      dispatchSong({ type: 'SET_RUNNING', serverRunning: true });
    }
  }, [dispatchSong, serverRunning, host, port]);

  const handleHostChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatchConfig({
        type: 'SET_HOST',
        host: event.currentTarget.value,
      });
    },
    [dispatchConfig],
  );

  const handlePortChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatchConfig({
        type: 'SET_PORT',
        port: event.currentTarget.valueAsNumber,
      });
    },
    [dispatchConfig],
  );

  return (
    <div className={className}>
      <div className="flex flex-col w-full h-full p-2 bg-gray-800 text-white">
        <header className="flex items-center justify-between">
          <h6 className="font-bold">Song Server</h6>
          <div
            className={classNames(
              'w-3 rounded-full bg-red-700 aspect-square',
              !serverRunning && 'opacity-0',
              serverRunning && !isConnected && 'flashing',
            )}
          />
        </header>

        <div className="flex text-xs mb-4">
          {editEnabled && !serverRunning ? (
            <>
              <input
                type="text"
                className="rounded p-0 text-center w-0 flex-1 bg-white bg-opacity-20 outline-none"
                value={host}
                onChange={handleHostChange}
              />
              <p>:</p>
              <input
                type="number"
                className="rounded p-0 text-center w-0 flex-1 bg-white bg-opacity-20 outline-none"
                value={port}
                onChange={handlePortChange}
              />
            </>
          ) : (
            <p className="text-white/40">
              {host}:{port}
            </p>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs mb-1 text-white/40">Currently Playing</p>
          <p className="font-bold">{currentSong?.title ?? 'n.a.'}</p>
          <p className="text-xs text-white/80">
            {currentSong?.artist ?? 'n.a.'}{' '}
          </p>
        </div>

        <button
          type="button"
          onClick={handleServerToggle}
          className="text-green-400 font-bold px-4 py-2"
        >
          {serverRunning ? 'Stop' : 'Start'} Server
        </button>
      </div>
    </div>
  );
}

export default SongServer;
