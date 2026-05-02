import React, { useState, useRef, useCallback, useEffect, type FocusEvent, type ChangeEvent, type KeyboardEvent } from 'react';

interface NumericInputProps {
  id: string;
  name: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * Controlled numeric input using type="text" with inputMode="decimal".
 *
 * Avoids native type="number" pitfalls (leading zeros, spinners, scroll-to-change).
 * Selects all text on focus so typing immediately overwrites the current value.
 * Commits the parsed number on blur or Enter; reverts to the last valid value
 * if the string is empty or unparseable.
 */
export const NumericInput = ({ id, name, value, step, onChange }: NumericInputProps) => {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const commit = useCallback(() => {
    const trimmed = displayValue.trim();
    if (trimmed === '' || trimmed === '-') {
      setDisplayValue(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
      setDisplayValue(String(parsed));
    } else {
      setDisplayValue(String(value));
    }
  }, [displayValue, value, onChange]);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    requestAnimationFrame(() => event.target.select());
  };

  const handleBlur = () => {
    setIsFocused(false);
    commit();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === '' || raw === '-' || /^-?\d*\.?\d*$/.test(raw)) {
      setDisplayValue(raw);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit();
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode="decimal"
      step={step}
      autoComplete="off"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};
