import React, { useState } from 'react';
import { Crown, HelpCircle, BookOpen, Volume2, VolumeX, RotateCcw, ChevronDown, ChevronUp, Compass, Smartphone, Monitor, Sword, Shield, Settings } from 'lucide-react';
import { AnimationState } from '../types/game';
import { GuardCommandOptions } from '../game/royalGuards';
import { soundManager } from '../utils/audio';

interface GameHUDProps {
  animState: AnimationState;
  isGrounded: boolean;
  onResetCamera: () => void;
  onOpenStory: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  isWalking: boolean;
  isSwordDrawn: boolean;
  guardOptions: GuardCommandOptions;
  onToggleKneel: () => void;
  onToggleHoldPosition: () => void;
  onToggleProtectFormation: () => void;
  isLandscapeMode: boolean;
  onToggleLandscape: () => void;
  isSittingOnThrone?: boolean;
  onOpenRoyalCommands?: () => void;
  onOpenSettings?: () => void;
  isRidingHorse?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  animState,
  isGrounded,
  onResetCamera,
  onOpenStory,
  onToggleSound,
  isMuted,
  isWalking,
  isSwordDrawn,
  guardOptions,
  onToggleKneel,
  onToggleHoldPosition,
  onToggleProtectFormation,
  isLandscapeMode,
  onToggleLandscape,
  isSittingOnThrone,
  onOpenRoyalCommands,
  onOpenSettings,
  isRidingHorse,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getStatusArabic = () => {
    if (isRidingHorse) return 'فوق صهوة الحصان الملكي 🐎';
    if (isSittingOnThrone) return 'فوق العرش 👑';
    if (animState === 'attack') return 'ضربة سيف ⚔️';
    if (!isGrounded) return 'قفز';
    switch (animState) {
      case 'run':
        return isSwordDrawn ? 'جري بالسيف' : 'جري مسرع';
      case 'walk':
        return isSwordDrawn ? 'مشي متأهب' : 'مشي ملكي';
      case 'jump':
        return 'قفز';
      case 'fall':
        return 'هبوط';
      case 'idle':
      default:
        return isSwordDrawn ? 'سيف مسلول' : 'واقف بهيبة';
    }
  };

