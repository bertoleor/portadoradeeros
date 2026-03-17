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
      className="w-full bg-[rgba(15,15,20,0.78)] text-white px-8 py-4 rounded-full text-sm font-medium tracking-widest uppercase hover:bg-[rgba(15,15,20,0.92)] transition-all duration-200 hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-3"
    >
      {label}
      <ArrowRight size={18} />
    </button>
  );
}
