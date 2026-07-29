'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { Team } from '@/store/persistence';
import { useTeams } from '@/store/useLocalCollections';

interface TeamSelectorProps {
  selectedTeam: Team | null;
  onSelect: (team: Team | null) => void;
}

export default function TeamSelector({ selectedTeam, onSelect }: TeamSelectorProps) {
  const teams = useTeams();
  const [isOpen, setIsOpen] = useState(false);

  if (teams.length === 0) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'var(--amber-dim)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
        }}
      >
        <AlertTriangle size={20} className="text-amber-500" />
        <div>
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
            No Teams Available
          </p>
          <p className="text-xs" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Go to the Admin page to create teams first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="text-[11px] uppercase tracking-wider block mb-2 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        Select Your Team
      </label>

      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          background: selectedTeam ? 'var(--glass-strong)' : 'var(--glass)',
          border: `1px solid ${selectedTeam ? `${selectedTeam.color}33` : 'var(--card-border)'}`,
        }}
      >
        {selectedTeam ? (
          <>
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedTeam.color, boxShadow: `0 0 8px ${selectedTeam.color}44` }}
            />
            <span className="flex-1 text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {selectedTeam.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Choose a team...
          </span>
        )}
        <div
          className="text-xs transition-transform flex items-center justify-center"
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          }}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(14, 26, 43, 0.95)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}
        >
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                onSelect(team);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-[rgba(255,255,255,0.03)]"
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: selectedTeam?.id === team.id ? 'rgba(56, 217, 200, 0.04)' : 'transparent',
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: team.color }}
              />
              <span className="flex-1 text-sm font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {team.name}
              </span>
              {selectedTeam?.id === team.id && (
                <Check size={14} className="text-cyan-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
