"use client";

import { useId } from "react";

/**
 * A number input with steppers.
 *
 * The accessible names carry the product, because a page of unlabelled plus
 * buttons is unusable: "Increase quantity" five times over says nothing about
 * which line moved.
 */

type QuantityProps = {
  /** What is being counted, for the accessible names. */
  itemName: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function Quantity({ itemName, value, min, max, onChange }: QuantityProps) {
  const inputId = useId();

  return (
    <div className="border-wash flex items-center rounded-[2px] border">
      <Step
        label={`Decrease quantity of ${itemName}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </Step>

      <label htmlFor={inputId} className="sr-only">
        Quantity of {itemName}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          // A cleared field reads as NaN mid-edit, and a typed 0 would reach the
          // reducer as a delete -- selecting the field and typing "10" would
          // remove the line on the first keystroke. Removing is the Remove
          // button's job; this only ever sets a quantity.
          if (!Number.isNaN(next) && next >= min) onChange(next);
        }}
        className="text-ui min-h-11 w-12 border-0 bg-transparent text-center tabular-nums"
      />

      <Step
        label={`Increase quantity of ${itemName}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </Step>
    </div>
  );
}

function Step({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // A glyph announces as a glyph, so the name is the sentence.
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-ui hover:bg-ink/5 min-h-11 min-w-11 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
