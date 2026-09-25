import clsx from "clsx";
import { useId, type ReactNode } from "react";

/**
 * A label, one control, an optional hint and an optional error.
 *
 * The control is a render prop rather than a set of `as` variants, because the
 * checkout form needs an input, a native select and a textarea, and each keeps
 * every attribute the platform gives it. The prop hands over the wiring a
 * screen reader needs: the error is read with the field, not as a detached
 * banner somewhere above it.
 */

export const controlClass = clsx(
  "text-ui bg-paper min-h-11 w-full rounded-[2px] border px-3 py-2",
  // A control boundary needs 3:1 against the page (WCAG 1.4.11), which is
  // why this is slate at full strength rather than the softer wash.
  "border-slate hover:border-ink aria-invalid:border-ink aria-invalid:border-2",
);

type ControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: (control: ControlProps) => ReactNode;
};

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ui font-medium">
        {label}
      </label>
      {hint !== undefined && (
        <p id={hintId} className="text-detail text-slate">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error === undefined ? undefined : true,
      })}
      {error !== undefined && (
        // Words carry the error, not a colour: the design has no red, and the
        // border change on the control is the second signal, not the only one.
        <p id={errorId} className="text-detail text-ink font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
