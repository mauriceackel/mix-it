import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/outline';
import { ELECTRON_ENABLED } from 'config';
import React, { ReactElement, useContext } from 'react';

import ConfigContext from 'services/config';

import Playlists from 'components/Playlists';
import Recommendations from 'components/Recommendations';
import SongServer from 'components/SongServer';

function Main(): ReactElement {
  const { editEnabled, dispatch } = useContext(ConfigContext);

  return (
    <div className="flex flex-col w-full min-h-screen h-screen max-h-screen">
      <header className="flex items-center justify-between p-2 bg-gray-800 text-pink-600">
        <h1 className="text-2xl font-bold select-none">MixIt</h1>

        {React.createElement(editEnabled ? LockOpenIcon : LockClosedIcon, {
          className: 'h-6',
          onClick: () =>
            dispatch({ type: 'SET_EDIT_ENABLED', enabled: !editEnabled }),
        })}
      </header>

      <section className="flex flex-grow overflow-hidden">
        <section className="flex flex-col flex-grow overflow-hidden max-w-2xs">
          <Playlists className="flex flex-grow overflow-hidden" />

          {ELECTRON_ENABLED && <SongServer />}
        </section>

        <Recommendations className="flex flex-grow overflow-hidden" />
      </section>
    </div>
  );
}

export default Main;
