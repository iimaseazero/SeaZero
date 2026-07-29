'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Flag, Plus } from 'lucide-react';
import { Team, loadTeams, addTeam, deleteTeam } from '@/store/persistence';

const TEAM_COLORS = [
  '#38D9C8', '#4A90CC', '#F59E0B', '#EF4444', '#8B5CF6',
  '#34D399', '#EC4899', '#FB923C', '#06B6D4', '#84CC16',
];

export default function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setTeams(loadTeams());
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const team = addTeam(newName.trim(), selectedColor);
    setTeams((prev) => [...prev, team]);
    setNewName('');
    setShowForm(false);
    // Cycle to next unused color
    const usedColors = new Set(teams.map((t) => t.color));
    const nextColor = TEAM_COLORS.find((c) => !usedColors.has(c)) || TEAM_COLORS[0];
    setSelectedColor(nextColor);
  };

  const handleDelete = (teamId: string) => {
    deleteTeam(teamId);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  return (
    <div>
      {/* Header with add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
            Teams ({teams.length})
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            fontFamily: 'var(--font-display)',
            color: showForm ? 'var(--red)' : 'var(--cyan)',
            background: showForm ? 'var(--red-dim)' : 'rgba(56, 217, 200, 0.08)',
            border: `1px solid ${showForm ? 'rgba(239,68,68,0.2)' : 'rgba(56, 217, 200, 0.15)'}`,
          }}
        >
          {showForm ? (
            <>
              <X size={14} /> Cancel
            </>
          ) : (
            <>
              <Plus size={14} /> Add Team
            </>
          )}
        </button>
      </div>

      {/* Add team form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="rounded-xl px-4 py-4 space-y-3"
              style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)' }}
            >
              <div>
                <label className="text-[11px] uppercase tracking-wider block mb-1.5 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Team Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="e.g., Nordic Titans"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: 'var(--navy-medium)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider block mb-1.5 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Team Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        backgroundColor: color,
                        opacity: selectedColor === color ? 1 : 0.3,
                        border: selectedColor === color ? '2px solid white' : '2px solid transparent',
                        transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: selectedColor === color ? `0 0 12px ${color}44` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: newName.trim() ? 'rgba(56, 217, 200, 0.12)' : 'var(--glass)',
                  color: newName.trim() ? 'var(--cyan)' : 'var(--text-muted)',
                  border: `1px solid ${newName.trim() ? 'rgba(56, 217, 200, 0.2)' : 'var(--card-border)'}`,
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create Team
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team list */}
      <div className="space-y-2">
        {teams.length === 0 && !showForm && (
          <div
            className="text-center py-8 rounded-xl"
            style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-center text-text-muted mb-2">
              <Flag size={28} />
            </div>
            <p className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
              No teams yet. Create one to start competing!
            </p>
          </div>
        )}

        {teams.map((team) => (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{
              background: 'var(--glass-strong)',
              border: '1px solid var(--card-border)',
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor: team.color,
                boxShadow: `0 0 10px ${team.color}33`,
              }}
            />
            <span className="flex-1 text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {team.name}
            </span>
            <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {new Date(team.createdAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleDelete(team.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              style={{
                background: 'transparent',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                e.currentTarget.style.color = 'var(--red)';
                e.currentTarget.style.background = 'var(--red-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--card-border)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
