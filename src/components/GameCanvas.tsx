import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ControlState, AnimationState } from '../types/game';
import { buildLandscape } from '../game/terrain';
import { createMinecraftSultan, CharacterController } from '../game/minecraftSultan';
import { createRoyalGuards, RoyalGuardsController, GuardCommandOptions } from '../game/royalGuards';
import { buildGrandPalace, PalaceSystem } from '../game/palace';
import { dynamicStreaming } from '../game/dynamicStreaming';
import { lodManager } from '../game/lodManager';
import { collisionSystem } from '../game/collision';

import { gpsSystem } from '../game/gpsSystem';
import { createRoyalHorse, RoyalHorseController } from '../game/royalHorse';

export interface PalaceAction {
  type: 'open_doors' | 'close_doors' | 'kneel' | 'stand' | 'return_posts' | 'toggle_gate';
  timestamp: number;
}

interface GameCanvasProps {
  controls: ControlState;
  onStateUpdate: (state: { animState: AnimationState; isGrounded: boolean }) => void;
  resetCameraTrigger: number;
  cameraDrag: { deltaX: number; deltaY: number; timestamp: number };
  guardOptions: GuardCommandOptions;
  onNearThroneChange?: (isNear: boolean) => void;
  onNearGateChange?: (isNear: boolean) => void;
  onNearHorseChange?: (isNear: boolean) => void;
  mountHorseTrigger?: number;
  onMountHorseStateChange?: (mounted: boolean) => void;
  palaceAction?: PalaceAction | null;
  waypointTarget?: { x: number; z: number; name: string } | null;
  onGpsUpdate?: (status: { active: boolean; distance: number; targetName: string; hasArrived: boolean }) => void;
  onPlayerTransformUpdate?: (pos: { x: number; z: number; angle: number }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  controls,
  onStateUpdate,
  resetCameraTrigger,
  cameraDrag,
  guardOptions,
  onNearThroneChange,
  onNearGateChange,
  onNearHorseChange,
  mountHorseTrigger,
  onMountHorseStateChange,
  palaceAction,
  waypointTarget,
  onGpsUpdate,
  onPlayerTransformUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onNearThroneChangeRef = useRef(onNearThroneChange);
  onNearThroneChangeRef.current = onNearThroneChange;
  const lastNearThroneRef = useRef<boolean>(false);

  const onNearGateChangeRef = useRef(onNearGateChange);
  onNearGateChangeRef.current = onNearGateChange;
  const lastNearGateRef = useRef<boolean>(false);

  const onNearHorseChangeRef = useRef(onNearHorseChange);
  onNearHorseChangeRef.current = onNearHorseChange;
  const lastNearHorseRef = useRef<boolean>(false);

  const onMountHorseStateChangeRef = useRef(onMountHorseStateChange);
  onMountHorseStateChangeRef.current = onMountHorseStateChange;

  const horseRef = useRef<RoyalHorseController | null>(null);
  const characterRef = useRef<CharacterController | null>(null);

  const onGpsUpdateRef = useRef(onGpsUpdate);
  onGpsUpdateRef.current = onGpsUpdate;

  const onPlayerTransformUpdateRef = useRef(onPlayerTransformUpdate);
  onPlayerTransformUpdateRef.current = onPlayerTransformUpdate;

  const palaceRef = useRef<PalaceSystem | null>(null);

  // References for render loop access
  const controlsRef = useRef<ControlState>(controls);
  controlsRef.current = controls;

  const guardOptionsRef = useRef<GuardCommandOptions>(guardOptions);
  guardOptionsRef.current = guardOptions;

  // Camera angles
  const cameraYawRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0.32);
  const cameraDistanceRef = useRef<number>(4.8);

  // Synchronize GPS waypoint destination
  useEffect(() => {
    if (waypointTarget) {
      gpsSystem.setDestination(waypointTarget.x, waypointTarget.z, waypointTarget.name);
    } else {
      gpsSystem.clearDestination();
    }
  }, [waypointTarget]);

