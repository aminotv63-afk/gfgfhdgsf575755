import React, { useState, useEffect, useRef } from 'react';
import { Crown, Shield, Users, DoorOpen, DoorClosed, MapPin, X, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

export type RoyalCommandType =
  | 'kneel'
  | 'stand'
  | 'follow'
  | 'guard_spot'
  | 'protect'
  | 'open_doors'
  | 'close_doors'
  | 'return_posts';

interface RoyalCommandMenuProps {
  onExecuteCommand: (command: RoyalCommandType) => void;
  currentStatus: string;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const RoyalCommandMenu: React.FC<RoyalCommandMenuProps> = ({
  onExecuteCommand,
  currentStatus,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) onToggleOpen(next);
    else setInternalIsOpen(next);
  };
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when tapping outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (command: RoyalCommandType) => {
    soundManager.playClick();
    onExecuteCommand(command);
    setIsOpen(false);
  };

  const commands: {
    id: RoyalCommandType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'kneel',
      label: '1. ركوع وسجود الحراس',
      sublabel: 'يركعون بالأرض خافضي الرؤوس إجلالاً للملك',
      icon: <span className="text-xl">🧎‍♂️</span>,
      color: 'text-amber-300',
      bgColor: 'bg-amber-950/80 hover:bg-amber-900/90',
      borderColor: 'border-amber-500/40',
    },
    {
      id: 'stand',
      label: '2. قيام وتأهب الحراس',
      sublabel: 'نهوض الحراس واستعدادهم العسكري الكامل',
      icon: <span className="text-xl">🧍‍♂️</span>,
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-950/80 hover:bg-emerald-900/90',
      borderColor: 'border-emerald-500/40',
    },
    {
      id: 'guard_spot',
      label: '3. توقف وثبات الحراس هنا',
      sublabel: 'يتوقفون هنا دون حراك ولا يتبعون الملك',
      icon: <span className="text-xl">🛑</span>,
      color: 'text-rose-300',
      bgColor: 'bg-rose-950/80 hover:bg-rose-900/90',
      borderColor: 'border-rose-500/40',
    },
    {
      id: 'protect',
      label: '4. تشكيل حماية الملك (يحكموك)',
      sublabel: 'حارس في الأمام وحارس في الخلف ووضع الدفاع',
      icon: <Shield className="w-5 h-5 text-yellow-300" />,
      color: 'text-yellow-300',
      bgColor: 'bg-amber-950/80 hover:bg-yellow-900/90',
      borderColor: 'border-yellow-500/40',
    },
    {
      id: 'follow',
      label: '5. اتباع ومرافقة الملك',
      sublabel: 'مرافقة السلطان يميناً ويساراً أينما ذهب',
      icon: <Users className="w-5 h-5 text-sky-300" />,
      color: 'text-sky-300',
      bgColor: 'bg-sky-950/80 hover:bg-sky-900/90',
      borderColor: 'border-sky-500/40',
    },
    {
      id: 'open_doors',
      label: '6. فتح أبواب القصر والسجن',
      sublabel: 'فتح بوابات القصر الملكي وزنزانات السجن',
      icon: <DoorOpen className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-300',
      bgColor: 'bg-stone-900/90 hover:bg-emerald-950/90',
      borderColor: 'border-emerald-500/40',
    },
    {
      id: 'close_doors',
      label: '7. إغلاق جميع الأبواب',
      sublabel: 'إيصاد الأبواب ومنع المرور',
      icon: <DoorClosed className="w-5 h-5 text-rose-400" />,
      color: 'text-rose-300',
      bgColor: 'bg-stone-900/90 hover:bg-rose-950/90',
      borderColor: 'border-rose-500/40',
    },
    {
      id: 'return_posts',
      label: '8. عودة الحراس للمواقع',
      sublabel: 'رجوع جميع الحراس لمحطاتهم الرسمية',
      icon: <MapPin className="w-5 h-5 text-purple-300" />,
      color: 'text-purple-300',
      bgColor: 'bg-purple-950/80 hover:bg-purple-900/90',
      borderColor: 'border-purple-500/40',
    },
  ];

  return (
    <div className="relative pointer-events-auto select-none" ref={menuRef}>
      {/* 1. Distinct, Prominent, Beautifully Labeled Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setIsOpen(!isOpen);
        }}
        aria-label="قائمة أوامر الحراس الملكيين"
        title="أوامر الحراس (يركعون · يتوقفون · يحكموك)"
        className={`relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl flex items-center gap-2 border-2 transition-all duration-300 active:scale-95 shadow-xl ${
          isOpen
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-white text-slate-950 ring-4 ring-amber-400/70 scale-105'
            : 'bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-yellow-950/95 border-amber-400/90 text-amber-300 hover:border-amber-300 shadow-amber-500/40'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/40 shrink-0">
          <Crown className={`w-4 h-4 text-amber-300 ${isOpen ? 'rotate-12' : ''}`} />
          <Sparkles className="w-2.5 h-2.5 text-amber-200 absolute -top-0.5 -right-0.5 animate-ping" />
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-xs sm:text-sm font-black text-amber-300">
            أوامر الحراس 👑
          </span>
          <span className="text-[9px] text-amber-200/80 font-bold">
            يركعون · يتوقفون · يحموك
          </span>
        </div>
      </button>

      {/* 2. Fullscreen Click-Away Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* 3. Elegant Commands Menu Modal */}
      {isOpen && (
        <div className="fixed sm:absolute bottom-20 sm:bottom-14 left-3 sm:left-0 z-50 w-[94vw] sm:w-88 max-w-sm bg-stone-950/95 border-2 border-amber-500/80 rounded-3xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-300">أوامر السلطان للحراس</h3>
                <span className="text-[10px] text-stone-400">يركعون · يتوقفون · يحكموك (حماية)</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsOpen(false);
              }}
              className="w-7 h-7 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status */}
          <div className="mt-2.5 mb-2 px-3 py-1.5 bg-black/60 rounded-xl border border-stone-800 text-[11px] flex items-center justify-between text-stone-300">
            <span className="font-bold text-amber-400">الحالة الراهنة:</span>
            <span className="font-semibold text-slate-200">{currentStatus}</span>
          </div>

          {/* Commands List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            {commands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.id)}
                className={`flex items-center gap-2.5 p-2 rounded-2xl border ${cmd.borderColor} ${cmd.bgColor} text-right transition-all duration-150 active:scale-95 group shadow-sm`}
              >
                <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                  {cmd.icon}
                </div>
                <div className="flex flex-col flex-1 leading-tight overflow-hidden">
                  <span className={`text-xs font-black ${cmd.color} truncate`}>
                    {cmd.label}
                  </span>
                  <span className="text-[9px] text-stone-400 truncate mt-0.5">
                    {cmd.sublabel}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-stone-800 text-center">
            <span className="text-[9px] text-amber-400/80 font-medium">
              تُنَفَّذ الأوامر تلقائياً وبشكل متناسق فور الضغط ⚔️
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
