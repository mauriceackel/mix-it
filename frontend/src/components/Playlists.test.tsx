import { RenderOptions, render, screen } from '@testing-library/react';
import React, { ContextType, ReactElement } from 'react';

import ConfigContext, {
  defaultContext as defaultConfigContext,
} from 'services/config';
import PlaylistContext, {
  defaultContext as defaultPlaylistContext,
} from 'services/playlists';

import Playlist from 'models/Playlist';

import Playlists, { PlaylistEntry } from './Playlists';

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
  render(<Playlists />);

  expect(screen.getByText('Playlists')).toBeInTheDocument();
});

it('handles render without context provider', () => {
  render(<Playlists />);

  expect(screen.queryByTestId('playlistEntry')).toBeNull();
});

it('renders playlists', () => {
  const playlistContextValue: ContextType<typeof PlaylistContext> = {
    ...defaultPlaylistContext,
    playlists: [{ id: 'foobar', name: 'Test', tracks: [] }],
  };

  playlistContextRender(<Playlists />, playlistContextValue);

  expect(screen.getByText('Test')).toBeInTheDocument();
});

it('does not mark non-selected playlists', () => {
  const playlist: Playlist = { id: 'foobar', name: 'Test', tracks: [] };

  const playlistContextValue: ContextType<typeof PlaylistContext> = {
    ...defaultPlaylistContext,
    playlists: [playlist],
  };

  playlistContextRender(
    <PlaylistEntry playlist={playlist} />,
    playlistContextValue,
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).not.toBeChecked();
});

it('marks selected playlists', () => {
  const playlist: Playlist = { id: 'foobar', name: 'Test', tracks: [] };

  const playlistContextValue: ContextType<typeof PlaylistContext> = {
    ...defaultPlaylistContext,
    selectedPlaylists: [playlist],
    playlists: [playlist],
  };

  playlistContextRender(
    <PlaylistEntry playlist={playlist} />,
    playlistContextValue,
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).toBeChecked();
});

it('does not show delete option', () => {
  const playlist: Playlist = { id: 'foobar', name: 'Test', tracks: [] };

  const playlistContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    editEnabled: false,
  };

  const { container } = configContextRender(
    <PlaylistEntry playlist={playlist} />,
    playlistContextValue,
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(container.querySelector('svg')).not.toBeInTheDocument();
});

it('shows delete option', () => {
  const playlist: Playlist = { id: 'foobar', name: 'Test', tracks: [] };

  const playlistContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    editEnabled: true,
  };

  const { container } = configContextRender(
    <PlaylistEntry playlist={playlist} />,
    playlistContextValue,
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(container.querySelector('svg')).toBeInTheDocument();
});
