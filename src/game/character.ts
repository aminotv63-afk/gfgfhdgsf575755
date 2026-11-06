import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ControlState, AnimationState } from '../types/game';
import { soundManager } from '../utils/audio';

export interface CharacterController {
  model: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  update: (delta: number, controls: ControlState, cameraYaw: number, getHeight: (x: number, z: number) => number) => void;
  getPosition: () => THREE.Vector3;
  getFacingAngle: () => number;
  getCurrentState: () => AnimationState;
  getSpeedRatio: () => number; // 0 to 1
  isGrounded: () => boolean;
}

export async function loadCharacter(scene: THREE.Scene): Promise<CharacterController> {
  const loader = new GLTFLoader();

  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load(
      '/models/king-rigged.glb',
      (data) => resolve(data),
      undefined,
      (err) => reject(err)
    );
  });

  const model = gltf.scene as THREE.Group;
  model.scale.set(1.0, 1.0, 1.0);
  model.position.set(0, 0, 0);

  // 1. Sanitize geometry: eliminate all degenerate triangles and origin spikes
  model.traverse((child) => {
    const isMesh = (child as THREE.Mesh).isMesh;
    const isSkinned = (child as THREE.SkinnedMesh).isSkinnedMesh;

    if (isMesh || isSkinned) {
      const mesh = child as THREE.Mesh | THREE.SkinnedMesh;

      if (mesh.geometry && mesh.geometry.index) {
        const pos = mesh.geometry.attributes.position;
        const oldIndices = mesh.geometry.index.array;
        const cleanIndices: number[] = [];

        for (let i = 0; i < oldIndices.length; i += 3) {
          const a = oldIndices[i];
          const b = oldIndices[i + 1];
          const c = oldIndices[i + 2];

          // Skip degenerate faces
          if (a === b || b === c || a === c) continue;

          // Check if any vertex is collapsed at origin
          const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
          const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
          const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);

          const isZeroA = (Math.abs(ax) < 0.001 && Math.abs(ay) < 0.001 && Math.abs(az) < 0.001);
          const isZeroB = (Math.abs(bx) < 0.001 && Math.abs(by) < 0.001 && Math.abs(bz) < 0.001);
          const isZeroC = (Math.abs(cx) < 0.001 && Math.abs(cy) < 0.001 && Math.abs(cz) < 0.001);

          if (!isZeroA && !isZeroB && !isZeroC) {
            cleanIndices.push(a, b, c);
          }
        }

        // Apply clean index buffer
        mesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(cleanIndices), 1));
      }

      // Keep parts visible at all camera angles
      child.frustumCulled = false;
      child.castShadow = false;
      child.receiveShadow = true;

      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          mat.side = THREE.DoubleSide;
          mat.depthWrite = true;
          if ('roughness' in mat) {
            (mat as THREE.MeshStandardMaterial).roughness = 0.6;
          }
        });
      }
    }
  });

  // Soft contact shadow disc under Sultan's feet
  const shadowGeo = new THREE.PlaneGeometry(1.3, 1.3);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 62);
  sGrad.addColorStop(0, 'rgba(12, 28, 12, 0.7)');
  sGrad.addColorStop(0.5, 'rgba(15, 30, 15, 0.35)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.renderOrder = 2;
  scene.add(shadowMesh);

  // 2. Animation Mixer & Dedicated Idle Action
  // CRITICAL FIX: We MUST have a dedicated Idle Action so that total animation weight is NEVER 0.
  // In Three.js, when all weights sum to 0, AnimationMixer collapses bone transforms to (0,0,0),
  // which caused the character to crack and collapse!
  const mixer = new THREE.AnimationMixer(model);
  const animations = gltf.animations as THREE.AnimationClip[];

  let walkClip: THREE.AnimationClip | null = null;
  let runClip: THREE.AnimationClip | null = null;

  animations.forEach((clip) => {
    const name = clip.name.toLowerCase();
    if (name.includes('walk')) walkClip = clip;
    else if (name.includes('run')) runClip = clip;
  });

  // Generate a dedicated standing idle clip from the rest frame of walkClip
  let idleAction: THREE.AnimationAction | null = null;
  let walkAction: THREE.AnimationAction | null = null;
  let runAction: THREE.AnimationAction | null = null;

  if (walkClip) {
    const sourceClip = walkClip as THREE.AnimationClip;
    const idleTracks = sourceClip.tracks.map((track) => {
      const itemSize = track.getValueSize();
      const firstVal = Array.from(track.values.slice(0, itemSize));
      // Two stable keyframes at 0s and 2s keeping the noble standing posture
      return new (track.constructor as any)(track.name, [0, 2.0], [...firstVal, ...firstVal]);
    });

    const idleClip = new THREE.AnimationClip('idle', 2.0, idleTracks);
    idleAction = mixer.clipAction(idleClip);
    idleAction.setEffectiveWeight(1.0); // Full weight when standing still!
    idleAction.play();

    walkAction = mixer.clipAction(walkClip);
    walkAction.setEffectiveTimeScale(1.15);
    walkAction.setEffectiveWeight(0.0);
    walkAction.play();
  }

  if (runClip) {
    runAction = mixer.clipAction(runClip);
    runAction.setEffectiveTimeScale(1.1);
    runAction.setEffectiveWeight(0.0);
    runAction.play();
  }

  scene.add(model);

  // Kinematics and Movement State
  const SOLE_OFFSET = 0.04;
  const position = new THREE.Vector3(0, SOLE_OFFSET, 0);
  let velocityY = 0;
  let currentAngle = 0;
  let targetAngle = 0;
  let currentState: AnimationState = 'idle';
  let grounded = true;
  let distanceSinceFootstep = 0;

  // Speeds & Physics
  const WALK_SPEED = 3.2;
  const RUN_SPEED = 7.0;
  const JUMP_FORCE = 7.2;
  const GRAVITY = 21.0;
  const ROTATION_SMOOTHING = 12.0;

  const update = (
    delta: number,
    controls: ControlState,
    cameraYaw: number,
    getHeight: (x: number, z: number) => number
  ) => {
    const clampedDelta = Math.min(delta, 0.08);

    // 1. Calculate input vector
    const inputX = controls.moveX;
    const inputZ = controls.moveY;
    const inputMagnitude = Math.hypot(inputX, inputZ);

    const isMoving = inputMagnitude > 0.08;
    const isSprinting = isMoving && (controls.isRunning || (!controls.isWalking && inputMagnitude > 0.8));

    // Desired move direction relative to camera yaw
    let moveDirX = 0;
    let moveDirZ = 0;

    if (isMoving) {
      const normX = inputX / (inputMagnitude || 1);
      const normZ = inputZ / (inputMagnitude || 1);

      const forwardX = Math.sin(cameraYaw);
      const forwardZ = Math.cos(cameraYaw);
      const rightX = Math.sin(cameraYaw + Math.PI / 2);
      const rightZ = Math.cos(cameraYaw + Math.PI / 2);

      moveDirX = (rightX * normX + forwardX * normZ);
      moveDirZ = (rightZ * normX + forwardZ * normZ);

      targetAngle = Math.atan2(moveDirX, moveDirZ);
    }

    // Smooth character rotation toward target angle
    let angleDiff = targetAngle - currentAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentAngle += angleDiff * Math.min(1, ROTATION_SMOOTHING * clampedDelta);
    model.rotation.y = currentAngle;

    // Movement speed
    const baseSpeed = isSprinting ? RUN_SPEED : WALK_SPEED;
    const currentSpeed = isMoving ? baseSpeed * Math.min(1, inputMagnitude) : 0;

    // Apply horizontal translation
    if (isMoving) {
      position.x += moveDirX * currentSpeed * clampedDelta;
      position.z += moveDirZ * currentSpeed * clampedDelta;
    }

    // Boundary limit (keep inside playable meadow ~95m radius)
    const distFromCenter = Math.hypot(position.x, position.z);
    if (distFromCenter > 95) {
      position.x = (position.x / distFromCenter) * 95;
      position.z = (position.z / distFromCenter) * 95;
    }

    // Ground Snapping & Physics
    const rawGroundHeight = getHeight(position.x, position.z);
    const targetGroundY = rawGroundHeight + SOLE_OFFSET;

    if (controls.isJumping && grounded) {
      velocityY = JUMP_FORCE;
      grounded = false;
      currentState = 'jump';
      soundManager.playJump();
    }

    if (!grounded) {
      velocityY -= GRAVITY * clampedDelta;
      position.y += velocityY * clampedDelta;

      if (position.y <= targetGroundY) {
        position.y = targetGroundY;
        velocityY = 0;
        grounded = true;
        currentState = isMoving ? (isSprinting ? 'run' : 'walk') : 'idle';
        soundManager.playLand();
      } else {
        currentState = velocityY > 0 ? 'jump' : 'fall';
      }
    } else {
      if (position.y < targetGroundY) {
        position.y = targetGroundY;
      } else {
        position.y = THREE.MathUtils.damp(position.y, targetGroundY, 28, clampedDelta);
      }
    }

    model.position.copy(position);

    // Update shadow disc
    shadowMesh.position.set(position.x, rawGroundHeight + 0.03, position.z);
    const airOffset = Math.max(0, position.y - targetGroundY);
    const shadowOpacity = Math.max(0.12, 0.75 - airOffset * 0.35);
    (shadowMesh.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
    const shadowScale = Math.max(0.6, 1.0 - airOffset * 0.15);
    shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);

    // Animation State Controller
    if (grounded) {
      if (!isMoving) {
        currentState = 'idle';
      } else if (isSprinting) {
        currentState = 'run';
      } else {
        currentState = 'walk';
      }
    }

    // Weights: Sum is ALWAYS normalized to 1.0 so bones NEVER collapse!
    let targetIdleWeight = 0.0;
    let targetWalkWeight = 0.0;
    let targetRunWeight = 0.0;

    if (currentState === 'idle') {
      targetIdleWeight = 1.0;
    } else if (currentState === 'run' && grounded) {
      targetRunWeight = 1.0;
    } else {
      targetWalkWeight = 1.0;
    }

    if (idleAction) {
      const curW = idleAction.getEffectiveWeight();
      const newW = THREE.MathUtils.damp(curW, targetIdleWeight, 14, clampedDelta);
      idleAction.setEffectiveWeight(newW);
    }

    if (walkAction) {
      const curW = walkAction.getEffectiveWeight();
      const newW = THREE.MathUtils.damp(curW, targetWalkWeight, 14, clampedDelta);
      walkAction.setEffectiveWeight(newW);
    }

    if (runAction) {
      const curW = runAction.getEffectiveWeight();
      const newW = THREE.MathUtils.damp(curW, targetRunWeight, 14, clampedDelta);
      runAction.setEffectiveWeight(newW);
    }

    // Advance animation mixer
    mixer.update(clampedDelta);

    // Footsteps
    if (grounded && isMoving) {
      const stepDistance = isSprinting ? 1.7 : 1.1;
      distanceSinceFootstep += currentSpeed * clampedDelta;
      if (distanceSinceFootstep >= stepDistance) {
        soundManager.playFootstep(isSprinting);
        distanceSinceFootstep = 0;
      }
    } else {
      distanceSinceFootstep = 0;
    }
  };

  return {
    model,
    mixer,
    update,
    getPosition: () => position,
    getFacingAngle: () => currentAngle,
    getCurrentState: () => currentState,
    getSpeedRatio: () => {
      if (currentState === 'run') return 1.0;
      if (currentState === 'walk') return 0.5;
      return 0.0;
    },
    isGrounded: () => grounded,
  };
}
