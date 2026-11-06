import { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas, PalaceAction } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { StoryIntro } from './components/StoryIntro';
import { GameHUD } from './components/GameHUD';
import { MiniMap } from './components/MiniMap';
import { SettingsModal, GameSettingsState } from './components/SettingsModal';
import { ControlState, AnimationState } from './types/game';
import { GuardCommandOptions } from './game/royalGuards';
import { RoyalCommandType } from './components/RoyalCommandMenu';
import { soundManager } from './utils/audio';

export default function App() {
  const [showStory, setShowStory] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [resetCameraCount, setResetCameraCount] = useState(0);
  const [cameraDrag, setCameraDrag] = useState<{ deltaX: number; deltaY: number; timestamp: number }>({
    deltaX: 0,
    deltaY: 0,
    timestamp: 0,
  });

  const [gameState, setGameState] = useState<{
    animState: AnimationState;
    isGrounded: boolean;
  }>({
    animState: 'idle',
    isGrounded: true,
  });

  const [isSwordDrawn, setIsSwordDrawn] = useState(false);

  // Settings State (Modal with sensitivity, handedness, joystick invert, reset, audio)
  const [settings, setSettings] = useState<GameSettingsState>({
    touchSensitivity: 1.0,
    isLeftHanded: false,
    buttonSize: 'normal',
    invertJoystickX: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Mountable Royal Arabian Horse State
  const [isNearHorse, setIsNearHorse] = useState<boolean>(false);
  const [isRidingHorse, setIsRidingHorse] = useState<boolean>(false);
  const [mountHorseTrigger, setMountHorseTrigger] = useState<number>(0);

  const [guardOptions, setGuardOptions] = useState<GuardCommandOptions>({
    isKneeling: false,
    isHoldPosition: false,
    isProtectFormation: false,
  });
  const [guardNotice, setGuardNotice] = useState<string | null>(null);

  // Palace Doors and Stationed Guards Action trigger
  const [palaceAction, setPalaceAction] = useState<PalaceAction | null>(null);

  // Throne interaction states
  const [isNearThrone, setIsNearThrone] = useState<boolean>(false);
  const [isSittingOnThrone, setIsSittingOnThrone] = useState<boolean>(false);

  // Gate interaction state
  const [isNearGate, setIsNearGate] = useState<boolean>(false);

  // Royal Commands Modal State
  const [isCommandsMenuOpen, setIsCommandsMenuOpen] = useState<boolean>(false);

  // Interactive Mini-Map & GPS Waypoint State
  const [waypointTarget, setWaypointTarget] = useState<{ x: number; z: number; name: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{
    active: boolean;
    distance: number;
    targetName: string;
    hasArrived: boolean;
  } | null>(null);
  const [playerTransform, setPlayerTransform] = useState<{ x: number; z: number; angle: number }>({
    x: 0,
    z: 0,
    angle: 0,
  });

  // Landscape mode
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);

  const showGuardNotice = (msg: string) => {
    setGuardNotice(msg);
    setTimeout(() => {
      setGuardNotice((cur) => (cur === msg ? null : cur));
    }, 3400);
  };

  // Central Royal Command Dispatcher (Handles all Sultan Commands)
  const handleExecuteRoyalCommand = useCallback((command: RoyalCommandType) => {
    switch (command) {
      case 'kneel':
        setGuardOptions({
          isKneeling: true,
          isHoldPosition: false,
          isProtectFormation: false,
        });
        setPalaceAction({ type: 'kneel', timestamp: Date.now() });
        soundManager.playGuardBow();
        showGuardNotice('🧎‍♂️ أمر ملكي: ركوع وسجود جميع الحراس بالأرض خافضي الرؤوس إجلالاً للسلطان');
        break;

      case 'stand':
        setGuardOptions({
          isKneeling: false,
          isHoldPosition: false,
          isProtectFormation: false,
        });
        setPalaceAction({ type: 'stand', timestamp: Date.now() });
        soundManager.playClick();
        showGuardNotice('🧍‍♂️ أمر ملكي: قيام الحراس وتأهبهم العسكري بكامل الانضباط والوقار');
        break;

      case 'follow':
        setGuardOptions({
          isKneeling: false,
          isHoldPosition: false,
          isProtectFormation: false,
        });
        soundManager.playClick();
        showGuardNotice('👥 أمر ملكي: استئناف الحراس لمرافقة السلطان وحمايته في المملكة');
        break;

      case 'guard_spot':
        setGuardOptions({
          isKneeling: false,
          isHoldPosition: true,
          isProtectFormation: false,
        });
        soundManager.playGuardHalt();
        showGuardNotice('🛑 أمر ملكي: ثبات الحراس وتوقيفهم في المكان الحالي لحراسة الموقع');
        break;

      case 'protect':
        setGuardOptions({
          isKneeling: false,
          isHoldPosition: false,
          isProtectFormation: true,
        });
        soundManager.playGuardProtect();
        showGuardNotice('🛡️ أمر ملكي: تشكيل حماية الملك! حارس في الأمام وحارس في الخلف وقفل الحركة للدفاع');
        break;

      case 'open_doors':
        setPalaceAction({ type: 'open_doors', timestamp: Date.now() });
        soundManager.playGateOpen();
        showGuardNotice('🚪 أمر ملكي: فتح بوابات القصر الملكي وزنزانات سجن المملكة العاشورية');
        break;

      case 'close_doors':
        setPalaceAction({ type: 'close_doors', timestamp: Date.now() });
        soundManager.playClick();
        showGuardNotice('🔒 أمر ملكي: إيصاد جميع الأبواب الملكية وإحكام إغلاقها');
        break;

      case 'return_posts':
        setGuardOptions({
          isKneeling: false,
          isHoldPosition: false,
          isProtectFormation: false,
        });
        setPalaceAction({ type: 'return_posts', timestamp: Date.now() });
        soundManager.playClick();
        showGuardNotice('📍 أمر ملكي: عودة جميع الحراس الملكيين فوراً إلى مواقعهم الأصلية');
        break;
    }
  }, []);

  // Compute text for status indicator
  const getCurrentStatusText = () => {
    if (isRidingHorse) return 'فوق صهوة الحصان العربي الأصيل 🐎';
    if (guardOptions.isKneeling) return 'الحراس في حالة سجود وركوع 🧎‍♂️';
    if (guardOptions.isProtectFormation) return 'تشكيل حماية الملك مفعّل 🛡️';
    if (guardOptions.isHoldPosition) return 'الحراس ثابتون في الموقع 🛑';
    return 'مرافقة السلطان عاشور العاشر 👥';
  };

  const controlsRef = useRef<ControlState>({
    moveX: 0,
    moveY: 0,
    isWalking: false,
    isRunning: false,
    isJumping: false,
    cameraRotateX: 0,
    cameraRotateY: 0,
    isSwordDrawn: false,
    isAttacking: false,
  });

  const [controls, setControls] = useState<ControlState>(controlsRef.current);

  const handleControlChange = useCallback((updated: Partial<ControlState>) => {
    // If Sultan is seated on throne and player steers joystick, stand up smoothly
    if (controlsRef.current.isSittingOnThrone && updated.moveX !== undefined && updated.moveY !== undefined) {
      if (Math.hypot(updated.moveX, updated.moveY) > 0.35) {
        controlsRef.current.isSittingOnThrone = false;
        setIsSittingOnThrone(false);
        showGuardNotice('👑 نهض السلطان عاشور العاشر من العرش الملكي');
      }
    }

    controlsRef.current = {
      ...controlsRef.current,
      ...updated,
    };
    if (updated.isSwordDrawn !== undefined) {
      setIsSwordDrawn(updated.isSwordDrawn);
    }
    setControls({ ...controlsRef.current });
  }, []);

  const handleToggleSword = useCallback(() => {
    setIsSwordDrawn((prev) => {
      const next = !prev;
      controlsRef.current.isSwordDrawn = next;
      setControls({ ...controlsRef.current });
      return next;
    });
  }, []);

  const handleAttack = useCallback(() => {
    controlsRef.current.isSwordDrawn = true;
    controlsRef.current.isAttacking = true;
    setIsSwordDrawn(true);
    setControls({ ...controlsRef.current });

    setTimeout(() => {
      controlsRef.current.isAttacking = false;
      setControls({ ...controlsRef.current });
    }, 120);
  }, []);

  const handleToggleWalk = useCallback(() => {
    soundManager.playClick();
    setIsWalking((prev) => {
      const next = !prev;
      controlsRef.current.isWalking = next;
      setControls({ ...controlsRef.current });
      return next;
    });
  }, []);

  const handleCameraDrag = useCallback((deltaX: number, deltaY: number) => {
    setCameraDrag({
      deltaX,
      deltaY,
      timestamp: Date.now(),
    });
  }, []);

  const handleResetCamera = useCallback(() => {
    setResetCameraCount((c) => c + 1);
  }, []);

  const handleToggleInvertJoystickX = useCallback(() => {
    soundManager.playClick();
    setSettings((prev) => {
      const next = !prev.invertJoystickX;
      showGuardNotice(
        next
          ? '⇄ تم تفعيل توجيه العصا المعكوس: اليمين = يسار'
          : '⇄ تم تفعيل توجيه العصا العادي: اليمين = يمين'
      );
      return { ...prev, invertJoystickX: next };
    });
  }, []);

  const handleToggleMountHorse = useCallback(() => {
    setMountHorseTrigger(Date.now());
  }, []);

  const handleToggleSitOnThrone = useCallback(() => {
    setIsSittingOnThrone((prev) => {
      const next = !prev;
      controlsRef.current.isSittingOnThrone = next;
      setControls({ ...controlsRef.current });
      if (next) {
        soundManager.playThroneSit();
        showGuardNotice('👑 جلس السلطان عاشور العاشر بهيبة ووقار فوق العرش الملكي ناظراً للمملكة!');
      } else {
        soundManager.playClick();
        showGuardNotice('👑 نهض السلطان من العرش لاستكمال جولته الملكية');
      }
      return next;
    });
  }, []);

  const handleToggleLandscape = useCallback(() => {
    soundManager.playClick();
    setIsLandscapeMode((prev) => {
      const next = !prev;
      if (next) {
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch {
          // Ignore
        }
        showGuardNotice('🔄 تم تفعيل وضع الشاشة الأفقية (Landscape Mode)');
      } else {
        try {
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {
          // Ignore
        }
        showGuardNotice('📱 العودة للوضع الرأسي');
      }
      return next;
    });
  }, []);

  const handleStoryComplete = useCallback(() => {
    setShowStory(false);
    soundManager.startRoyalAmbience();
  }, []);

  const handleOpenStory = useCallback(() => {
    setShowStory(true);
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  // Keyboard controls listener
  useEffect(() => {
    const keysDown: { [key: string]: boolean } = {};

    const syncLocomotion = () => {
      let mx = 0;
      let my = 0;
      if (keysDown['KeyW'] || keysDown['ArrowUp']) my += 1;
      if (keysDown['KeyS'] || keysDown['ArrowDown']) my -= 1;
      if (keysDown['KeyA'] || keysDown['ArrowLeft']) mx -= 1;
      if (keysDown['KeyD'] || keysDown['ArrowRight']) mx += 1;

      const isSprinting = !!keysDown['ShiftLeft'] || !!keysDown['ShiftRight'];
      const isJumping = !!keysDown['Space'];

      handleControlChange({
        moveX: mx,
        moveY: my,
        isRunning: isSprinting,
        isJumping,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysDown[e.code] = true;

      if (e.code === 'KeyT') {
        if (isNearThrone) {
          handleToggleSitOnThrone();
        }
      } else if (e.code === 'KeyJ' || e.code === 'KeyM') {
        handleToggleMountHorse();
      } else if (e.code === 'KeyR') {
        handleToggleSword();
      } else if (e.code === 'KeyF' || e.code === 'KeyE') {
        handleAttack();
      } else if (e.code === 'KeyK') {
        handleExecuteRoyalCommand('kneel');
      } else if (e.code === 'KeyH') {
        handleExecuteRoyalCommand('guard_spot');
      } else if (e.code === 'KeyP') {
        handleExecuteRoyalCommand('protect');
      } else if (e.code === 'KeyO') {
        handleExecuteRoyalCommand('open_doors');
      } else if (e.code === 'KeyC') {
        handleExecuteRoyalCommand('close_doors');
      }

      syncLocomotion();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown[e.code] = false;
      syncLocomotion();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleControlChange, handleToggleSitOnThrone, handleToggleMountHorse, handleToggleSword, handleAttack, handleExecuteRoyalCommand, isNearThrone]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black select-none touch-none ${isLandscapeMode ? 'w-screen h-screen' : ''}`}>
      {/* 3D Game Canvas */}
      <GameCanvas
        controls={controls}
        onStateUpdate={setGameState}
        resetCameraTrigger={resetCameraCount}
        cameraDrag={cameraDrag}
        guardOptions={guardOptions}
        onNearThroneChange={setIsNearThrone}
        onNearGateChange={setIsNearGate}
        palaceAction={palaceAction}
        waypointTarget={waypointTarget}
        onGpsUpdate={setGpsStatus}
        onPlayerTransformUpdate={setPlayerTransform}
        onNearHorseChange={setIsNearHorse}
        mountHorseTrigger={mountHorseTrigger}
        onMountHorseStateChange={setIsRidingHorse}
      />

      {/* Royal Order Toast Notification */}
      {guardNotice && (
        <div className="absolute top-20 inset-x-4 max-w-xl mx-auto z-40 pointer-events-none flex justify-center animate-bounce">
          <div className="bg-stone-950/95 border-2 border-amber-400 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm font-black flex items-center gap-2 text-center">
            <span>{guardNotice}</span>
          </div>
        </div>
      )}

      {/* Touch & Joystick Controls + MiniMap + HUD Overlay */}
      {!showStory && (
        <>
          <TouchControls
            onControlChange={handleControlChange}
            onCameraDrag={handleCameraDrag}
            onResetCamera={handleResetCamera}
            isWalking={isWalking}
            onToggleWalk={handleToggleWalk}
            isSwordDrawn={isSwordDrawn}
            onToggleSword={handleToggleSword}
            onAttack={handleAttack}
            guardOptions={guardOptions}
            onExecuteRoyalCommand={handleExecuteRoyalCommand}
            currentStatusText={getCurrentStatusText()}
            invertJoystickX={settings.invertJoystickX}
            onToggleInvertJoystickX={handleToggleInvertJoystickX}
            isNearThrone={isNearThrone}
            isSittingOnThrone={isSittingOnThrone}
            onToggleSitOnThrone={handleToggleSitOnThrone}
            isNearGate={isNearGate}
            onToggleGate={() => {
              setPalaceAction({ type: 'toggle_gate', timestamp: Date.now() });
              showGuardNotice('🚪 أمر ملكي: تحريك بوابات القصر للملك');
            }}
            isLandscapeMode={isLandscapeMode}
            onToggleLandscape={handleToggleLandscape}
            isCommandsMenuOpen={isCommandsMenuOpen}
            onToggleCommandsMenu={setIsCommandsMenuOpen}
            touchSensitivity={settings.touchSensitivity}
            isLeftHanded={settings.isLeftHanded}
            isNearHorse={isNearHorse}
            isRidingHorse={isRidingHorse}
            onToggleMountHorse={handleToggleMountHorse}
          />

          <MiniMap
            playerPos={{ x: playerTransform.x, z: playerTransform.z }}
            playerAngle={playerTransform.angle}
            gpsTarget={gpsStatus}
            onSetWaypoint={(x, z, name) => {
              setWaypointTarget({ x, z, name });
              showGuardNotice(`📍 تم تعيين خط GPS للوصول إلى: ${name}`);
            }}
            onClearWaypoint={() => {
              setWaypointTarget(null);
              showGuardNotice('✕ تم إلغاء مسار GPS');
            }}
          />

          <GameHUD
            animState={gameState.animState}
            isGrounded={gameState.isGrounded}
            onResetCamera={handleResetCamera}
            onOpenStory={handleOpenStory}
            onToggleSound={handleToggleSound}
            isMuted={isMuted}
            isWalking={isWalking}
            isSwordDrawn={isSwordDrawn}
            guardOptions={guardOptions}
            onToggleKneel={() => handleExecuteRoyalCommand(guardOptions.isKneeling ? 'stand' : 'kneel')}
            onToggleHoldPosition={() => handleExecuteRoyalCommand(guardOptions.isHoldPosition ? 'follow' : 'guard_spot')}
            onToggleProtectFormation={() => handleExecuteRoyalCommand(guardOptions.isProtectFormation ? 'follow' : 'protect')}
            isLandscapeMode={isLandscapeMode}
            onToggleLandscape={handleToggleLandscape}
            isSittingOnThrone={isSittingOnThrone}
            onOpenRoyalCommands={() => setIsCommandsMenuOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isRidingHorse={isRidingHorse}
          />

          {/* Consolidated Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onResetCamera={handleResetCamera}
            isLandscapeMode={isLandscapeMode}
            onToggleLandscape={handleToggleLandscape}
            onOpenStory={handleOpenStory}
          />
        </>
      )}

      {/* Cinematic Story Sequence */}
      {showStory && <StoryIntro onComplete={handleStoryComplete} />}
    </div>
  );
}
