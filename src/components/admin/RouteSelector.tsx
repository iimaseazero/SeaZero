'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, MapPin, ArrowRight, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { SEA_ROUTES, SeaRoute } from '@/data/seaRoutes';
import { useSimStore } from '@/store/useSimStore';

export default function RouteSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { loadRoute, resetToDefaultRoute, routeName, isCustomRoute } = useSimStore();

  const handleSelect = (route: SeaRoute) => {
    loadRoute(route.ports, route.legs, route.name);
    setIsOpen(false);
  };

  const handleResetToHurtigruten = () => {
    resetToDefaultRoute();
    setIsOpen(false);
  };

  // Determine if a built-in route is currently active
  const activeRouteId = SEA_ROUTES.find(
    (r) => r.name === routeName
  )?.id;
  const isHurtigrutenActive = !isCustomRoute && !activeRouteId;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--steel)' }} />
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Pre-Built Routes
        </h2>
      </div>
      <p
        className="text-xs -mt-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
      >
        Select a famous sea route to simulate, or keep the default Hurtigruten corridor
      </p>

      {/* Current route indicator */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'var(--glass)',
          border: '1px solid var(--card-border)',
        }}
      >
        <Ship size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Active Route
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {routeName}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--cyan)',
            background: 'var(--cyan-dim)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          Change
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Route grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              {/* Default Hurtigruten route */}
              <button
                onClick={handleResetToHurtigruten}
                className="w-full text-left rounded-xl p-4 transition-all group"
                style={{
                  background: isHurtigrutenActive ? 'var(--cyan-dim)' : 'var(--glass)',
                  border: `1px solid ${isHurtigrutenActive ? 'rgba(6, 182, 212, 0.25)' : 'var(--card-border)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🇳🇴</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                      >
                        Hurtigruten Coastal Express
                      </span>
                      {isHurtigrutenActive && (
                        <Check size={14} style={{ color: 'var(--cyan)' }} />
                      )}
                    </div>
                    <p className="text-[11px] mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                      Bergen → Kirkenes along the Norwegian coast — the original Sea Zero case study route
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin size={10} /> 34 ports
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        <ArrowRight size={10} /> 2,465 km
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--amber)',
                          background: 'var(--amber-dim)',
                        }}
                      >
                        Norway
                      </span>
                    </div>
                  </div>
                  {isHurtigrutenActive && (
                    <div className="mt-1">
                      <RotateCcw size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>
              </button>

              {/* Separator — Long-haul */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Long-Haul Ocean Routes
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Long-haul route cards */}
              {SEA_ROUTES.filter(r => r.category === 'long-haul').map((route, i) => {
                const isActive = activeRouteId === route.id;
                return (
                  <motion.button
                    key={route.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleSelect(route)}
                    className="w-full text-left rounded-xl p-4 transition-all group"
                    style={{
                      background: isActive ? 'var(--cyan-dim)' : 'var(--glass)',
                      border: `1px solid ${isActive ? 'rgba(6, 182, 212, 0.25)' : 'var(--card-border)'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{route.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-bold"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                          >
                            {route.name}
                          </span>
                          {isActive && (
                            <Check size={14} style={{ color: 'var(--cyan)' }} />
                          )}
                        </div>
                        <p className="text-[11px] mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                          {route.description}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin size={10} /> {route.ports.length} ports
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            <ArrowRight size={10} /> {route.totalDistanceKm.toLocaleString()} km
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--amber)',
                              background: 'var(--amber-dim)',
                            }}
                          >
                            {route.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {/* Separator — Dense short (EV-feasible) */}
              <div className="flex items-center gap-3 py-1 mt-1">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5" style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--green)', animation: 'shimmer 2s ease-in-out infinite' }}
                  />
                  EV-Feasible Short Routes
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Dense short route cards */}
              {SEA_ROUTES.filter(r => r.category === 'dense-short').map((route, i) => {
                const isActive = activeRouteId === route.id;
                const avgLegKm = Math.round(route.totalDistanceKm / route.legs.length);
                return (
                  <motion.button
                    key={route.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleSelect(route)}
                    className="w-full text-left rounded-xl p-4 transition-all group"
                    style={{
                      background: isActive ? 'var(--cyan-dim)' : 'var(--glass)',
                      border: `1px solid ${isActive ? 'rgba(6, 182, 212, 0.25)' : 'var(--card-border)'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{route.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-bold"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                          >
                            {route.name}
                          </span>
                          {isActive && (
                            <Check size={14} style={{ color: 'var(--cyan)' }} />
                          )}
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--green)',
                              background: 'var(--green-dim)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                            }}
                          >
                            EV Ready
                          </span>
                        </div>
                        <p className="text-[11px] mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                          {route.description}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin size={10} /> {route.ports.length} ports
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            <ArrowRight size={10} /> {route.totalDistanceKm.toLocaleString()} km
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--green)' }}>
                            ~{avgLegKm} km/leg avg
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--amber)',
                              background: 'var(--amber-dim)',
                            }}
                          >
                            {route.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
