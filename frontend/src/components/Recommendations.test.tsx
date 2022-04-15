import {
  RenderOptions,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React, { ContextType, ReactElement } from 'react';

import ConfigContext, {
  defaultContext as defaultConfigContext,
} from 'services/config';
import PlaylistContext, {
  defaultContext as defaultPlaylistContext,
} from 'services/playlists';
import SongContext, {
  defaultContext as defaultSongContext,
} from 'services/songs';

import Playlist from 'models/Playlist';

import Recommendations from './Recommendations';

const playlistContextRender = (
  component: ReactElement,
  providerValue: ContextType<typeof PlaylistContext>,
  renderOptions?: RenderOptions,
) => {
  return render(
    <PlaylistContext.Provider value={providerValue}>
      {component}
    </PlaylistContext.Provider>,
    renderOptions,
  );
};

const configContextRender = (
  component: ReactElement,
  providerValue: ContextType<typeof ConfigContext>,
  renderOptions?: RenderOptions,
) => {
  return render(
    <ConfigContext.Provider value={providerValue}>
      {component}
    </ConfigContext.Provider>,
    renderOptions,
  );
};

it('renders element', () => {
  const { container } = render(<Recommendations />);

  expect(container.querySelector('div > div > header')).toBeInTheDocument();
});

it('handles render without context provider', () => {
  render(<Recommendations />);

  expect(screen.getAllByTestId('trackRow').length).toBeGreaterThan(0);
});

it('can enable auto refresh', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
    autoUpdate: false,
  };

  configContextRender(<Recommendations />, configContextValue);

  screen.getByText('Auto').click();

  expect(dispatch).toBeCalledWith({
    type: 'SET_AUTO_UPDATE',
    autoUpdate: true,
  });
});

it('can disable auto refresh', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
    autoUpdate: true,
  };

  configContextRender(<Recommendations />, configContextValue);

  screen.getByText('Auto').click();

  expect(dispatch).toBeCalledWith({
    type: 'SET_AUTO_UPDATE',
    autoUpdate: false,
  });
});

it('automatically sets current song if enabled', () => {
  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    autoUpdate: true,
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const songContextValue: ContextType<typeof SongContext> = {
    ...defaultSongContext,
    serverRunning: true,
    currentSong: {
      artist: 'Artist',
      title: 'Title',
    },
  };

  configContextRender(
    <SongContext.Provider value={songContextValue}>
      <Recommendations />
    </SongContext.Provider>,
    configContextValue,
  );

  expect(screen.getByTestId('searchInput')).toHaveValue('Title Artist');
});

it('renders correct amount of rows', () => {
  const trackCount = 4;

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    trackCount,
  };

  configContextRender(<Recommendations />, configContextValue);

  expect(screen.getAllByTestId('trackRow')).toHaveLength(trackCount * 2 + 1);
});

it('prevents illegal track count', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
  };

  configContextRender(<Recommendations />, configContextValue);

  const inputField = screen.getByTestId('trackCountInput');
  fireEvent.change(inputField, { target: { value: -1 } });
  fireEvent.change(inputField, { target: { value: 0 } });
  fireEvent.change(inputField, { target: { value: '-' } });
  fireEvent.change(inputField, { target: { value: 'a' } });

  expect(dispatch).toHaveBeenCalledWith({
    type: 'SET_TRACK_COUNT',
    trackCount: 1,
  });
});

it('shows searched track in results', () => {
  const playlist: Playlist = {
    id: 'foobar',
    name: 'Test',
    tracks: [{ title: 'Title', artist: 'Artist' }],
  };

  const playlistContextValue: ContextType<typeof PlaylistContext> = {
    ...defaultPlaylistContext,
    selectedPlaylists: [playlist],
    playlists: [playlist],
  };

  playlistContextRender(<Recommendations />, playlistContextValue);

  const inputField = screen.getByTestId('searchInput');

  fireEvent.change(inputField, { target: { value: 'Title' } });
  expect(screen.getByText('Title - Artist')).toBeInTheDocument();

  fireEvent.change(inputField, { target: { value: 'Artist' } });
  expect(screen.getByText('Title - Artist')).toBeInTheDocument();

  fireEvent.change(inputField, { target: { value: 'Title Artist' } });
  expect(screen.getByText('Title - Artist')).toBeInTheDocument();

  fireEvent.change(inputField, { target: { value: 'Artist Title' } });
  expect(screen.getByText('Title - Artist')).toBeInTheDocument();

  fireEvent.change(inputField, { target: { value: 'Foobar' } });
  expect(screen.queryByText('Title - Artist')).toBeNull();
});

it('shows successors/predecessors of track in results', () => {
  const playlist: Playlist = {
    id: 'foobar',
    name: 'Test',
    tracks: [
      { title: 'Predecessor', artist: 'Artist' },
      { title: 'Current', artist: 'Artist' },
      { title: 'Successor', artist: 'Artist' },
    ],
  };

  const playlistContextValue: ContextType<typeof PlaylistContext> = {
    ...defaultPlaylistContext,
    selectedPlaylists: [playlist],
    playlists: [playlist],
  };

  playlistContextRender(<Recommendations />, playlistContextValue);

  const inputField = screen.getByTestId('searchInput');

  fireEvent.change(inputField, { target: { value: 'Current Artist' } });
  expect(screen.getAllByText('Predecessor - Artist').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Current - Artist').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Successor - Artist').length).toBeGreaterThan(0);
});
