"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { controlClass } from "@/components/ui/Field";

/**
 * A text field that filters a fixed list as you type: the WAI-ARIA editable
 * combobox with list autocomplete.
 *
 * The input is the combobox, rather than a button opening a separate search
 * box, so there is one control to reach, label and type into. The chosen value
 * travels in a hidden input under `name`; the visible text never does, so a
 * half-typed or misspelled entry cannot be submitted as the value.
 *
 * It takes part in native form validation like any other field: `required`
 * covers an empty field, and text that is not one of the options sets
 * `invalidMessage` as the input's custom validity, so the browser stops the
 * submit and says why.
 */
type ComboboxProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  name: string;
  options: readonly string[];
  placeholder: string;
  invalidMessage: string;
  required?: boolean;
};

export function Combobox({
  name,
  options,
  placeholder,
  invalidMessage,
  required = false,
  ...control
}: ComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = filterOptions(options, query);
  const optionId = (index: number) => `${listId}-${index}`;

  useEffect(() => {
    inputRef.current?.setCustomValidity(text !== "" && selected === null ? invalidMessage : "");
  }, [text, selected, invalidMessage]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  function show() {
    // Opening shows the whole list, with the current choice highlighted, so
    // a customer correcting a choice can see what else there is.
    setQuery("");
    setActive(Math.max(0, selected === null ? 0 : options.indexOf(selected)));
    setOpen(true);
  }

  function choose(option: string) {
    setSelected(option);
    setText(option);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) show();
        else setActive((index) => Math.min(index + 1, matches.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) setActive((index) => Math.max(index - 1, 0));
        break;
      case "Enter": {
        const option = matches[active];
        // Only while the list is open: otherwise Enter submits the form, as
        // it does from every other field.
        if (open && option !== undefined) {
          event.preventDefault();
          choose(option);
        }
        break;
      }
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  }

  function handleBlur() {
    setOpen(false);
    // Typing a district out in full, in any case, counts as choosing it.
    if (selected === null) {
      const exact = options.find((option) => option.toLowerCase() === text.trim().toLowerCase());
      if (exact !== undefined) choose(exact);
    }
  }

  return (
    <div className="relative">
      <input
        {...control}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches.length > 0 ? optionId(active) : undefined}
        autoComplete="off"
        spellCheck={false}
        required={required}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setQuery(event.target.value);
          setSelected(null);
          setActive(0);
          setOpen(true);
        }}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={clsx(controlClass, "pr-10")}
      />
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className={clsx(
          "text-slate pointer-events-none absolute top-1/2 right-3.5 size-3 -translate-y-1/2 transition-transform duration-300",
          open && "rotate-180",
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
      </svg>
      <input type="hidden" name={name} value={selected ?? ""} />

      {/* Always rendered, so aria-controls always points at something. */}
      <ul
        id={listId}
        role="listbox"
        aria-label={placeholder}
        hidden={!open || matches.length === 0}
        className="grain bg-paper border-line scroll-quiet animate-fade-in absolute inset-x-0 top-full z-20 mt-1 max-h-64 border py-1 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)]"
      >
        {matches.map((option, index) => (
          <li
            key={option}
            id={optionId(index)}
            role="option"
            aria-selected={option === selected}
            // Keeps focus in the input, so the blur does not close the list
            // before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(option)}
            onMouseMove={() => setActive(index)}
            className={clsx(
              "text-ui flex cursor-pointer items-center justify-between gap-3 px-3 py-2",
              index === active && "bg-wash/60",
            )}
          >
            {option}
            {option === selected && (
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 8.5 3.2 3L13 4.5" />
              </svg>
            )}
          </li>
        ))}
      </ul>
      {open && matches.length === 0 && (
        <p
          role="status"
          className="grain bg-paper border-line text-detail text-slate absolute inset-x-0 top-full z-20 mt-1 border px-3 py-3"
        >
          Nothing matches “{query}”.
        </p>
      )}
    </div>
  );
}

/**
 * Case-insensitive containment, with names that start with the query first: a
 * customer typing "ka" is after Kathmandu or Kaski before Salyan.
 */
export function filterOptions(options: readonly string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...options];

  const starts: string[] = [];
  const contains: string[] = [];
  for (const option of options) {
    const lowered = option.toLowerCase();
    if (lowered.startsWith(needle)) starts.push(option);
    else if (lowered.includes(needle)) contains.push(option);
  }
  return [...starts, ...contains];
}
