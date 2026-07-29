'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Settings, Trophy, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Simulator', Icon: Activity },
  { href: '/admin', label: 'Admin', Icon: Settings },
  { href: '/compete', label: 'Compete', Icon: Trophy },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className="relative z-50 px-4 sm:px-6 py-2.5"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
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

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1">
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
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-secondary hover:text-primary transition-colors"
          style={{
            background: mobileMenuOpen ? 'rgba(56, 217, 200, 0.1)' : 'var(--glass-strong)',
            border: '1px solid var(--border)',
            color: mobileMenuOpen ? 'var(--cyan)' : 'var(--text-secondary)',
          }}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden pt-3 pb-2 mt-2 space-y-1.5 border-t border-[var(--border)] animate-in fade-in slide-in-from-top-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider no-underline transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(56, 217, 200, 0.1)' : 'var(--glass-strong)',
                  border: `1px solid ${isActive ? 'rgba(56, 217, 200, 0.2)' : 'var(--card-border)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <item.Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--cyan)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