  // Mount / Dismount Royal Horse trigger
  const lastProcessedHorseTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (!mountHorseTrigger || !horseRef.current) return;
    if (mountHorseTrigger !== lastProcessedHorseTriggerRef.current) {
      lastProcessedHorseTriggerRef.current = mountHorseTrigger;
      const horse = horseRef.current;
      if (horse.isMounted()) {
        const dismountPos = horse.dismount();
        characterRef.current?.setPosition?.(dismountPos);
        onMountHorseStateChangeRef.current?.(false);
      } else {
        horse.mount();
        onMountHorseStateChangeRef.current?.(true);
      }
    }
  }, [mountHorseTrigger]);

  // Process palace actions (Opening/closing all doors, commanding guards)
  const lastProcessedActionRef = useRef<number>(0);
  useEffect(() => {
    if (!palaceAction || !palaceRef.current) return;
    if (palaceAction.timestamp !== lastProcessedActionRef.current) {
      lastProcessedActionRef.current = palaceAction.timestamp;
      const palace = palaceRef.current;
      switch (palaceAction.type) {
        case 'open_doors':
          palace.openAllDoors();
          break;
        case 'close_doors':
          palace.closeAllDoors();
          break;
        case 'toggle_gate':
          palace.toggleGate();
          break;
        case 'kneel':
          palace.kneelAllPalaceGuards();
          break;
        case 'stand':
          palace.standAllPalaceGuards();
          break;
        case 'return_posts':
          palace.returnAllPalaceGuardsToPosts();
          break;
      }
    }
  }, [palaceAction]);

  // Apply camera drag from props
  const lastProcessedDragRef = useRef<number>(0);
  useEffect(() => {
    if (cameraDrag.timestamp !== lastProcessedDragRef.current) {
      lastProcessedDragRef.current = cameraDrag.timestamp;
      cameraYawRef.current -= cameraDrag.deltaX * 1.5;
      cameraPitchRef.current = Math.max(
        0.08,
        Math.min(1.2, cameraPitchRef.current + cameraDrag.deltaY * 1.2)
      );
    }
  }, [cameraDrag]);

  // Handle camera reset
  useEffect(() => {
    if (resetCameraTrigger > 0) {
      cameraYawRef.current = 0;
      cameraPitchRef.current = 0.32;
      cameraDistanceRef.current = 4.8;
    }
  }, [resetCameraTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa6d8f5);

    // -------------------------------------------------------------
    // 9. SMART DISTANCE FOG (الضباب الذكي المتدرج)
    // 0 to 120m: Crystal clear view
    // 120m: Fog starts fading in
    // 180m: Medium atmospheric fog
    // 220m: Dense fog
    // 250m: Heavy fog fully obscuring distant horizon
    // -------------------------------------------------------------
    scene.fog = new THREE.Fog(0xa6d8f5, 120, 250);

    // Setup Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.2,
      280 // Perfectly matches fog end plane
    );
    camera.position.set(0, 3, 5);

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xdaf2ff, 0x4a7032, 1.1);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(25, 45, 20);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 130;
      const d = 28;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Build Landscape and Grand Palace
    const { getHeight: getTerrainHeight } = buildLandscape(scene);
    const palace = buildGrandPalace(scene);
    palaceRef.current = palace;

    // Initialize Dynamic Streaming System
    dynamicStreaming.init(scene);

    // Initialize GPS navigation beacon and path line
    gpsSystem.init(scene);

    // Composite height calculation
    const getHeight = (x: number, z: number, currentY: number = 0): number => {
      const pHeight = palace.getHeight(x, z, currentY);
      if (pHeight !== null) {
        return pHeight;
      }
      return getTerrainHeight(x, z);
    };

    // Load Characters and Royal Horse
    let characterController: CharacterController | null = null;
    let royalGuards: RoyalGuardsController | null = null;
    let royalHorse: RoyalHorseController | null = null;
    try {
      characterController = createMinecraftSultan(scene);
      characterRef.current = characterController;
      royalGuards = createRoyalGuards(scene);
      royalHorse = createRoyalHorse(scene);
      horseRef.current = royalHorse;
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize characters:', err);
      setLoadError('تعذر تحميل شخصية السلطان والحراس والحصان');
      setLoading(false);
    }

    // Mouse Drag
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      cameraYawRef.current -= dx * 0.006;
      cameraPitchRef.current = Math.max(
        0.08,
        Math.min(1.2, cameraPitchRef.current + dy * 0.005)
      );
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      cameraDistanceRef.current = Math.max(
        2.5,
        Math.min(9.0, cameraDistanceRef.current + e.deltaY * 0.003)
      );
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    const currentCamPos = new THREE.Vector3(0, 3, 5);
    const currentLookTarget = new THREE.Vector3(0, 1.2, 0);

    const updateLoop = () => {
      const delta = clock.getDelta();

      if (characterController) {
        // 0. Update Royal Arabian Horse
        let horseMounted = false;
        let horsePos = characterController.getPosition();
        let horseAngle = characterController.getFacingAngle();
        let horseSpeed = 0;

        if (royalHorse) {
          const horseRes = royalHorse.update(
            delta,
            controlsRef.current,
            cameraYawRef.current,
            getHeight
          );
          horseMounted = horseRes.isMounted;
          horsePos = horseRes.horsePos;
          horseAngle = horseRes.horseAngle;
          horseSpeed = horseRes.speedRatio * 14.0;

          if (horseMounted && characterController.setPosition) {
            // Fix Sultan snugly upon the ornate saddle
            characterController.setPosition(
              new THREE.Vector3(horsePos.x, horsePos.y + 1.28, horsePos.z)
            );
          }

          // Check proximity for mount button
          const isNearHorse = royalHorse.isNear(characterController.getPosition());
          onNearHorseChangeRef.current?.(isNearHorse);
          onMountHorseStateChangeRef.current?.(horseMounted);
        }

        const isProtectionLocked = guardOptionsRef.current.isProtectFormation && !horseMounted;
        const effectiveControls = {
          ...(isProtectionLocked
            ? {
                ...controlsRef.current,
                moveX: 0,
                moveY: 0,
                isRunning: false,
                isJumping: false,
              }
            : controlsRef.current),
          isRidingHorse: horseMounted,
          horsePos: horsePos,
          horseAngle: horseAngle,
          horseSpeedRatio: royalHorse ? royalHorse.getSpeedRatio() : 0,
        };

        characterController.update(
          delta,
          effectiveControls,
          cameraYawRef.current,
          getHeight
        );

        const sultanPos = horseMounted ? horsePos : characterController.getPosition();
        const sultanAngle = horseMounted ? horseAngle : characterController.getFacingAngle();
        const sultanSpeed = horseMounted ? horseSpeed : characterController.getSpeedRatio() * 7.0;
        const sultanState = characterController.getCurrentState();
        const grounded = characterController.isGrounded();

        // 1. Update palace systems (doors, gate sentries, stationed guards)
        palace.update(delta, sultanPos);

        // 1.5 GPS Navigation system update
        const gpsStatus = gpsSystem.update(sultanPos, getHeight);
        onGpsUpdateRef.current?.(gpsStatus);

        // 1.6 Player transform update for MiniMap
        onPlayerTransformUpdateRef.current?.({
          x: sultanPos.x,
          z: sultanPos.z,
          angle: sultanAngle,
        });

        // 1.7 Gate proximity check
        const isNearGate = palace.isNearGate(sultanPos);
        if (isNearGate !== lastNearGateRef.current) {
          lastNearGateRef.current = isNearGate;
          onNearGateChangeRef.current?.(isNearGate);
        }

        // 2. Dynamic Streaming & LOD update
        dynamicStreaming.update(sultanPos);
        lodManager.update(sultanPos);

        // 3. Near throne check
        const isNearThrone = palace.isNearThrone(sultanPos);
        if (isNearThrone !== lastNearThroneRef.current) {
          lastNearThroneRef.current = isNearThrone;
          onNearThroneChangeRef.current?.(isNearThrone);
        }

        // 4. Update escort royal guards (halt when Sultan is mounted on horse)
        if (royalGuards) {
          royalGuards.update(
            delta,
            sultanPos,
            sultanAngle,
            sultanSpeed,
            getHeight,
            controlsRef.current.isAttacking,
            controlsRef.current.isSwordDrawn,
            {
              ...guardOptionsRef.current,
              isHorseMounted: horseMounted,
            }
          );
        }

        // Sync directional light
        dirLight.position.set(sultanPos.x + 25, sultanPos.y + 45, sultanPos.z + 20);
        dirLight.target.position.set(sultanPos.x, sultanPos.y, sultanPos.z);
        dirLight.target.updateMatrixWorld();

        // Third-person camera calculations
        const targetLookAt = new THREE.Vector3(
          sultanPos.x,
          sultanPos.y + (horseMounted ? 1.6 : 1.25),
          sultanPos.z
        );

        const dist = cameraDistanceRef.current + (horseMounted ? 0.8 : 0);
        const pitch = cameraPitchRef.current;
        const yaw = cameraYawRef.current;

        const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
        const offsetY = Math.sin(pitch) * dist;
        const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;

        const desiredCamPos = new THREE.Vector3(
          targetLookAt.x - offsetX,
          targetLookAt.y + offsetY,
          targetLookAt.z - offsetZ
        );

        // Keep camera above ground
        const camGroundY = getHeight(desiredCamPos.x, desiredCamPos.z, desiredCamPos.y) + 0.35;
        if (desiredCamPos.y < camGroundY) {
          desiredCamPos.y = camGroundY;
        }

        currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, desiredCamPos.x, 14, delta);
        currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, desiredCamPos.y, 14, delta);
        currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, desiredCamPos.z, 14, delta);

        currentLookTarget.x = THREE.MathUtils.damp(currentLookTarget.x, targetLookAt.x, 14, delta);
        currentLookTarget.y = THREE.MathUtils.damp(currentLookTarget.y, targetLookAt.y, 14, delta);
        currentLookTarget.z = THREE.MathUtils.damp(currentLookTarget.z, targetLookAt.z, 14, delta);

        camera.position.copy(currentCamPos);
        camera.lookAt(currentLookTarget);

        onStateUpdate({
          animState: sultanState,
          isGrounded: grounded,
        });
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(updateLoop);
    };

    frameId = requestAnimationFrame(updateLoop);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      dynamicStreaming.dispose();
      gpsSystem.dispose();
      lodManager.clear();
      collisionSystem.clear();
      if (royalHorse) {
        royalHorse.dispose();
      }
      if (royalGuards) {
        royalGuards.dispose();
      }
      if (domEl.parentNode) {
        domEl.parentNode.removeChild(domEl);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {loading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 text-white backdrop-blur-md">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-amber-300">جاري إعداد المملكة العاشورية 3D...</h2>
          <p className="text-xs text-stone-400 mt-2">تحميل القلعة الملكية ثلاثية الأبعاد والبث الديناميكي والحصان العربي والحراس</p>
        </div>
      )}

      {loadError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-red-950/90 border border-red-500/60 p-6 rounded-2xl text-center">
          <p className="text-red-200 font-bold mb-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold text-xs"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
};
