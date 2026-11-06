import React, { useState, useRef } from 'react';
import { Map, Navigation, MapPin, X, Maximize2, Compass, CheckCircle2 } from 'lucide-react';
import { PRESET_LANDMARKS, Waypoint } from '../game/gpsSystem';
import { soundManager } from '../utils/audio';

interface MiniMapProps {
  playerPos: { x: number; z: number };
  playerAngle: number;
  gpsTarget: { active: boolean; distance: number; targetName: string; hasArrived: boolean } | null;
  onSetWaypoint: (x: number, z: number, name: string) => void;
  onClearWaypoint: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerPos,
  playerAngle,
  gpsTarget,
  onSetWaypoint,
  onClearWaypoint,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  // Map world scale: Realm is ~120m diameter
  const WORLD_BOUNDS = 60; // -60 to +60 meters

  // Convert click on map element to world coordinates
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>, mapSize: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Normalize from 0..mapSize to -WORLD_BOUNDS..+WORLD_BOUNDS
    // X is horizontal, Z is vertical (up is negative Z or positive Z)
    const normX = (clickX / mapSize) * 2 - 1;
    const normY = (clickY / mapSize) * 2 - 1;

    const worldX = Math.round(normX * WORLD_BOUNDS);
    const worldZ = Math.round(normY * WORLD_BOUNDS);

