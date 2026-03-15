'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { readonly children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // smooth iOS-style curve
      className="flex-1 flex flex-col w-full h-full"
    >
      {children}
    </motion.div>
  );
}
