'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Activity, Settings, Trophy } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Simulator', Icon: Activity },
  { href: '/admin', label: 'Admin', Icon: Settings },
  { href: '/compete', label: 'Compete', Icon: Trophy },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 px-6 py-2"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-6 no-underline">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: 'var(--cyan)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L13 12H3L8 2Z" fill="white" opacity="0.9" />
            <path d="M4 13H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
        <span
          className="text-sm font-bold tracking-wide uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Sea Zero
        </span>
      </Link>

      {/* Nav links */}
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider no-underline transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(56, 217, 200, 0.08)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(56, 217, 200, 0.15)' : 'transparent'}`,
            }}
          >
            <item.Icon size={14} className="mb-0.5" />
            {item.label}
            {isActive && (
              <div
                className="w-1.5 h-1.5 rounded-full ml-0.5"
                style={{ backgroundColor: 'var(--cyan)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
