import {
  RenderOptions,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { nextTick } from 'process';
import React, { ContextType, ReactElement } from 'react';

import ConfigContext, {
  defaultContext as defaultConfigContext,
} from 'services/config';
import SongContext, {
  defaultContext as defaultSongContext,
  startSongServer,
  stopSongServer,
} from 'services/songs';

import SongServer from './SongServer';

jest.mock('services/songs');
const mockedStartServer = startSongServer as jest.MockedFunction<
  typeof startSongServer
>;
const mockedStopServer = stopSongServer as jest.MockedFunction<
  typeof stopSongServer
>;

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

const songContextRender = (
  component: ReactElement,
  providerValue: ContextType<typeof SongContext>,
  renderOptions?: RenderOptions,
) => {
  return render(
    <SongContext.Provider value={providerValue}>
      {component}
    </SongContext.Provider>,
    renderOptions,
  );
};

it('renders element', () => {
  render(<SongServer />);

  expect(screen.getByText('Song Server')).toBeInTheDocument();
});

it('handles render without context provider', () => {
  render(<SongServer />);

  expect(
    screen.getByText(
      `${defaultConfigContext.host}:${defaultConfigContext.port}`,
    ),
  ).toBeInTheDocument();
});

it('renders correct host and port', () => {
  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    host: 'testhost',
    port: 1234,
  };

  configContextRender(<SongServer />, configContextValue);

  expect(screen.getByText('testhost:1234')).toBeInTheDocument();
});

it('enables editing host and port', () => {
  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    editEnabled: true,
  };

  configContextRender(<SongServer />, configContextValue);

  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

it('does not allow editing if running', () => {
  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    editEnabled: true,
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const songContextValue: ContextType<typeof SongContext> = {
    ...defaultSongContext,
    serverRunning: true,
  };

  configContextRender(
    <SongContext.Provider value={songContextValue}>
      <SongServer />
    </SongContext.Provider>,
    configContextValue,
  );

  expect(screen.queryByRole('textbox')).toBeNull();
});

it('updates server config', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
    editEnabled: true,
  };

  configContextRender(<SongServer />, configContextValue);

  const hostInputField = screen.getByDisplayValue(defaultConfigContext.host);
  fireEvent.change(hostInputField, { target: { value: 'localhost' } });

  expect(dispatch).toHaveBeenNthCalledWith(1, {
    type: 'SET_HOST',
    host: 'localhost',
  });

  const portInputField = screen.getByDisplayValue(defaultConfigContext.port);
  fireEvent.change(portInputField, { target: { value: 1234 } });
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: 'SET_PORT',
    port: 1234,
  });
});

it('starts server', async () => {
  const dispatch = jest.fn();

  const songContextValue: ContextType<typeof SongContext> = {
    ...defaultSongContext,
    dispatch,
  };

  songContextRender(<SongServer />, songContextValue);

  const mockFunctionCalled = new Promise((resolve) => {
    mockedStartServer.mockImplementation(() => {
      nextTick(resolve);
      return Promise.resolve();
    });
  });

  const toggleButton = screen.getByText('Start Server');
  fireEvent.click(toggleButton);

  expect(mockedStartServer).toBeCalled();

  await mockFunctionCalled;

  expect(dispatch).toBeCalledWith({
    type: 'SET_RUNNING',
    serverRunning: true,
  });
});

it('stops server', async () => {
  const dispatch = jest.fn();

  const songContextValue: ContextType<typeof SongContext> = {
    ...defaultSongContext,
    dispatch,
    serverRunning: true,
  };

  songContextRender(<SongServer />, songContextValue);

  const mockFunctionCalled = new Promise((resolve) => {
    mockedStopServer.mockImplementation(() => {
      nextTick(resolve);
      return Promise.resolve();
    });
  });

  const toggleButton = screen.getByText('Stop Server');
  fireEvent.click(toggleButton);

  expect(mockedStopServer).toBeCalled();

  await mockFunctionCalled;

  expect(dispatch).toBeCalledWith({
    type: 'SET_RUNNING',
    serverRunning: false,
  });
});

it('shows currently playing song', () => {
  const songContextValue: ContextType<typeof SongContext> = {
    ...defaultSongContext,
    currentSong: {
      title: 'Title',
      artist: 'Artist',
    },
  };

  songContextRender(<SongServer />, songContextValue);

  expect(screen.getByText('Title')).toBeInTheDocument();
  expect(screen.getByText('Artist')).toBeInTheDocument();
});
