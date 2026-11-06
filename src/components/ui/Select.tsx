"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly label?: string;
  readonly id?: string;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  label,
  id,
  className = "",
  "aria-label": ariaLabel,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus management when opening
  useEffect(() => {
    if (isOpen) {
      // Set active index to selected option or first option
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      // Focus the trigger button when opened
      triggerRef.current?.focus();
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const lastIndex = options.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < lastIndex ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : lastIndex));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          onChange(options[activeIndex].value);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const listboxId = `${id || "select"}-listbox`;
  const triggerId = `${id || "select"}-trigger`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 mb-2"
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || placeholder}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border border-black/10 rounded-2xl text-left text-sm transition-all duration-200 hover:border-black/20 hover:bg-gray-50/50 focus:outline-none focus:border-black/30 focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 ${selectedOption ? "text-black" : "text-black/40"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-black/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            id={listboxId}
            aria-label={ariaLabel || placeholder}
            className="absolute z-50 w-full mt-2 py-1 bg-white border border-black/10 rounded-2xl shadow-lg shadow-black/10 without-ring"
          >
            {options.map((option, index) => (
              <button
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                key={option.value}
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50 focus:outline-none focus:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 ${option.value === value ? "font-medium bg-gray-50" : ""} without-ring`}
                tabIndex={-1}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={14} className="text-black" aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}