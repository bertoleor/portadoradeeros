"use client";

import { useEffect, useRef } from "react";

interface FocusTrapProps {
  readonly isActive: boolean;
  readonly onEscape?: () => void;
  readonly children: React.ReactNode;
  readonly autoFocus?: boolean;
  readonly initialFocusRef?: React.RefObject<HTMLElement | null>;
  readonly returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * FocusTrap - Traps focus within a container when active
 * - Traps Tab/Shift+Tab within the container
 * - Handles Escape key
 * - Restores focus to returnFocusRef when deactivated
 * - Auto-focuses initialFocusRef or first focusable element when activated
 */
export function FocusTrap({
  isActive,
  onEscape,
  children,
  autoFocus = true,
  initialFocusRef,
  returnFocusRef,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // Tab key - trap focus
      if (e.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (e.shiftKey) {
          // Shift+Tab - go to last element if on first
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab - go to first element if on last
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape]);

  // Handle focus management on activation/deactivation
  useEffect(() => {
    if (isActive) {
      // Store current active element for restoration
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Auto-focus after a brief delay to ensure DOM is ready
      if (autoFocus) {
        const timer = setTimeout(() => {
          const container = containerRef.current;
          if (!container) return;

          // Use initialFocusRef if provided, otherwise find first focusable element
          const targetElement =
            initialFocusRef?.current ??
            container.querySelector<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

          targetElement?.focus();
        }, 0);

        return () => clearTimeout(timer);
      }
    } else if (previousActiveElement.current) {
      // Restore focus to the element that had focus before the trap was activated
      // Use returnFocusRef if provided, otherwise use stored element
      const targetElement =
        returnFocusRef?.current ?? previousActiveElement.current;

      const timer = setTimeout(() => {
        targetElement?.focus();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isActive, autoFocus, initialFocusRef, returnFocusRef]);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}