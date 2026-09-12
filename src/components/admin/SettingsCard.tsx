'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SettingsCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly href: string;
}

export function SettingsCard({ title, description, icon: Icon, href }: SettingsCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-5 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm hover:border-white/70 hover:shadow-md hover:shadow-black/5 transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:bg-white/70 transition-colors">
        <Icon size={20} className="text-black/70" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-base font-medium text-gray-900 group-hover:text-black">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 mt-1">
        {description}
      </p>
      
      <div className="mt-auto pt-3 flex items-center justify-end">
        <ArrowRight 
          size={16} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200" 
          strokeWidth={1.5}
        />
      </div>
    </Link>
  );
}
