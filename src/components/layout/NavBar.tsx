'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Settings, Trophy, Menu, X, LogOut, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSimStore } from '@/store/useSimStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { logout } from '@/app/actions/auth';

const ALL_NAV_ITEMS = [
  { href: '/', label: 'Simulator', Icon: Activity, adminOnly: false },
  { href: '/admin', label: 'Admin', Icon: Settings, adminOnly: true },
  { href: '/compete', label: 'Compete', Icon: Trophy, adminOnly: false },
];

function IssuesBadge() {
  const { simResult } = useSimStore();
  const issues = simResult.deadZoneCount + simResult.gridThrottledPortCount;
  if (issues === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
      style={{
        background: 'var(--red-dim)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: 'var(--red)', animation: 'shimmer 2s ease-in-out infinite' }}
      />
      <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
        {issues} issue{issues === 1 ? '' : 's'}
      </span>
    </motion.div>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { routeName, simResult } = useSimStore();
  const { user, isAdmin } = useAuth();
  const totalDistance = Math.round(simResult.totalDistanceKm);
  const isRoundtrip = simResult.voyageMode === 'roundtrip';

  // Filter nav items: hide Admin link for non-admin users
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

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
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo & Subtitle */}
        <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--cyan)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 12H3L8 2Z" fill="white" opacity="0.9" />
              <path d="M4 13H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <div>
            <span
              className="text-sm font-bold tracking-wide uppercase block leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.08em' }}
            >
              Sea Zero
            </span>
            <span className="text-[10px] font-medium hidden sm:block" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
              Coastal Route Electrification Simulator
            </span>
          </div>
        </Link>

        {/* Center: Route metadata & Issues pill */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] font-medium tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              {routeName}{isRoundtrip ? ' \u21c4' : ''}
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {totalDistance.toLocaleString()} km
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {simResult.portCallCount} calls
            </span>
          </div>
          <IssuesBadge />
        </div>

        {/* Right: Nav Links + Logout */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {navItems.map((item) => {
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

          {/* Separator + User Email + Logout */}
          {user && (
            <>
              <span
                className="w-px h-5 mx-1"
                style={{ background: 'var(--border)' }}
              />
              <span
                className="text-[11px] font-medium truncate max-w-[160px]"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-muted)',
                }}
                title={user.email ?? ''}
              >
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--red)';
                    e.currentTarget.style.background = 'var(--red-dim)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </form>
            </>
          )}
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
          className="md:hidden pt-3 pb-2 mt-2 space-y-2 border-t border-[var(--border)] animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px]" style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{routeName}{isRoundtrip ? ' \u21c4' : ''}</span>
              <span>·</span>
              <span style={{ color: 'var(--text-muted)' }}>{totalDistance.toLocaleString()} km</span>
              <span>·</span>
              <span style={{ color: 'var(--text-muted)' }}>{simResult.portCallCount} calls</span>
            </div>
            <IssuesBadge />
          </div>

          {navItems.map((item) => {
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

          {/* Mobile User Email + Logout */}
          {user && (
            <>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium truncate"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-muted)',
                background: 'var(--glass-strong)',
                border: '1px solid var(--card-border)',
              }}
            >
              <Mail size={14} style={{ flexShrink: 0 }} />
              <span className="truncate">{user.email}</span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--red)',
                  background: 'var(--red-dim)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </button>
            </form>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
