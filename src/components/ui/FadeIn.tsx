'use client';

import { motion } from 'framer-motion';

import type { ReactNode } from 'react';

interface FadeInProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  readonly distance?: number;
  readonly duration?: number;
  readonly className?: string;
  readonly viewMargin?: string;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  distance = 20,
  duration = 0.6,
  className = '',
  viewMargin = '-40px',
}: FadeInProps) {
  const directionOffset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const initialOffset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: viewMargin }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
