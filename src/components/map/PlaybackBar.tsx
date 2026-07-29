'use client';

import { useSimStore } from '@/store/useSimStore';
import { RotateCcw } from 'lucide-react';

const SPEED_OPTIONS = [1, 2, 4, 8];

export default function PlaybackBar() {
  const { playback, setPlaybackState, setPlaying, setPlaybackSpeed, simResult, activePorts } = useSimStore();

  // Use the simulated voyage, not the tabulated route — a roundtrip is twice
  // as long, and the scrubber has to span all of it.
  const voyageLegs = simResult.legs;
  const totalLegs = voyageLegs.length;
  // An empty route would make every ratio below NaN.
  const isRoundtrip = simResult.voyageMode === 'roundtrip';
  const overallProgress = totalLegs > 0
    ? Math.min(1, Math.max(0, (playback.currentLegIndex + playback.legProgress) / totalLegs))
    : 0;

  // Compute voyage clock
  const getVoyageClock = () => {
    let totalHours = 0;
    for (let i = 0; i < playback.currentLegIndex; i++) {
      const leg = voyageLegs[i];
      if (leg) totalHours += leg.sailTimeHours + leg.dwellMinutes / 60;
    }
    if (playback.currentLegIndex < voyageLegs.length) {
      totalHours += voyageLegs[playback.currentLegIndex].sailTimeHours * playback.legProgress;
    }
    const days = Math.floor(totalHours / 24) + 1;
    const hoursInDay = totalHours % 24;
    const hours = Math.floor(hoursInDay);
    const minutes = Math.floor((hoursInDay - hours) * 60);
    return `Day ${days} · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const currentLeg = voyageLegs[playback.currentLegIndex];
  const currentLegName = currentLeg
    ? `${currentLeg.fromPortName} → ${currentLeg.toPortName}`
    : 'Voyage Complete';
  const directionLabel = currentLeg
    ? currentLeg.direction === 'north' ? 'Northbound' : 'Southbound'
    : '';

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalLegs === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const legFloat = pct * totalLegs;
    const legIndex = Math.min(Math.max(0, Math.floor(legFloat)), totalLegs - 1);
    setPlaybackState({
      currentLegIndex: legIndex,
      legProgress: legFloat - legIndex,
      graphProgress: pct,
    });
  };

  const handlePlayPause = () => {
    if (playback.isPlaying) {
      // Pause
      setPlaying(false);
    } else {
      // Play or restart
      const isAtEnd = playback.currentLegIndex >= totalLegs - 1 && playback.legProgress >= 1;
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
    <div className="mt-3 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: playback.isPlaying ? 'rgba(56, 217, 200, 0.12)' : 'var(--glass-strong)',
              border: `1px solid ${playback.isPlaying ? 'rgba(56, 217, 200, 0.25)' : 'var(--card-border)'}`,
              color: playback.isPlaying ? 'var(--cyan)' : 'var(--text-secondary)',
              fontSize: 12,
            }}
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? '⏸' : '▶'}
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
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
                  className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-semibold transition-all"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: isActive ? 'rgba(56, 217, 200, 0.12)' : 'transparent',
                    color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                    borderRight: speed !== 8 ? '1px solid var(--card-border)' : 'none',
                    minWidth: 28,
                  }}
                  title={`${speed}× speed`}
                >
                  {speed}×
                </button>
              );
            })}
          </div>

          <span className="text-xs sm:text-sm font-bold tracking-wide ml-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
            {getVoyageClock()}
          </span>
        </div>

        <span className="text-xs flex-1 text-left sm:text-right truncate font-medium flex items-center justify-start sm:justify-end gap-2 min-w-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          {directionLabel && (
            <span
              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                fontFamily: 'var(--font-mono)',
                color: currentLeg?.direction === 'north' ? 'var(--cyan)' : 'var(--amber)',
                background: currentLeg?.direction === 'north' ? 'rgba(56,217,200,0.08)' : 'rgba(245,158,11,0.08)',
              }}
            >
              {directionLabel}
            </span>
          )}
          <span className="truncate">{currentLegName}</span>
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
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {voyageLegs[0]?.fromPortName ?? activePorts[0]?.name ?? 'Start'}
        </span>
        {isRoundtrip && (
          <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
            {activePorts[activePorts.length - 1]?.name ?? 'Turn'} ↻
          </span>
        )}
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {voyageLegs[voyageLegs.length - 1]?.toPortName ?? activePorts[activePorts.length - 1]?.name ?? 'End'}
        </span>
      </div>
    </div>
  );
}
