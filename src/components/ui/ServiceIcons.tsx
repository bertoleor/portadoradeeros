import type { SVGProps } from 'react';

interface ServiceIconProps {
  readonly type: string;
  readonly className?: string;
  readonly size?: number;
}

// Custom hand-crafted SVGs for each service — no containers, pure paths
function TarotIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Playing card outline */}
      <rect x="5" y="2" width="14" height="20" rx="2" />
      {/* Simple star burst in center */}
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
      <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" />
    </svg>
  );
}

function CandleIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Candle body */}
      <rect x="9" y="10" width="6" height="12" rx="1" />
      {/* Wick */}
      <line x1="12" y1="10" x2="12" y2="7" />
      {/* Flame — teardrop shape */}
      <path d="M12 7 C11 5.5 10 4 12 2 C14 4 13 5.5 12 7Z" />
      {/* Drips */}
      <path d="M9 13 Q7.5 14 9 15" />
      <path d="M15 16 Q16.5 17 15 18" />
    </svg>
  );
}

function WaveIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Three stacked waves */}
      <path d="M2 8 C4.5 6 7.5 6 10 8 C12.5 10 15.5 10 18 8 C20.5 6 21.5 6 22 8" />
      <path d="M2 12 C4.5 10 7.5 10 10 12 C12.5 14 15.5 14 18 12 C20.5 10 21.5 10 22 12" />
      <path d="M2 16 C4.5 14 7.5 14 10 16 C12.5 18 15.5 18 18 16 C20.5 14 21.5 14 22 16" />
    </svg>
  );
}

function StarIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Sharp 4-pointed star */}
      <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
    </svg>
  );
}

function MoonIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <circle cx="12" cy="12" r="1.5" stroke="none" fill="currentColor" />
    </svg>
  );
}

function SunIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41 1.41" />
    </svg>
  );
}

function LotusIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s-8-4.5-8-12c0 0 3 0 8 5s8-5 8-5c0 7.5-8 12-8 12Z" />
      <path d="M12 22s-4-6-4-10c0-3 2-5 4-5s4 2 4 5c0 4-4 10-4 10Z" />
      <path d="M12 11c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2Z" />
    </svg>
  );
}

function CrystalIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L5 8v8l7 6 7-6V8l-7-6Z" />
      <path d="M12 2v20M5 8l14 8M19 8L5 16" />
    </svg>
  );
}

function EyeIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 12h.01" />
    </svg>
  );
}

function SmokeIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 22c0-3 2-4 2-7s-2-4-2-7 2-4 2-7" />
      <path d="M15 22c0-3-2-4-2-7s2-4-2-7 2-4 2-7" />
    </svg>
  );
}

export const SERVICES_ICONS_GALLERY = {
  tarot: { component: TarotIcon, label: 'Tarot' },
  velas: { component: CandleIcon, label: 'Velas' },
  buzios: { component: WaveIcon, label: 'Búzios' },
  energy: { component: StarIcon, label: 'Energía' },
  moon: { component: MoonIcon, label: 'Luna' },
  sun: { component: SunIcon, label: 'Sol' },
  lotus: { component: LotusIcon, label: 'Loto' },
  crystal: { component: CrystalIcon, label: 'Cristal' },
  eye: { component: EyeIcon, label: 'Protección' },
  smoke: { component: SmokeIcon, label: 'Sahumerio' },
};

export function ServiceIcon({ type, className = '', size = 24 }: ServiceIconProps) {
  const svgProps = { width: size, height: size, className };
  const iconEntry = SERVICES_ICONS_GALLERY[type as keyof typeof SERVICES_ICONS_GALLERY];

  if (iconEntry) {
    const IconComponent = iconEntry.component;
    return <IconComponent {...svgProps} />;
  }

  // Fallbacks for legacy/variations
  switch (type) {
    case 'velomancia':
    case 'candle':
      return <CandleIcon {...svgProps} />;
    case 'sparkles':
    default:
      return <StarIcon {...svgProps} />;
  }
}

// ── Social Icons ─────────────────────────────────────────────────────────────

interface SocialIconProps {
  readonly platform: string;
  readonly className?: string;
  readonly size?: number;
}

export function SocialIcon({ platform, className = '', size = 24 }: Readonly<SocialIconProps>) {
  const base = {
    width: size,
    height: size,
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: '1.5',
  };

  switch (platform) {
    case 'instagram':
      return (
        <svg {...base}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...base}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...base}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...base} fill="currentColor" stroke="none">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}
