"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface PartnerOption {
  id: number | string;
  name: string;
  code?: string;
  email?: string;
}

interface PartnerComboboxProps {
  value: string; // holds the id as string
  onChange: (id: string, option: PartnerOption | null) => void;
  options: PartnerOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export function PartnerCombobox({
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  className,
  disabled,
}: PartnerComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the display label from the current value
  const selectedOption = options.find((o) => String(o.id) === String(value));

  // When the combobox opens, pre-fill query with selected name
  const handleFocus = () => {
    setQuery(selectedOption?.name || "");
    setOpen(true);
  };

  const handleBlur = useCallback(() => {
    // Delay close to allow click on option to register
    setTimeout(() => setOpen(false), 150);
  }, []);

  const filtered =
    query.trim() === ""
      ? options.slice(0, 50)
      : options.filter((o) =>
          `${o.name} ${o.code || ""} ${o.email || ""}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );

  const handleSelect = (option: PartnerOption) => {
    onChange(String(option.id), option);
    setQuery(option.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("", null);
    setQuery("");
    inputRef.current?.focus();
  };

  // Sync display if value changes externally
  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.name || "");
    }
  }, [value, selectedOption, open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selectedOption?.name || "")}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "focus-ring h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-[var(--muted)] hover:text-[var(--foreground)] transition text-xs font-bold leading-none"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
        {!value && (
          <span className="pointer-events-none absolute right-2 text-[var(--muted)] text-xs">▾</span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--muted)]">No results found.</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  handleSelect(option);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-muted)] transition flex items-center justify-between gap-2",
                  String(option.id) === String(value) && "bg-[var(--primary-soft)] font-semibold"
                )}
              >
                <span className="text-[var(--foreground)]">{option.name}</span>
                {option.code && (
                  <span className="text-[10px] text-[var(--muted)] font-mono shrink-0">{option.code}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
