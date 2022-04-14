import { render, screen } from '@testing-library/react';
import React from 'react';

import Checkbox from './Checkbox';

it('renders input', () => {
  render(<Checkbox />);

  expect(screen.getByRole('checkbox')).toBeInTheDocument();
});

it('is checked', () => {
  render(<Checkbox checked />);

  expect(screen.getByRole('checkbox')).toBeChecked();
});

it('is not checked', () => {
  render(<Checkbox checked={false} />);

  expect(screen.getByRole('checkbox')).not.toBeChecked();
});

it('is disabled', () => {
  render(<Checkbox disabled />);

  expect(screen.getByRole('checkbox')).toBeDisabled();
});

it('renders child', () => {
  render(
    <Checkbox>
      <p>Test</p>
    </Checkbox>,
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
});

it('executes callback', () => {
  const changeHandler = jest.fn();
  render(<Checkbox onChange={changeHandler} />);

  screen.getByRole('checkbox').click();

  expect(changeHandler).toBeCalled();
});
