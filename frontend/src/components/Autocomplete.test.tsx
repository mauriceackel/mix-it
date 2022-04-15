import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Autocomplete from './Autocomplete';

it('renders input', () => {
  render(<Autocomplete />);

  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

it('shows correct value', () => {
  render(<Autocomplete value="Test" />);

  expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
});

it('call change handler', () => {
  const handler = jest.fn();

  render(<Autocomplete value="" onChange={handler} />);

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  expect(handler).toHaveBeenCalledWith('Test');
});

it('displays static suggestion', () => {
  render(<Autocomplete value="" suggestions={['Suggestion']} />);

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  expect(screen.getByText('Suggestion')).toBeInTheDocument();
});

it('displays dynamic suggestion', () => {
  const getSuggestions = () => ['Suggestion'];

  render(<Autocomplete value="" suggestions={getSuggestions} />);

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  expect(screen.getByText('Suggestion')).toBeInTheDocument();
});

it('allows keyboard interaction', () => {
  const handler = jest.fn();

  render(
    <Autocomplete value="" onChange={handler} suggestions={['Suggestion']} />,
  );

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  fireEvent.keyDown(inputField, { key: 'ArrowDown' });
  fireEvent.keyDown(inputField, { key: 'ArrowDown' }); // Check that we don't go out of bounds
  fireEvent.keyDown(inputField, { key: 'Enter' });

  expect(handler).toHaveBeenNthCalledWith(2, 'Suggestion');
});

it('allows mouse interaction', () => {
  const handler = jest.fn();

  render(
    <Autocomplete value="" onChange={handler} suggestions={['Suggestion']} />,
  );

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  const suggestion = screen.getByText('Suggestion');
  fireEvent.click(suggestion);

  expect(handler).toHaveBeenNthCalledWith(2, 'Suggestion');
});

it('hides the suggestions on blur', () => {
  render(<Autocomplete value="" suggestions={['Suggestion']} />);

  const inputField = screen.getByRole('textbox');
  fireEvent.change(inputField, { target: { value: 'Test' } });

  expect(screen.getByText('Suggestion')).toBeInTheDocument();

  fireEvent.blur(inputField);

  expect(screen.queryByText('Suggestion')).toBeNull();
});
