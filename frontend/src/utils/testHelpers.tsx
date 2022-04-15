import { RenderOptions, render } from '@testing-library/react';
import React, { ContextType, ReactElement } from 'react';

import ConfigContext from 'services/config';
import PlaylistContext from 'services/playlists';
import SongContext from 'services/songs';

export function playlistContextRender(
  component: ReactElement,
  providerValue: ContextType<typeof PlaylistContext>,
  renderOptions?: RenderOptions,
) {
  return render(
    <PlaylistContext.Provider value={providerValue}>
      {component}
    </PlaylistContext.Provider>,
    renderOptions,
  );
}

export function configContextRender(
  component: ReactElement,
  providerValue: ContextType<typeof ConfigContext>,
  renderOptions?: RenderOptions,
) {
  return render(
    <ConfigContext.Provider value={providerValue}>
      {component}
    </ConfigContext.Provider>,
    renderOptions,
  );
}

export function songContextRender(
  component: ReactElement,
  providerValue: ContextType<typeof SongContext>,
  renderOptions?: RenderOptions,
) {
  return render(
    <SongContext.Provider value={providerValue}>
      {component}
    </SongContext.Provider>,
    renderOptions,
  );
}
