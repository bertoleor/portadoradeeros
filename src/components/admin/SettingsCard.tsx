'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
      className="group flex flex-col p-5 rounded-2xl border border-black/5 bg-white hover:border-black/10 hover:shadow-md hover:shadow-black/5 transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-gray-100 transition-colors">
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
