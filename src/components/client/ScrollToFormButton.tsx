'use client';

import { ArrowRight } from 'lucide-react';

interface ScrollToFormButtonProps {
  readonly label?: string;
}

export function ScrollToFormButton({ label = 'Agendar Consulta' }: ScrollToFormButtonProps) {
  const handleClick = () => {
    // Focus the message field in the contact form
    const element = document.getElementById('name') || document.getElementById('message');
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full border border-[rgba(15,15,20,0.18)] text-[rgba(15,15,20,0.75)] px-8 py-4 rounded-full text-sm font-medium tracking-widest uppercase hover:border-[rgba(15,15,20,0.35)] hover:text-[rgba(15,15,20,0.90)] hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-3"
    >
      {label}
      <ArrowRight size={18} />
    </button>
  );
}
