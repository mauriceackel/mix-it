/* eslint-disable react/require-default-props */
import React, { PropsWithChildren, ReactElement, useState } from 'react';
import { v4 as uuid } from 'uuid';

interface CheckboxProps {
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
}
function Checkbox(props: PropsWithChildren<CheckboxProps>): ReactElement {
  const { disabled = false, checked, onChange, children } = props;

  const [id] = useState<string>(uuid());

  return (
    <label
      className={`flex items-center ${disabled && 'opacity-30'}`}
      htmlFor={id}
    >
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 border rounded border-pink-600 mr-2">
        <input
          id={id}
          disabled={disabled}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="absolute opacity-0"
        />
        <div
          className={`w-2/3 h-2/3 bg-pink-600 rounded-sm ${
            !checked && 'opacity-0'
          }`}
        />
      </div>

      {children}
    </label>
  );
}

export default Checkbox;
