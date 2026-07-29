'use client';

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ARCTIC_CIRCLE_LAT } from '@/data/ports';
import { useSimStore } from '@/store/useSimStore';
import PlaybackBar from './PlaybackBar';
import { PortConfig, LegResult } from '@/engine/types';
import { Port } from '@/data/ports';
import { Zap, Battery } from 'lucide-react';

// ─── Arctic Circle line (static, never re-renders) ───
const ArcticCircleLine = memo(function ArcticCircleLine() {
  const positions: [number, number][] = [
    [ARCTIC_CIRCLE_LAT, -5],
    [ARCTIC_CIRCLE_LAT, 45],
  ];
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#556677',
        weight: 1,
        dashArray: '8 6',
        opacity: 0.4,
      }}
    />
  );
});

// ─── Camera follower — only pans when position prop changes ───
function CameraFollow({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// ─── Ship icon cache (keyed by SoC bucket) ───
const iconCache = new Map<number, L.DivIcon>();
function getShipIcon(socPercent: number): L.DivIcon {
  // Round to nearest 2% to limit cache entries to ~50
  const bucket = Math.round(socPercent / 2) * 2;
  const cached = iconCache.get(bucket);
  if (cached) return cached;

  const color = bucket > 50 ? '#54D3C6' : bucket > 20 ? '#E2A53C' : '#D24B43';
  const circumference = 87.96;
  const filled = circumference * (bucket / 100);
  const empty = circumference - filled;
  const svg = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" fill="rgba(11,21,33,0.7)" stroke="#1A2D44" stroke-width="2"/>
      <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="2.5"
        stroke-dasharray="${filled} ${empty}"
        stroke-dashoffset="22" transform="rotate(-90 18 18)" stroke-linecap="round"/>
      <polygon points="18,7 23,24 18,20 13,24" fill="${color}" opacity="0.9"/>
    </svg>
  `;
  const icon = L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  iconCache.set(bucket, icon);
  return icon;
}

// ─── Port markers (memoized, only re-renders when portConfigs change) ───
interface PortMarkersProps {
  ports: Port[];
  portConfigs: PortConfig[];
}
const PortMarkers = memo(function PortMarkers({ ports, portConfigs }: PortMarkersProps) {
  // Port ids need not match array positions once a custom route is loaded.
  const configById = new Map(portConfigs.map((pc) => [pc.portId, pc]));
  return (
    <>
      {ports.map((port) => {
        const pc = configById.get(port.id);
        const hasCharger = pc?.hasCharger;
        const hasBuffer = pc?.hasBufferBattery;
        const radius = hasCharger ? 5 : 3;

        return (
          <CircleMarker
            key={port.id}
            center={[port.lat, port.lng]}
            radius={radius}
            pathOptions={{
              color: hasCharger ? '#54D3C6' : '#3E86C4',
              fillColor: hasCharger ? '#54D3C6' : '#2A5A8A',
              fillOpacity: hasCharger ? 0.8 : 0.5,
              weight: hasCharger ? 2 : 1,
            }}
          >
            <Tooltip className="dark-tooltip" direction="top" offset={[0, -10]}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <div className="font-bold text-sm">{port.name}</div>
                <div className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: port.gridTier === 'strong' ? '#4ADE80' : port.gridTier === 'medium' ? '#E2A53C' : '#D24B43'
                  }} />
                  Grid: {port.gridTier} · Dwell: {port.portStayMinutes}min
                </div>
                {hasCharger && <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#54D3C6' }}><Zap size={10} /> Charger active</div>}
                {hasBuffer && <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#E2A53C' }}><Battery size={10} /> Buffer battery</div>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
});

// ─── Route polylines (memoized, batched into groups) ───
interface RouteSegmentsProps {
  currentLegIndex: number;
  deadZoneLegs: Set<number>;
  ports: Port[];
  legs: LegResult[];
}
const RouteSegments = memo(function RouteSegments({ currentLegIndex, deadZoneLegs, ports, legs }: RouteSegmentsProps) {
  // Build batched polylines: sailed, dead-zone, current, ahead
  const { sailedPositions, deadZonePositions, currentPositions, aheadPositions } = useMemo(() => {
    const sailed: [number, number][][] = [];
    const deadZone: [number, number][][] = [];
    const current: [number, number][][] = [];
    const ahead: [number, number][][] = [];

    const portById = new Map(ports.map((p) => [p.id, p]));

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const from = portById.get(leg.fromPortId);
      const to = portById.get(leg.toPortId);
      if (!from || !to) continue; // malformed route — draw what we can
      const segment: [number, number][] = [[from.lat, from.lng], [to.lat, to.lng]];

      if (deadZoneLegs.has(i)) {
        deadZone.push(segment);
      } else if (i < currentLegIndex) {
        sailed.push(segment);
      } else if (i === currentLegIndex) {
        current.push(segment);
      } else {
        ahead.push(segment);
      }
    }

    // Flatten contiguous sailed segments into multi-point lines where possible
    return {
      sailedPositions: sailed,
      deadZonePositions: deadZone,
      currentPositions: current,
      aheadPositions: ahead,
    };
  }, [currentLegIndex, deadZoneLegs, ports, legs]);

  return (
    <>
      {/* Ahead first: on a roundtrip the return legs overlap the outbound ones,
          so the dim segments must not paint over what has already been sailed. */}
      {aheadPositions.map((positions, i) => (
        <Polyline
          key={`a-${i}`}
          positions={positions}
          pathOptions={{ color: '#2A5A8A', weight: 2, opacity: 0.4 }}
        />
      ))}
      {sailedPositions.map((positions, i) => (
        <Polyline
          key={`s-${i}`}
          positions={positions}
          pathOptions={{ color: '#54D3C6', weight: 3, opacity: 0.8 }}
        />
      ))}
      {deadZonePositions.map((positions, i) => (
        <Polyline
          key={`d-${i}`}
          positions={positions}
          pathOptions={{ color: '#D24B43', weight: 3, opacity: 0.9 }}
        />
      ))}
      {currentPositions.map((positions, i) => (
        <Polyline
          key={`c-${i}`}
          positions={positions}
          pathOptions={{ color: '#54D3C6', weight: 4, opacity: 1 }}
        />
      ))}
    </>
  );
});

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function RouteMap() {
  const { simResult, config, playback, setPlaybackState, activePorts } = useSimStore();
  // The simulated voyage is the source of truth for the leg sequence: a
  // roundtrip has twice as many legs as the tabulated route.
  const voyageLegs = simResult.legs;
  const [shipPos, setShipPos] = useState<[number, number]>([activePorts[0]?.lat ?? 60, activePorts[0]?.lng ?? 5]);
  const [socPercent, setSocPercent] = useState(100);
  const [cameraPanTarget, setCameraPanTarget] = useState<[number, number] | null>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastCameraPanRef = useRef<number>(0);
  const playbackRef = useRef(playback);

  // Keep playback ref updated
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  const routeCoords: [number, number][] = useMemo(
    () => activePorts.map((p) => [p.lat, p.lng]),
    [activePorts]
  );

  // Compute dead-zone leg set (only changes when sim results change)
  const deadZoneLegs = useMemo(() => {
    const set = new Set<number>();
    simResult.legs.forEach((leg, i) => {
      if (leg.isDeadZone) set.add(i);
    });
    return set;
  }, [simResult.legs]);

  // Interpolate ship position
  const getShipPosition = useCallback((legIndex: number, progress: number): [number, number] => {
    const portById = new Map(activePorts.map((p) => [p.id, p]));
    const fallback: [number, number] = [activePorts[0]?.lat ?? 60, activePorts[0]?.lng ?? 5];

    if (legIndex >= voyageLegs.length) {
      const last = activePorts[activePorts.length - 1];
      return last ? [last.lat, last.lng] : fallback;
    }
    const leg = voyageLegs[legIndex];
    const from = portById.get(leg.fromPortId);
    const to = portById.get(leg.toPortId);
    if (!from || !to) return fallback;
    return [
      from.lat + (to.lat - from.lat) * progress,
      from.lng + (to.lng - from.lng) * progress,
    ];
  }, [activePorts, voyageLegs]);

  // Get SoC percent at current playback position
  const getSocPercent = useCallback((legIndex: number, progress: number): number => {
    if (legIndex >= simResult.legs.length) return 50;
    const legResult = simResult.legs[legIndex];
    const socStart = legResult.socBeforeMWh;
    const socEnd = legResult.socAfterSailingMWh;
    const currentSoc = socStart + (socEnd - socStart) * progress;
    return Math.max(0, Math.min(100, (currentSoc / config.batteryMWh) * 100));
  }, [simResult.legs, config.batteryMWh]);

  // Animation loop — uses refs to avoid dependency cascades
  useEffect(() => {
    if (!playback.isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const totalLegTime = simResult.legs.reduce((s, l) => s + l.sailTimeHours, 0);
    const PLAYBACK_DURATION_SECONDS = 60;
    const BASE_PLAYBACK_SPEED = totalLegTime / PLAYBACK_DURATION_SECONDS;
    const legsData = simResult.legs;
    const totalLegs = voyageLegs.length;
    let prevLegIndex = playbackRef.current.currentLegIndex;
    const MIN_FRAME_INTERVAL = 33; // ~30fps max to avoid CPU saturation

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastTimeRef.current;
      // Skip if too soon (throttle to ~30fps)
      if (elapsed < MIN_FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const delta = elapsed / 1000;
      lastTimeRef.current = timestamp;

      const pb = playbackRef.current;
      if (!pb.isPlaying) return; // bail if paused between frames

      const currentLeg = legsData[pb.currentLegIndex];
      if (!currentLeg) {
        setPlaybackState({ isPlaying: false, graphProgress: 1 });
        return;
      }

      // Apply speed multiplier from playback state
      const speedMultiplier = pb.playbackSpeed || 1;
      const PLAYBACK_SPEED = BASE_PLAYBACK_SPEED * speedMultiplier;

      const legDuration = currentLeg.sailTimeHours / PLAYBACK_SPEED;
      const progressIncrement = delta / legDuration;
      let newProgress = pb.legProgress + progressIncrement;
      let newLegIndex = pb.currentLegIndex;

      if (newProgress >= 1) {
        newProgress = 0;
        newLegIndex++;
        if (newLegIndex >= totalLegs) {
          setPlaybackState({ isPlaying: false, currentLegIndex: totalLegs - 1, legProgress: 1, graphProgress: 1 });
          return;
        }
      }

      // Compute normalized graph progress (0–1 across entire voyage)
      const graphProgress = Math.min(1, (newLegIndex + newProgress) / totalLegs);

      // Update ship position directly (no Zustand state for position-only changes)
      const pos = getShipPosition(newLegIndex, newProgress);
      setShipPos(pos);

      const soc = getSocPercent(newLegIndex, newProgress);
      setSocPercent(soc);

      // Only call setPlaybackState when leg index changes to avoid flooding the store
      if (newLegIndex !== prevLegIndex) {
        setPlaybackState({ currentLegIndex: newLegIndex, legProgress: newProgress, graphProgress });
        prevLegIndex = newLegIndex;
      } else {
        // Lightweight update via ref — sync to store periodically via interval
        playbackRef.current = { ...pb, legProgress: newProgress, currentLegIndex: newLegIndex, graphProgress };
      }

      // Camera pan — throttle to every 3 seconds
      const now = Date.now();
      if (now - lastCameraPanRef.current > 3000) {
        setCameraPanTarget(pos);
        lastCameraPanRef.current = now;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(animate);

    // Sync store periodically for PlaybackBar scrubber + graph updates (1s interval to keep UI responsive)
    const syncInterval = setInterval(() => {
      const pb = playbackRef.current;
      if (pb.isPlaying) {
        setPlaybackState({ currentLegIndex: pb.currentLegIndex, legProgress: pb.legProgress, graphProgress: pb.graphProgress });
      }
    }, 1000);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearInterval(syncInterval);
    };
  // Only re-run when isPlaying changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.isPlaying]);

  // While paused, the marker is a pure function of the scrub position, so it is
  // derived during render rather than pushed into state from an effect.
  const displayPos = playback.isPlaying
    ? shipPos
    : getShipPosition(playback.currentLegIndex, playback.legProgress);
  const displaySoc = playback.isPlaying
    ? socPercent
    : getSocPercent(playback.currentLegIndex, playback.legProgress);

  // Map bounds — Leaflet throws on empty bounds, so fall back to Norway.
  const bounds = useMemo(
    () => (routeCoords.length > 0
      ? L.latLngBounds(routeCoords)
      : L.latLngBounds([[58, 4], [71, 31]])),
    [routeCoords],
  );

  return (
    <div className="w-full flex flex-col">
      <div className="h-[380px] sm:h-[440px] lg:h-[490px] rounded-xl overflow-hidden border border-[var(--card-border)] relative flex-shrink-0">
        <MapContainer
          bounds={bounds}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={true}
        >
          <MapResizeHandler />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <ArcticCircleLine />

          {/* Batched route segments — only re-renders on leg index change */}
          <RouteSegments
            currentLegIndex={playback.currentLegIndex}
            deadZoneLegs={deadZoneLegs}
            ports={activePorts}
            legs={voyageLegs}
          />

          {/* Port markers — only re-renders on port config change */}
          <PortMarkers ports={activePorts} portConfigs={config.portConfigs} />

          {/* Ship marker */}
          <Marker
            position={displayPos}
            icon={getShipIcon(displaySoc)}
          />

          {/* Camera follow during playback — throttled via parent */}
          {playback.isPlaying && <CameraFollow position={cameraPanTarget} />}
        </MapContainer>
      </div>

      <PlaybackBar />
    </div>
  );
}
