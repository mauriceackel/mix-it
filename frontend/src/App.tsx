import React, { ReactElement } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ConfigContextProvider } from 'services/config';
import { PlaylistContextProvider } from 'services/playlists';
import { SongContextProvider } from 'services/songs';

import Main from 'pages/Main';

import 'styles/global.css';
import 'styles/tailwind.css';

function App(): ReactElement | null {
  return (
    <ConfigContextProvider>
      <PlaylistContextProvider>
        <SongContextProvider>
          <HashRouter>
            <Router />
          </HashRouter>
        </SongContextProvider>
      </PlaylistContextProvider>
    </ConfigContextProvider>
  );
}

function Router(): ReactElement {
  return (
    <Routes>
      <Route path="/main" element={<Main />} />

      <Route index element={<Navigate to="/main" />} />
    </Routes>
  );
}

export default App;