    soundManager.playClick();
    onSetWaypoint(worldX, worldZ, `إحداثيات (${worldX}, ${worldZ})`);
  };

  // Convert world coordinates to percentage on map (0% to 100%)
  const worldToMapPercent = (x: number, z: number) => {
    const px = ((x + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100;
    const pz = ((z + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100;
    return {
      left: `${Math.max(4, Math.min(96, px))}%`,
      top: `${Math.max(4, Math.min(96, pz))}%`,
    };
  };

  const sultanMapPos = worldToMapPercent(playerPos.x, playerPos.z);

  return (
    <>
      {/* 1. Prominent HUD Mini-Map (Top Right Corner) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 pointer-events-auto select-none flex flex-col items-end gap-1">
        {/* Active GPS Guidance Badge */}
        {gpsTarget?.active && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/95 border border-sky-400 text-sky-200 text-[11px] font-black shadow-xl backdrop-blur-md animate-pulse">
            <Navigation className="w-3.5 h-3.5 text-sky-300 animate-spin" />
            <span className="truncate max-w-[130px]">{gpsTarget.targetName}</span>
            <span className="text-yellow-300 font-extrabold">({gpsTarget.distance}م)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearWaypoint();
              }}
              title="إلغاء خط GPS"
              className="text-stone-400 hover:text-white p-0.5 rounded-full hover:bg-stone-800"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Arrival Celebration Badge */}
        {gpsTarget?.hasArrived && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/95 border border-emerald-400 text-emerald-300 text-[11px] font-black shadow-xl animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>وصلت إلى الوجهة بنجاح! 🚩</span>
          </div>
        )}

        {/* Circular Mini-Map Container */}
        <div className="relative group">
          <div
            onClick={(e) => handleMapClick(e, 120)}
            title="خريطة المملكة - انقر في أي مكان لتحديد خط الملاحة GPS"
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-slate-950/95 border-2 border-amber-400 shadow-2xl backdrop-blur-md overflow-hidden cursor-crosshair transition-transform active:scale-95 ring-2 ring-black/40"
          >
            {/* Compass rose background grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Palace Perimeter Outline (Z: 14 to 48, X: -20 to 20) */}
            <div
              className="absolute border border-amber-400/60 bg-amber-500/10 rounded-sm"
              style={{
                left: `${(( -20 + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100}%`,
                top: `${(( 14 + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100}%`,
                width: `${(40 / (WORLD_BOUNDS * 2)) * 100}%`,
                height: `${(34 / (WORLD_BOUNDS * 2)) * 100}%`,
              }}
            >
              {/* Palace Entrance Gate marker */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-1 bg-emerald-400 rounded-full" />
              {/* Throne marker */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            </div>

            {/* Landmarks Pins */}
            {PRESET_LANDMARKS.slice(0, 3).map((lm, idx) => {
              const pos = worldToMapPercent(lm.x, lm.z);
              return (
                <div
                  key={idx}
                  className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/70 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pos.left, top: pos.top }}
                />
              );
            })}

            {/* Destination Waypoint Flag */}
            {gpsTarget?.active && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                style={worldToMapPercent(
                  PRESET_LANDMARKS.find((l) => l.name === gpsTarget.targetName)?.x || 0,
                  PRESET_LANDMARKS.find((l) => l.name === gpsTarget.targetName)?.z || 0
                )}
              >
                <span className="text-xs text-sky-400 animate-bounce">🚩</span>
              </div>
            )}

            {/* Sultan Player Icon & Heading Arrow */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none"
              style={{ left: sultanMapPos.left, top: sultanMapPos.top }}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border border-white flex items-center justify-center shadow-md shadow-amber-500/80">
                  <span className="text-[8px] leading-none">👑</span>
                </div>
                {/* Heading needle */}
                <div
                  className="absolute w-1 h-2.5 bg-yellow-300 rounded-full origin-bottom"
                  style={{
                    transform: `translateY(-4px) rotate(${playerAngle}rad)`,
                  }}
                />
              </div>
            </div>

            {/* Mini-map title tag */}
            <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
              <span className="text-[8px] font-black text-amber-300/90 bg-black/80 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                خريطة GPS 🗺️
              </span>
            </div>
          </div>

          {/* Expand Map Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setIsExpanded(true);
            }}
            title="تكبير خريطة المملكة الكاملة"
            className="absolute -bottom-1 -left-1 p-1 rounded-full bg-amber-500 text-slate-950 hover:bg-yellow-400 transition shadow-md active:scale-90"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Fullscreen Interactive World Map Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none">
          <div className="relative w-full max-w-xl bg-stone-950 border-2 border-amber-500/80 rounded-3xl p-4 sm:p-6 shadow-2xl text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-amber-300">
                  خريطة المملكة العاشورية والملاحة GPS
                </h3>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsExpanded(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 mt-2">
              اضغط في أي مكان على الخريطة لوضع خط ومسار GPS للتوجيه فورياً في العالم 3D:
            </p>

            {/* Interactive World Map Canvas Container */}
            <div
              onClick={(e) => handleMapClick(e, 320)}
              className="relative w-full h-72 sm:h-80 my-3 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-emerald-950/40 border-2 border-amber-500/40 overflow-hidden cursor-crosshair shadow-inner"
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Grand Palace Layout */}
              <div
                className="absolute border-2 border-amber-400/80 bg-amber-500/15 rounded-md flex flex-col items-center justify-center"
                style={{
                  left: `${(( -20 + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100}%`,
                  top: `${(( 14 + WORLD_BOUNDS) / (WORLD_BOUNDS * 2)) * 100}%`,
                  width: `${(40 / (WORLD_BOUNDS * 2)) * 100}%`,
                  height: `${(34 / (WORLD_BOUNDS * 2)) * 100}%`,
                }}
              >
                <span className="text-[10px] font-extrabold text-amber-300 drop-shadow">قصر السلطان</span>
                {/* Main Gate */}
                <div className="absolute top-0 w-8 h-1.5 bg-emerald-400 rounded-full" />
                {/* Throne */}
                <div className="absolute bottom-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] text-slate-950">👑</div>
                {/* Dungeon */}
                <div className="absolute top-8 right-2 px-1 py-0.5 bg-stone-800 text-[8px] rounded border border-stone-600">سجن</div>
              </div>

              {/* Preset Landmarks Pins on Map */}
              {PRESET_LANDMARKS.map((lm, idx) => {
                const pos = worldToMapPercent(lm.x, lm.z);
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playClick();
                      onSetWaypoint(lm.x, lm.z, lm.name);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin p-1"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-md group-hover/pin:scale-125 transition-transform" />
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-amber-200 border border-amber-500/30 opacity-90">
                      {lm.name}
                    </span>
                  </button>
                );
              })}

              {/* Sultan Player Icon */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none"
                style={{ left: sultanMapPos.left, top: sultanMapPos.top }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500">
                    <span className="text-[10px] leading-none">👑</span>
                  </div>
                  <div
                    className="absolute w-1.5 h-3 bg-yellow-300 rounded-full origin-bottom"
                    style={{
                      transform: `translateY(-6px) rotate(${playerAngle}rad)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Waypoints Preset Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400">وجهات سريعة بنقرة واحدة:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_LANDMARKS.slice(0, 5).map((lm, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playClick();
                      onSetWaypoint(lm.x, lm.z, lm.name);
                      setIsExpanded(false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-amber-950 border border-amber-500/40 text-stone-200 text-xs font-semibold transition active:scale-95"
                  >
                    {lm.name}
                  </button>
                ))}
                {gpsTarget?.active && (
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onClearWaypoint();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs font-bold transition active:scale-95"
                  >
                    ✕ مسح خط GPS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
