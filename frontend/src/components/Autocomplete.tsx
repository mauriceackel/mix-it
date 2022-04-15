import classNames from 'classnames';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

interface AutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: string[] | ((value: string) => string[]);
}
function Autocomplete(props: AutocompleteProps): ReactElement {
  const { value = '', onChange = () => {}, suggestions = [] } = props;

  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState<number>(-1);

  const resolvedSuggestions = useMemo(() => {
    if (Array.isArray(suggestions)) {
      return suggestions;
    }

    return suggestions(value);
  }, [suggestions, value]);

  const handleSuggestionSelection = useCallback(
    (suggestionIndex: number) => {
      const selectedSuggestion = resolvedSuggestions[suggestionIndex];
      if (selectedSuggestion) {
        onChange(selectedSuggestion);
      }

      setShowSuggestions(false);
    },
    [resolvedSuggestions, onChange],
  );

  const handleSearchTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value);
      setShowSuggestions(true);
    },
    [onChange],
  );

  const handleSearchBoxBlur = useCallback(() => {
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleSearchBoxKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Down':
        case 'ArrowDown':
          setSelectedSuggestionIndex((curr) =>
            Math.min(resolvedSuggestions.length - 1, curr + 1),
          );
          break;
        case 'Up':
        case 'ArrowUp':
          setSelectedSuggestionIndex((curr) => Math.max(-1, curr - 1));
          break;
        case 'Enter': {
          handleSuggestionSelection(selectedSuggestionIndex);
          break;
        }
        default:
          break;
      }
    },
    [resolvedSuggestions, selectedSuggestionIndex, handleSuggestionSelection],
  );

  return (
    <div className="mr-4 flex-grow relative">
      <input
        type="text"
        className="min-w-0 w-full p-2 rounded bg-gray-800 outline-pink-600"
        placeholder="Title or Artist"
        value={value}
        onChange={handleSearchTextChange}
        onKeyDown={handleSearchBoxKeyDown}
        onBlur={handleSearchBoxBlur}
        data-testid="searchInput"
      />

      {showSuggestions && resolvedSuggestions.length > 0 && (
        <div className="top-full mt-1 w-full bg-gray-700 rounded overflow-hidden shadow-xl absolute z-10">
          {resolvedSuggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              type="button"
              tabIndex={-1}
              className={classNames(
                'text-left p-2 w-full bg-white bg-opacity-0',
                i === selectedSuggestionIndex && 'bg-opacity-10',
              )}
              onClick={() => handleSuggestionSelection(i)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
