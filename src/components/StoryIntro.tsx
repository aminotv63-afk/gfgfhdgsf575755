import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Crown, Sparkles, Volume2, VolumeX, Shield, Scroll } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface StoryIntroProps {
  onComplete: () => void;
}

const STORY_SCENES = [
  {
    id: 1,
    title: 'المملكة العاشورية',
    subtitle: 'في قديم الزمان وعصر السلاطين',
    badge: 'المشهد الأول',
    icon: Crown,
    text: 'في قديم الزمان وفي المملكة العاشورية كان السلطان بوعلام التاسع على فراش الموت، وكان عندو زوج أولاد: الأمير كمال والأمير عاشور.',
    highlight: 'الأمير كمال والأمير عاشور',
  },
  {
    id: 2,
    title: 'وصية السلطان',
    subtitle: 'سيف العرش الملكي',
    badge: 'المشهد الثاني',
    icon: Shield,
    text: 'قبل ما يموت مولاي بوعلام التاسع، أمر الحراس يجيبولو سيف السلطان باش يعيّن شكون يخلفو في الحكم.',
    highlight: 'سيف السلطان واختيار الخليفة',
  },
  {
    id: 3,
    title: 'دهاء الوزير قنديل',
    subtitle: 'مؤامرة في أروقة القصر',
    badge: 'المشهد الثالث',
    icon: Scroll,
    text: 'وكان الأمير كمال هو الأحق بالعرش، لكن الوزير قنديل كان عندو رأي آخر، لأنه كان يعرف بلي كمال ما يخضعش لأوامرو وما يقدرش يتحكم فيه.',
    highlight: 'الوزير قنديل يخطط في الخفاء',
  },
  {
    id: 4,
    title: 'مراسم التتويج',
    subtitle: 'سلطان جديد على العرش',
    badge: 'المشهد الرابع',
    icon: Crown,
    text: 'وبعد وفاة السلطان بوعلام التاسع، قام الوزير قنديل بتتويج الأمير عاشور سلطان على المملكة وسط دهشة الجميع.',
    highlight: 'تتويج الأمير عاشور سلطاناً',
  },
  {
    id: 5,
    title: 'غضب الأمير كمال',
    subtitle: 'رحيل نحو المجهول',
    badge: 'المشهد الخامس',
    icon: Shield,
    text: 'الأمير كمال ما تقبلش القرار وحس بلي حقو تسرق منو، فقرر يهجر المملكة ويخرج منها، ومن ذاك النهار ما شافوه حتى واحد.',
    highlight: 'هجرة الأمير كمال واختفاؤه',
  },
  {
    id: 6,
    title: 'السلطان عاشور العاشر',
    subtitle: 'عهد جديد في تاريخ المملكة',
    badge: 'المشهد السادس',
    icon: Crown,
    text: 'أما الأمير عاشور فتولى الحكم وأصبح يعرف باسم السلطان عاشور العاشر، وتحولت المملكة رسمياً إلى المملكة العاشورية العظيمة.',
    highlight: 'عاشور العاشر يحكم المملكة',
  },
  {
    id: 7,
    title: 'سنوات الحكم والغموض',
    subtitle: 'المصير المعلق',
    badge: 'المشهد السابع',
    icon: Scroll,
    text: 'ومع مرور السنين بقى عاشور يحكم المملكة بمساعدة الوزير قنديل، بينما ظل مصير الأمير كمال مجهولاً وغامضاً في الأراضي البعيدة.',
    highlight: 'مصير مجهول للأمير كمال',
  },
  {
    id: 8,
    title: 'انطلاق المغامرة',
    subtitle: 'عالم المملكة المفتوح',
    badge: 'المشهد الأخير',
    icon: Sparkles,
    text: 'وهنا تبدأ حكاية السلطان عاشور العاشر! تفضل يا مولاي السلطان، تجول في أراضي المملكة واستعد لرحلتك العظيمة.',
    highlight: 'هنا تبدأ الحكاية...',
  },
];

export const StoryIntro: React.FC<StoryIntroProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [muted, setMuted] = useState(soundManager.getMuted());
  const scene = STORY_SCENES[currentIdx];
  const isLast = currentIdx === STORY_SCENES.length - 1;

  useEffect(() => {
    soundManager.playStoryChime(currentIdx);
  }, [currentIdx]);

  const handleNext = () => {
    soundManager.playClick();
    if (isLast) {
      onComplete();
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    soundManager.playClick();
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    soundManager.playClick();
    onComplete();
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    soundManager.setMuted(nextMuted);
    setMuted(nextMuted);
  };

  const SceneIcon = scene.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-radial from-slate-950 via-black to-black p-4 text-white overflow-hidden select-none">
      {/* Background ambient royal ornamentation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-amber-500/30 blur-sm" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-amber-600/20 rotate-45" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-emerald-500/20" />
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-md">
          <Crown className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-amber-300 text-sm tracking-wide">المملكة العاشورية</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className="p-2.5 rounded-full bg-black/60 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-400 transition"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleSkip}
            className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-semibold text-xs transition"
          >
            تخطي القصة والبدء فوراً
          </button>
        </div>
      </div>

      {/* Main Cinematic Scroll Card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900/90 via-slate-950/95 to-black/95 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/40 backdrop-blur-xl flex flex-col justify-between min-h-[460px]">
        {/* Ornate Golden Corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br" />

        {/* Top Scene Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-3 py-1 rounded-full font-medium">
            <SceneIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>{scene.badge}</span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {currentIdx + 1} / {STORY_SCENES.length}
          </div>
        </div>

        {/* Middle Visual & Text Content */}
        <div className="my-auto text-center space-y-4 py-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-amber-400/20 border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-2">
            <SceneIcon className="w-8 h-8 text-amber-300" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100">
              {scene.title}
            </h2>
            <p className="text-xs sm:text-sm text-amber-400/80 font-medium">
              {scene.subtitle}
            </p>
          </div>

          {/* Story Narrative Paragraph */}
          <div className="p-4 sm:p-6 bg-black/40 rounded-2xl border border-stone-800">
            <p className="text-base sm:text-xl leading-relaxed sm:leading-loose text-stone-200 amiri-font font-semibold">
              {scene.text}
            </p>
          </div>
        </div>

        {/* Bottom Progression & Action Controls */}
        <div className="pt-4 border-t border-stone-800/80 flex flex-col gap-4">
          {/* Progress dots */}
          <div className="flex justify-center items-center gap-2">
            {STORY_SCENES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  soundManager.playClick();
                  setCurrentIdx(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? 'w-7 bg-amber-400'
                    : i < currentIdx
                    ? 'w-2 bg-amber-600/60'
                    : 'w-2 bg-stone-700'
                }`}
                aria-label={`المشهد ${i + 1}`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                currentIdx === 0
                  ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-500'
                  : 'border-stone-700 bg-stone-900/60 text-stone-300 hover:border-amber-500 hover:text-amber-300 active:scale-95'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={handleNext}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-base transition-all shadow-lg active:scale-98 ${
                isLast
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30 hover:brightness-110'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200'
              }`}
            >
              <span>{isLast ? 'دخول المملكة وبدء اللعب' : 'المشهد التالي'}</span>
              {isLast ? <Play className="w-4 h-4 fill-current" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
