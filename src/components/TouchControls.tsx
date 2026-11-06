import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Footprints, Zap, ArrowUp, Sword, Shield, Crown, RotateCcw, RotateCw, ChevronUp, ChevronDown, Smartphone, DoorOpen } from 'lucide-react';
import { ControlState } from '../types/game';
import { GuardCommandOptions } from '../game/royalGuards';
import { RoyalCommandMenu, RoyalCommandType } from './RoyalCommandMenu';

interface TouchControlsProps {
  onControlChange: (controls: Partial<ControlState>) => void;
  onCameraDrag: (deltaX: number, deltaY: number) => void;
  onResetCamera: () => void;
  isWalking: boolean;
  onToggleWalk: () => void;
  isSwordDrawn: boolean;
  onToggleSword: () => void;
  onAttack: () => void;
  guardOptions: GuardCommandOptions;
  onExecuteRoyalCommand: (command: RoyalCommandType) => void;
  currentStatusText: string;
  invertJoystickX: boolean;
  onToggleInvertJoystickX: () => void;
  isNearThrone: boolean;
  isSittingOnThrone: boolean;
  onToggleSitOnThrone: () => void;
  isNearGate?: boolean;
  onToggleGate?: () => void;
  isLandscapeMode: boolean;
  onToggleLandscape: () => void;
  isCommandsMenuOpen?: boolean;
  onToggleCommandsMenu?: (open: boolean) => void;
  touchSensitivity?: number;
  isLeftHanded?: boolean;
  isNearHorse?: boolean;
  isRidingHorse?: boolean;
  onToggleMountHorse?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onControlChange,
  onCameraDrag,
  onResetCamera,
  isWalking,
  onToggleWalk,
  isSwordDrawn,
  onToggleSword,
  onAttack,
  guardOptions,
  onExecuteRoyalCommand,
  currentStatusText,
  invertJoystickX,
  onToggleInvertJoystickX,
  isNearThrone,
  isSittingOnThrone,
  onToggleSitOnThrone,
  isNearGate,
  onToggleGate,
  isLandscapeMode,
  onToggleLandscape,
  isCommandsMenuOpen,
  onToggleCommandsMenu,
  touchSensitivity = 1.0,
  isLeftHanded = false,
  isNearHorse = false,
  isRidingHorse = false,
  onToggleMountHorse,
}) => {
  // Joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera swipe state
  const cameraTouchIdRef = useRef<number | null>(null);
  const lastCameraPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Button active visual states
  const [isSprintHeld, setIsSprintHeld] = useState(false);
  const [isJumpHeld, setIsJumpHeld] = useState(false);
  const [isAttackHeld, setIsAttackHeld] = useState(false);

  // Maximum joystick stick radius in pixels
  const JOYSTICK_MAX_RADIUS = 50;

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joystickTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      joystickOriginRef.current = { x: centerX, y: centerY };

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      updateJoystickVector(dx, dy);
    }
    setIsJoystickActive(true);
  };

  const updateJoystickVector = (dx: number, dy: number) => {
    const distance = Math.hypot(dx, dy);
    const clampedDist = Math.min(distance, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: clampedX, y: clampedY });

    // Normalized outputs: X is right (+) / left (-), Y is backward (+) / forward (-)
    // "عندما اوجه العصا لليمين الاعب يذهب يسار":
    const rawNormX = clampedX / JOYSTICK_MAX_RADIUS;
    const normX = invertJoystickX ? -rawNormX : rawNormX;
    const normY = -clampedY / JOYSTICK_MAX_RADIUS; // up is positive forward

    onControlChange({
      moveX: normX,
      moveY: normY,
    });
  };

  const handleJoystickTouchMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const dx = touch.clientX - joystickOriginRef.current.x;
        const dy = touch.clientY - joystickOriginRef.current.y;
        updateJoystickVector(dx, dy);
        break;
      }
    }
  }, []);

  const handleJoystickTouchEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onControlChange({ moveX: 0, moveY: 0 });
        break;
      }
    }
  }, []);

  // Camera swipe handlers for right side of screen
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    if (cameraTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    cameraTouchIdRef.current = touch.identifier;
    lastCameraPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCameraTouchMove = useCallback((e: TouchEvent) => {
    if (cameraTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchIdRef.current) {
        const deltaX = touch.clientX - lastCameraPosRef.current.x;
        const deltaY = touch.clientY - lastCameraPosRef.current.y;

        lastCameraPosRef.current = { x: touch.clientX, y: touch.clientY };
        const sens = touchSensitivity || 1.0;
        onCameraDrag(deltaX * 0.006 * sens, deltaY * 0.005 * sens);
        break;
      }
    }
  }, [onCameraDrag, touchSensitivity]);

  const handleCameraTouchEnd = useCallback((e: TouchEvent) => {
    if (cameraTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchIdRef.current) {
        cameraTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  // Global touch listeners to prevent touch getting stuck when moving outside bounds
  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
    window.addEventListener('touchcancel', handleJoystickTouchEnd);

    window.addEventListener('touchmove', handleCameraTouchMove, { passive: false });
    window.addEventListener('touchend', handleCameraTouchEnd);
    window.addEventListener('touchcancel', handleCameraTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleJoystickTouchMove);
      window.removeEventListener('touchend', handleJoystickTouchEnd);
      window.removeEventListener('touchcancel', handleJoystickTouchEnd);

      window.removeEventListener('touchmove', handleCameraTouchMove);
      window.removeEventListener('touchend', handleCameraTouchEnd);
      window.removeEventListener('touchcancel', handleCameraTouchEnd);
    };
  }, [handleJoystickTouchMove, handleJoystickTouchEnd, handleCameraTouchMove, handleCameraTouchEnd]);

  // Desktop keyboard controls fallback
  useEffect(() => {
    const keysPressed: Record<string, boolean> = {};

    const updateFromKeys = () => {
      let mx = 0;
      let my = 0;
      if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) mx -= 1;
      if (keysPressed['KeyD'] || keysPressed['ArrowRight']) mx += 1;
      if (keysPressed['KeyW'] || keysPressed['ArrowUp']) my += 1;
      if (keysPressed['KeyS'] || keysPressed['ArrowDown']) my -= 1;

      const isSprint = !!keysPressed['ShiftLeft'] || !!keysPressed['ShiftRight'];
      const isJump = !!keysPressed['Space'];

      onControlChange({
        moveX: mx,
        moveY: my,
        isRunning: isSprint,
        isJumping: isJump,
      });
      setIsSprintHeld(isSprint);
      setIsJumpHeld(isJump);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed[e.code] = true;

      // Hotkey 'R': Draw/Sheath sword
      if (e.code === 'KeyR' && !e.repeat) {
        onToggleSword();
      }

      // Hotkey 'F' or 'KeyE': Attack / Strike
      if ((e.code === 'KeyF' || e.code === 'KeyE') && !e.repeat) {
        onAttack();
        setIsAttackHeld(true);
        setTimeout(() => setIsAttackHeld(false), 200);
      }

      // Hotkey 'K': Toggle Kneel & Bow
      if (e.code === 'KeyK' && !e.repeat) {
        onExecuteRoyalCommand('kneel');
      }

      // Hotkey 'H': Toggle Hold position
      if (e.code === 'KeyH' && !e.repeat) {
        onExecuteRoyalCommand('guard_spot');
      }

      // Hotkey 'P': Toggle Protect Formation
      if (e.code === 'KeyP' && !e.repeat) {
        onExecuteRoyalCommand('protect');
      }

      // Hotkey 'T': Sit on Throne when near throne
      if (e.code === 'KeyT' && !e.repeat && isNearThrone) {
        onToggleSitOnThrone();
      }

      updateFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
      updateFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onControlChange, onToggleSword, onAttack, onExecuteRoyalCommand, isNearThrone, onToggleSitOnThrone]);

  const handleAttackTrigger = () => {
    setIsAttackHeld(true);
    onAttack();
    setTimeout(() => {
      setIsAttackHeld(false);
    }, 250);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none">
      {/* Full screen background camera touch area for moving / rotating the screen anywhere */}
      <div
        className="absolute inset-0 pointer-events-auto touch-none"
        onTouchStart={handleCameraTouchStart}
      />

      {/* Bottom control zone (supports standard or left-handed mode) */}
      <div className={`mt-auto w-full p-2 sm:p-4 flex items-end justify-between pointer-events-none gap-2 ${
        isLeftHanded ? 'flex-row-reverse' : 'flex-row'
      }`}>
        {/* Left: Royal Command Menu + Virtual Joystick */}
        <div className="flex flex-col items-start gap-2 pointer-events-none">
          {/* 1. Single Elegant Circular Sultan Command Button Slot */}
          <div className="pointer-events-auto">
            <RoyalCommandMenu
              onExecuteCommand={onExecuteRoyalCommand}
              currentStatus={currentStatusText}
              isOpen={isCommandsMenuOpen}
              onToggleOpen={onToggleCommandsMenu}
            />
          </div>

          {/* Virtual Joystick */}
          <div className="relative pointer-events-auto touch-none flex flex-col items-center">
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickTouchStart}
              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/80 border-2 ${
                isJoystickActive ? 'border-amber-400 bg-amber-950/40' : 'border-stone-700/80'
              } backdrop-blur-md flex items-center justify-center shadow-xl shadow-black/70 transition-colors overflow-hidden`}
            >
              {/* Movement Locked Overlay during King Protection */}
              {guardOptions.isProtectFormation && (
                <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-1 text-center select-none border-2 border-sky-400 rounded-full animate-pulse">
                  <Shield className="w-5 h-5 text-sky-300" />
                  <span className="text-[9px] font-black text-sky-200 mt-0.5 leading-tight">
                    الحركة مقفلة
                  </span>
                  <span className="text-[7px] text-sky-300/80 font-bold">
                    حماية الملك
                  </span>
                </div>
              )}

              {/* Cardinal marks */}
              <div className="absolute top-1.5 w-1 h-1 rounded-full bg-stone-500" />
              <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-stone-500" />
              <div className="absolute left-1.5 w-1 h-1 rounded-full bg-stone-500" />
              <div className="absolute right-1.5 w-1 h-1 rounded-full bg-stone-500" />

              {/* Inner thumbstick */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr ${
                  isJoystickActive
                    ? 'from-amber-600 to-amber-400 shadow-amber-500/50'
                    : 'from-stone-700 to-stone-500'
                } border border-white/70 shadow-lg flex items-center justify-center transition-transform duration-75`}
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
              </div>
            </div>

            {/* Invert Joystick X toggle ("عندما اوجه العصا لليمين الاعب يذهب يسار") */}
            <button
              onClick={onToggleInvertJoystickX}
              title="عكس اتجاه العصا الأفقي (توجيه العصا لليمين يجعل اللاعب يذهب يسار)"
              className={`mt-1 w-full py-0.5 px-2 rounded-lg text-[9px] font-black border transition active:scale-95 flex items-center justify-center gap-1 backdrop-blur-md shadow-sm ${
                invertJoystickX
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 border-yellow-200 text-slate-950'
                  : 'bg-stone-900/90 border-stone-700 text-stone-300 hover:border-amber-400'
              }`}
            >
              <span>⇄ توجيه العصا:</span>
              <span className="font-extrabold">{invertJoystickX ? 'معكوس' : 'عادي'}</span>
            </button>
          </div>
        </div>

        {/* Right: Compact Action Buttons (Combat, Gate, Throne, Locomotion) */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 touch-none">
          {/* Row 1: Contextual Actions & Combat */}
          <div className="flex items-center gap-2">
            {/* Horse Mount / Dismount Button */}
            {(isNearHorse || isRidingHorse) && onToggleMountHorse && (
              <button
                onClick={onToggleMountHorse}
                title={isRidingHorse ? 'النزول من الحصان الملكي' : 'ركوب الحصان الملكي (مفتاح E أو M)'}
                aria-label="الحصان الملكي"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border-2 shadow-lg active:scale-90 transition animate-bounce ${
                  isRidingHorse
                    ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-white text-slate-950 font-black ring-2 ring-yellow-400'
                    : 'bg-gradient-to-tr from-emerald-900 to-teal-950 border-emerald-400 text-emerald-200'
                }`}
              >
                <span className="text-base leading-none">🐎</span>
                <span className="text-[8px] font-black leading-none mt-0.5">
                  {isRidingHorse ? 'نزول' : 'ركوب'}
                </span>
              </button>
            )}

            {/* Gate Open/Close Button if near Palace Gate */}
            {isNearGate && onToggleGate && (
              <button
                onClick={onToggleGate}
                title="فتح أو إغلاق بوابة القصر الملكي"
                aria-label="بوابة القصر"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border-2 border-emerald-400 bg-gradient-to-b from-emerald-900/90 to-teal-950/90 text-emerald-200 shadow-lg active:scale-90 transition animate-bounce"
              >
                <DoorOpen className="w-4 h-4 text-emerald-300" />
                <span className="text-[8px] font-black leading-none mt-0.5">البوابة</span>
              </button>
            )}

            {/* Throne Button if near Royal Throne */}
            {isNearThrone && (
              <button
                onClick={onToggleSitOnThrone}
                title="الجلوس فوق العرش الملكي (مفتاح T)"
                aria-label="العرش الملكي"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border-2 shadow-lg active:scale-90 transition ${
                  isSittingOnThrone
                    ? 'bg-yellow-500 border-white text-slate-950 font-black animate-pulse'
                    : 'bg-gradient-to-b from-amber-950/90 to-yellow-950/90 border-amber-400 text-amber-300'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-[8px] font-black leading-none mt-0.5">
                  {isSittingOnThrone ? 'نهوض' : 'عرش'}
                </span>
              </button>
            )}

            {/* Sword Draw/Sheath */}
            <button
              onClick={onToggleSword}
              title={isSwordDrawn ? 'إغماد السيف (مفتاح R)' : 'سحب السيف (مفتاح R)'}
              aria-label="سحب أو إغماد السيف"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border shadow-md active:scale-90 transition ${
                isSwordDrawn
                  ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-yellow-200 text-slate-950 font-black shadow-amber-500/40'
                  : 'bg-stone-900/85 border-stone-600 text-stone-200 hover:border-amber-400'
              }`}
            >
              <Sword className={`w-4 h-4 ${isSwordDrawn ? 'rotate-45' : ''}`} />
              <span className="text-[8px] font-black leading-none mt-0.5">
                {isSwordDrawn ? 'إغماد' : 'سحب'}
              </span>
            </button>

            {/* Sword Strike Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleAttackTrigger();
              }}
              onMouseDown={() => {
                handleAttackTrigger();
              }}
              title="ضربة سيف واقعية (مفتاح F أو E)"
              aria-label="ضربة سيف"
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex flex-col items-center justify-center border-2 shadow-xl active:scale-90 transition ${
                isAttackHeld
                  ? 'bg-gradient-to-tr from-red-600 to-rose-400 border-white text-white scale-95 shadow-red-500/80 ring-2 ring-rose-400'
                  : 'bg-gradient-to-tr from-red-900/90 via-red-800/90 to-amber-700/90 border-amber-400/90 text-amber-200 hover:border-amber-300 shadow-red-950/60'
              }`}
            >
              <div className="relative">
                <Sword className="w-5 h-5 -rotate-45 stroke-[2.2]" />
                <span className="absolute -top-1 -right-1 text-[9px]">⚡</span>
              </div>
              <span className="text-[9px] font-black leading-none mt-0.5 text-white drop-shadow">
                ضربة
              </span>
            </button>
          </div>

          {/* Row 2: Locomotion Buttons (Walk, Sprint, Jump) */}
          <div className="flex items-center gap-2">
            {/* Walk Toggle */}
            <button
              onClick={onToggleWalk}
              title="تبديل وضع المشي / الجري العادي"
              aria-label="مشي"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border shadow-md active:scale-90 transition ${
                isWalking
                  ? 'bg-emerald-600/90 border-emerald-300 text-white ring-2 ring-emerald-400/50'
                  : 'bg-stone-900/80 border-stone-600 text-stone-300 hover:border-stone-400'
              }`}
            >
              <Footprints className="w-4 h-4" />
              <span className="text-[8px] font-bold leading-none mt-0.5">{isWalking ? 'مشي ✓' : 'مشي'}</span>
            </button>

            {/* Sprint Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setIsSprintHeld(true);
                onControlChange({ isRunning: true });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsSprintHeld(false);
                onControlChange({ isRunning: false });
              }}
              onMouseDown={() => {
                setIsSprintHeld(true);
                onControlChange({ isRunning: true });
              }}
              onMouseUp={() => {
                setIsSprintHeld(false);
                onControlChange({ isRunning: false });
              }}
              title="جري سريع بالسلطان (مفتاح Shift)"
              aria-label="جري"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border shadow-md active:scale-90 transition ${
                isSprintHeld
                  ? 'bg-amber-500 border-amber-200 text-slate-950 scale-95 shadow-amber-500/60 ring-2 ring-amber-400'
                  : 'bg-gradient-to-b from-stone-900/85 to-amber-950/70 border-amber-500/60 text-amber-300'
              }`}
            >
              <Zap className={`w-4 h-4 ${isSprintHeld ? 'fill-current' : ''}`} />
              <span className="text-[8px] font-black leading-none mt-0.5">جري</span>
            </button>

            {/* Jump Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setIsJumpHeld(true);
                onControlChange({ isJumping: true });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsJumpHeld(false);
                onControlChange({ isJumping: false });
              }}
              onMouseDown={() => {
                setIsJumpHeld(true);
                onControlChange({ isJumping: true });
              }}
              onMouseUp={() => {
                setIsJumpHeld(false);
                onControlChange({ isJumping: false });
              }}
              title="قفز بالهواء (مفتاح المسافة Space)"
              aria-label="قفز"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border shadow-md active:scale-90 transition ${
                isJumpHeld
                  ? 'bg-sky-500 border-sky-200 text-slate-950 scale-95 shadow-sky-500/60 ring-2 ring-sky-400'
                  : 'bg-gradient-to-b from-stone-900/85 to-sky-950/70 border-sky-500/60 text-sky-300'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[8px] font-black leading-none mt-0.5">قفز</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
