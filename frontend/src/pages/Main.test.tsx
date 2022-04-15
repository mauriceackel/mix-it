import { fireEvent, render, screen } from '@testing-library/react';
import React, { ContextType } from 'react';

import ConfigContext, {
  defaultContext as defaultConfigContext,
} from 'services/config';

import { configContextRender } from 'utils/testHelpers';

import Main from './Main';

it('renders the components', () => {
  render(<Main />);

  expect(screen.getByText('MixIt')).toBeInTheDocument();
});

it('can enable edit', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
    editEnabled: false,
  };

  const { container } = configContextRender(<Main />, configContextValue);

  const button = container.querySelector('div > header > button');
  expect(button).not.toBeNull();

  if (!button) return;

  fireEvent.click(button);

  expect(dispatch).toBeCalledWith({
    type: 'SET_EDIT_ENABLED',
    enabled: true,
  });
});

it('can disable auto refresh', () => {
  const dispatch = jest.fn();

  const configContextValue: ContextType<typeof ConfigContext> = {
    ...defaultConfigContext,
    dispatch,
    editEnabled: true,
  };

  const { container } = configContextRender(<Main />, configContextValue);

  const button = container.querySelector('div > header > button');
  expect(button).not.toBeNull();

  if (!button) return;

  fireEvent.click(button);

  expect(dispatch).toBeCalledWith({
    type: 'SET_EDIT_ENABLED',
    enabled: false,
  });
});
