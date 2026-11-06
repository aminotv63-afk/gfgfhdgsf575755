import React from 'react';
import {
  Settings,
  X,
  Sliders,
  Volume2,
  VolumeX,
  RotateCcw,
  Smartphone,
  BookOpen,
  HelpCircle,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface GameSettingsState {
  touchSensitivity: number; // 0.5 to 2.5
  isLeftHanded: boolean; // if true, swap joystick and action buttons
  buttonSize: 'normal' | 'large';
  invertJoystickX: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettingsState;
  onUpdateSettings: (newSettings: Partial<GameSettingsState>) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onResetCamera: () => void;
  isLandscapeMode: boolean;
  onToggleLandscape: () => void;
  onOpenStory: () => void;
  onOpenHelp?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isMuted,
  onToggleSound,
  onResetCamera,
  isLandscapeMode,
  onToggleLandscape,
  onOpenStory,
  onOpenHelp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 select-none animate-in fade-in zoom-in-95">
      <div className="relative w-full max-w-md bg-stone-950 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 leading-tight">
                إعدادات اللعبة والتحكم
              </h2>
              <span className="text-[10px] text-stone-400">
                تخصيص الحساسية ومواضع الأزرار والصوت
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white active:scale-90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs sm:text-sm">
          {/* 1. Touch & Camera Swipe Sensitivity Slider */}
          <div className="p-3 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>حساسية لمس وتدوير الكاميرا</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-black/60 text-amber-300 font-black text-xs border border-amber-500/30">
                {settings.touchSensitivity.toFixed(1)}x
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              تحكّم في سرعة وسلاسة دوران الشاشة عند سحب إصبعك.
            </p>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={settings.touchSensitivity}
              onChange={(e) => {
                onUpdateSettings({ touchSensitivity: parseFloat(e.target.value) });
              }}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] text-stone-500 font-bold px-1">
              <span>هادئة (0.5x)</span>
              <span>عادية (1.0x)</span>
              <span>سريعة جداً (2.5x)</span>
            </div>
          </div>

          {/* 2. Button Positions & Handedness (تغيير مواضع الأزرار) */}
          <div className="p-3 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sky-300">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>مواضع الأزرار وتوزيع اليدين</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onUpdateSettings({ isLeftHanded: false });
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                  !settings.isLeftHanded
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-black/50 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <span className="text-xs">وضع اليد اليمنى (افتراضي)</span>
                <span className="text-[9px] opacity-80">عصا يسار · أزرار يمين</span>
                {!settings.isLeftHanded && <Check className="w-3.5 h-3.5 text-amber-300 mt-0.5" />}
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onUpdateSettings({ isLeftHanded: true });
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                  settings.isLeftHanded
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-black/50 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <span className="text-xs">وضع اليد اليسرى (معكوس)</span>
                <span className="text-[9px] opacity-80">أزرار يسار · عصا يمين</span>
                {settings.isLeftHanded && <Check className="w-3.5 h-3.5 text-amber-300 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* 3. Joystick Invert Direction (توجيه العصا: عادي / معكوس) */}
          <div className="p-3 bg-stone-900/80 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">عكس اتجاه العصا الأفقي</span>
              <span className="text-[10px] text-stone-400">
                {settings.invertJoystickX
                  ? 'مفعّل: توجيه العصا لليمين يجعل اللاعب يذهب يساراً'
                  : 'عادي: توجيه العصا لليمين يذهب لليمين'}
              </span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onUpdateSettings({ invertJoystickX: !settings.invertJoystickX });
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border transition active:scale-95 ${
                settings.invertJoystickX
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-stone-800 text-stone-300 border-stone-600'
              }`}
            >
              {settings.invertJoystickX ? 'معكوس ✓' : 'عادي'}
            </button>
          </div>

          {/* 4. Quick Action Controls (Sound, Reset Camera, Landscape) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                onToggleSound();
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition active:scale-95 ${
                !isMuted
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-stone-900 border-stone-700 text-stone-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'الصوت: مكتوم' : 'الصوت: مفعّل'}</span>
            </button>

            {/* Reset Camera */}
            <button
              onClick={() => {
                soundManager.playClick();
                onResetCamera();
                onClose();
              }}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center gap-2 font-bold transition active:scale-90"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>إعادة ضبط الكاميرا</span>
            </button>

            {/* Landscape Toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleLandscape();
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition active:scale-95 ${
                isLandscapeMode
                  ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                  : 'bg-stone-900 border-stone-700 text-stone-300'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${isLandscapeMode ? 'rotate-90 text-amber-400' : ''}`} />
              <span>{isLandscapeMode ? 'وضع أفقي مفعّل' : 'الوضع الأفقي'}</span>
            </button>

            {/* Controls Guide */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenHelp?.();
                onClose();
              }}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center gap-2 font-bold transition active:scale-90"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>دليل أزرار التحكم</span>
            </button>
          </div>

          {/* Kingdom Story Intro */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenStory();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-stone-900/90 hover:bg-amber-950 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-2 font-bold transition active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>مشاهدة قصة المملكة العاشورية</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95"
          >
            حفظ وإغلاق الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
