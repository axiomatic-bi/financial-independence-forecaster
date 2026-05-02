import React, { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';

interface NumericInputProps {
  id: string;
  name: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * Numeric input that avoids the controlled type="number" quirk where
 * backspacing to empty immediately snaps back to "0". Uses type="text"
 * with inputMode="decimal" (standard practice for financial inputs).
 *
 * - Select-all on focus so typing overwrites the current value
 * - While editing: any valid numeric string (including empty) is allowed
 * - On blur: empty/invalid → commits 0 and displays "0"
 */
export const NumericInput = ({ id, name, value, step, onChange }: NumericInputProps) => {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusingRef = useRef(false);

  useEffect(() => {
    if (!editing) {
      setDraft(String(value));
    }
  }, [value, editing]);

  const selectAll = () => {
    const el = inputRef.current;
    if (el) el.setSelectionRange(0, el.value.length);
  };

  const handleFocus = () => {
    setEditing(true);
    focusingRef.current = true;
    selectAll();
  };

  const handleMouseUp = (e: MouseEvent<HTMLInputElement>) => {
    if (focusingRef.current) {
      focusingRef.current = false;
      e.preventDefault();
      selectAll();
    }
  };

  const handleBlur = () => {
    setEditing(false);
    focusingRef.current = false;
    const parsed = Number(draft);
    const final = Number.isFinite(parsed) && draft.trim() !== '' ? parsed : 0;
    onChange(final);
    setDraft(String(final));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-' || /^-?\d*\.?\d*$/.test(raw)) {
      setDraft(raw);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
      value={draft}
      onFocus={handleFocus}
      onMouseUp={handleMouseUp}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};
