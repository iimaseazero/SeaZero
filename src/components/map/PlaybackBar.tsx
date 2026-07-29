'use client';

import { useSimStore } from '@/store/useSimStore';
import { RotateCcw } from 'lucide-react';

const SPEED_OPTIONS = [1, 2, 4, 8];

export default function PlaybackBar() {
  const { playback, setPlaybackState, setPlaying, setPlaybackSpeed, simResult, activePorts, activeLegs } = useSimStore();

  const totalLegs = activeLegs.length;
  const overallProgress = (playback.currentLegIndex + playback.legProgress) / totalLegs;

  // Compute voyage clock
  const getVoyageClock = () => {
    let totalHours = 0;
    for (let i = 0; i < playback.currentLegIndex; i++) {
      const leg = simResult.legs[i];
      if (leg) {
        totalHours += leg.sailTimeHours;
        totalHours += leg.dwellMinutes / 60;
      }
    }
    if (playback.currentLegIndex < simResult.legs.length) {
      totalHours += simResult.legs[playback.currentLegIndex].sailTimeHours * playback.legProgress;
    }
    const days = Math.floor(totalHours / 24) + 1;
    const hoursInDay = totalHours % 24;
    const hours = Math.floor(hoursInDay);
    const minutes = Math.floor((hoursInDay - hours) * 60);
    return `Day ${days} · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const currentLegName = playback.currentLegIndex < activeLegs.length
    ? `${activePorts[activeLegs[playback.currentLegIndex].fromPortId].name} → ${activePorts[activeLegs[playback.currentLegIndex].toPortId].name}`
    : 'Voyage Complete';

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const legFloat = pct * totalLegs;
    const legIndex = Math.min(Math.floor(legFloat), totalLegs - 1);
    const progress = legFloat - legIndex;
    const graphProgress = pct;
    setPlaybackState({ currentLegIndex: legIndex, legProgress: progress, graphProgress });
  };

  const handlePlayPause = () => {
    if (playback.isPlaying) {
      // Pause
      setPlaying(false);
    } else {
      // Play or restart
      const isAtEnd = playback.currentLegIndex >= activeLegs.length - 1 && playback.legProgress >= 1;
      if (isAtEnd) {
        // Restart from beginning
        setPlaybackState({
          currentLegIndex: 0,
          legProgress: 0,
          graphProgress: 0,
          hasPlayedOnce: true,
          isPlaying: true,
        });
      } else {
        // Start / resume
        setPlaybackState({
          hasPlayedOnce: true,
          isPlaying: true,
          graphProgress: playback.graphProgress || 0,
        });
      }
    }
  };

  const handleRestart = () => {
    setPlaybackState({
      currentLegIndex: 0,
      legProgress: 0,
      graphProgress: 0,
      isPlaying: false,
      hasPlayedOnce: false,
    });
  };

  return (
    <div className="mt-3 rounded-xl px-4 py-3" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Controls row */}
      <div className="flex items-center gap-2 mb-2.5">
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: playback.isPlaying ? 'rgba(56, 217, 200, 0.12)' : 'var(--glass-strong)',
            border: `1px solid ${playback.isPlaying ? 'rgba(56, 217, 200, 0.25)' : 'var(--card-border)'}`,
            color: playback.isPlaying ? 'var(--cyan)' : 'var(--text-secondary)',
            fontSize: 13,
          }}
          title={playback.isPlaying ? 'Pause' : 'Play'}
        >
          {playback.isPlaying ? '⏸' : '▶'}
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: 'var(--glass-strong)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-muted)',
          }}
          title="Restart"
        >
          <RotateCcw size={13} />
        </button>

        {/* Speed selector */}
        <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
          {SPEED_OPTIONS.map((speed) => {
            const isActive = (playback.playbackSpeed || 1) === speed;
            return (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className="px-2 py-1 text-[11px] font-semibold transition-all"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: isActive ? 'rgba(56, 217, 200, 0.12)' : 'transparent',
                  color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                  borderRight: speed !== 8 ? '1px solid var(--card-border)' : 'none',
                  minWidth: 32,
                }}
                title={`${speed}× speed`}
              >
                {speed}×
              </button>
            );
          })}
        </div>

        <span className="text-sm font-bold tracking-wide ml-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
          {getVoyageClock()}
        </span>

        <span className="text-xs flex-1 text-right truncate font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          {currentLegName}
        </span>
      </div>

      {/* Scrubbable timeline */}
      <div
        className="w-full h-2.5 rounded-full cursor-pointer relative group"
        style={{ background: 'var(--navy-medium)' }}
        onClick={handleScrub}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${overallProgress * 100}%`,
            background: 'linear-gradient(90deg, var(--cyan), var(--steel))',
            boxShadow: '0 0 8px rgba(56, 217, 200, 0.2)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            left: `${overallProgress * 100}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--cyan)',
            borderColor: 'var(--navy)',
            boxShadow: '0 0 10px rgba(56, 217, 200, 0.4)',
          }}
        />
      </div>

      {/* Leg markers */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activePorts[0]?.name ?? 'Start'}</span>
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activePorts[activePorts.length - 1]?.name ?? 'End'}</span>
      </div>
    </div>
  );
}