  return (
    <>
      {/* Top Bar: Royal Sultan Profile & Consolidated Settings */}
      <div className="absolute top-3 left-3 right-3 sm:right-36 flex items-center justify-between pointer-events-none z-30 select-none gap-2">
        {/* Left Side: Sleek Small Sultan Badge + Prominent Royal Commands Button */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Small Sleek Sultan Badge */}
          <div className="flex items-center gap-1.5 bg-black/85 px-2.5 py-1 rounded-xl border border-amber-500/50 backdrop-blur-md shadow-md text-xs">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shrink-0 shadow-xs">
              <Crown className="w-3 h-3 text-slate-950" />
            </div>
            <span className="font-extrabold text-amber-300 text-xs">سلطان عاشور العاشر</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-stone-300 hidden md:inline">{getStatusArabic()}</span>
            {isRidingHorse && (
              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-400 font-bold">
                حصان ملكي 🐎
              </span>
            )}
            {isSittingOnThrone && (
              <span className="text-[9px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.2 rounded-full border border-yellow-400 font-bold">
                فوق العرش 👑
              </span>
            )}
          </div>

          {/* Prominent Royal Commands Button Slot */}
          {onOpenRoyalCommands && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenRoyalCommands();
              }}
              title="أوامر الحراس الملكية: يركعون · يتوقفون · يحكموك"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-200 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>أوامر الحراس (يركعون · يتوقفون · يحموك)</span>
            </button>
          )}
        </div>

        {/* Consolidated Single Settings Button (⚙️ الإعدادات) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onOpenSettings && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenSettings();
              }}
              title="إعدادات اللعبة والتحكم (حساسية اللمس، مواضع الأزرار، الصوت)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/85 border border-amber-500/50 hover:border-amber-400 text-amber-300 backdrop-blur-md shadow-lg active:scale-95 transition text-xs font-bold"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>الإعدادات</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Gesture Guide Hint (Top Center) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 hidden md:block">
        <div className="bg-black/50 border border-stone-700/60 px-3.5 py-1 rounded-full text-[11px] text-stone-300 backdrop-blur-sm flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>اسحب بإصبعك على يمين الشاشة لتدوير الكاميرا 360° حول السلطان</span>
        </div>
      </div>

      {/* Collapsible Zen/HUD Drawer Button (Bottom Center) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          onClick={() => {
            soundManager.playClick();
            setIsCollapsed(!isCollapsed);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-black/80 border-t border-x border-stone-700 text-stone-300 hover:text-amber-300 text-xs font-semibold backdrop-blur-md"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isCollapsed ? 'إظهار شريط المساعدة' : 'إخفاء'}</span>
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
          <div className="relative w-full max-w-lg bg-stone-950 border-2 border-amber-500/60 rounded-3xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-amber-300">دليل تحكم السلطان عاشور</h3>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowHelp(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-3 bg-stone-900/80 rounded-xl border border-amber-600/50">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                  <Crown className="w-4 h-4" />
                  <span>زر الأوامر الملكية الدائري (قائمة السلطان الموحدة 👑):</span>
                </div>
                <p className="text-stone-300 text-xs mb-2">
                  تم استبدال الأزرار الكبيرة بزر دائري عائم وجميل (👑) على الشاشة، بالضغط عليه تظهر قائمة الأوامر الدائرية وتُنفّذ الأوامر فوراً بنقرة واحدة:
                </p>
                <ul className="space-y-1.5 text-stone-300 text-xs leading-relaxed list-disc list-inside">
                  <li><strong className="text-amber-300">🧎‍♂️ أمر الركوع والإجلال (K):</strong> سجود الحراس بالأرض خافضي الرؤوس إجلالاً للملك.</li>
                  <li><strong className="text-emerald-300">🧍‍♂️ أمر القيام والتأهب:</strong> نهوض الحراس واستعدادهم العسكري الكامل.</li>
                  <li><strong className="text-sky-300">👥 أمر اتباع الملك:</strong> مرافقة الحراس للسلطان يميناً ويساراً في المملكة.</li>
                  <li><strong className="text-rose-400">🛑 أمر حراسة المكان (H):</strong> ثبات الحراس في موقعهم الحالي دون حراك.</li>
                  <li><strong className="text-yellow-400">🛡️ تشكيل حماية الملك (P):</strong> حارس في الأمام وحارس في الخلف وقفل الحركة للدفاع.</li>
                  <li><strong className="text-emerald-400">🚪 أمر فتح الأبواب (O):</strong> فتح بوابات القصر الملكي وزنزانات سجن المملكة.</li>
                  <li><strong className="text-rose-400">🔒 أمر إغلاق الأبواب (C):</strong> إيصاد جميع الأبواب ومنع المرور.</li>
                  <li><strong className="text-purple-300">📍 العودة للمواقع:</strong> رجوع جميع الحراس الملكيين إلى محطاتهم الأصلية.</li>
                </ul>
              </div>

              <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>التحكم بالهاتف وميزات العالم الملكي:</span>
                </div>
                <ul className="space-y-1.5 text-stone-300 text-xs leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">عصا التحكم (اليسار):</strong> تحريك السلطان بسلاسة 360°.</li>
                  <li><strong className="text-amber-300">توجيه العصا المعكوس ⇄:</strong> إمكانية توجيه العصا لليمين ليذهب اللاعب يساراً (مفعّل تلقائياً).</li>
                  <li><strong className="text-sky-300">تحريك وتدوير الشاشة:</strong> اسحب بإصبعك في أي مكان على الشاشة لتدوير الكاميرا 360°.</li>
                  <li><strong className="text-yellow-400">العرش الملكي المصحح 👑:</strong> تم تصحيح اتجاه العرش بالكامل ليكون في مكانه المناسب باتجاه المدخل، ويمكن الجلوس عليه بهيبة (مفتاح T).</li>
                  <li><strong className="text-emerald-400">حارسا الباب وبوابات القصر:</strong> ذكاء اصطناعي مستقل؛ يتحرك الحارسان نحو الباب ويفتحانه للملك وينتظران دخوله ثم يغلقانه ويعودان لموقعهما تلقائياً.</li>
                  <li><strong className="text-purple-400">سجن المملكة وأبواب الغرف:</strong> أبواب حقيقية صلبة ومتحركة مع حارسين مدرعين أمام كل باب يفتحونها ويغلقونها.</li>
                  <li><strong className="text-cyan-300">نظام Collision التام:</strong> منع اختراق المباني والجدران والأعمدة والأبواب المغلقة تماماً.</li>
                  <li><strong className="text-teal-300">الضباب الذكي وبث الموارد:</strong> رؤية واضحة حتى 120م، وضباب تدريجي حتى 250م مع بث ديناميكي يوفر الذاكرة ويحافظ على ثبات FPS.</li>
                </ul>
              </div>

              <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
                <div className="flex items-center gap-2 font-bold text-sky-400 mb-2">
                  <Monitor className="w-4 h-4" />
                  <span>التحكم بالحاسوب (لوحة المفاتيح والماوس):</span>
                </div>
                <ul className="space-y-1.5 text-stone-300 text-xs leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">W / A / S / D أو الأسهم:</strong> التحرك في الاتجاهات مع انزلاق الجدران الواقعي.</li>
                  <li><strong className="text-yellow-400">مفتاح T:</strong> الجلوس فوق العرش / النهوض من العرش.</li>
                  <li><strong className="text-amber-300">مفتاح R:</strong> سحب أو إغماد السيف.</li>
                  <li><strong className="text-rose-400">مفتاح F أو E:</strong> تسديد ضربة سيف قاطعة.</li>
                  <li><strong className="text-amber-300">مفتاح K:</strong> أمر الركوع والسجود للحراس.</li>
                  <li><strong className="text-rose-400">مفتاح H:</strong> أمر ثبات وتوقيف الحراس.</li>
                  <li><strong className="text-sky-400">مفتاح P:</strong> تشكيل حماية الملك.</li>
                  <li><strong className="text-emerald-400">مفتاح O / C:</strong> فتح / إغلاق الأبواب الملكية.</li>
                  <li><strong className="text-white">Shift / Space:</strong> الجري السريع / القفز.</li>
                  <li><strong className="text-white">سحب الماوس وعجلة التمرير:</strong> تدوير وتقريب الكاميرا 360°.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setShowHelp(false);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              فهمت، تابع اللعب
            </button>
          </div>
        </div>
      )}
    </>
  );
};
