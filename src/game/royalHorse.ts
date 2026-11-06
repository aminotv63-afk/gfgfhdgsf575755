import * as THREE from 'three';
import { ControlState } from '../types/game';
import { soundManager } from '../utils/audio';
import { collisionSystem } from './collision';
import { lodManager } from './lodManager';

export interface RoyalHorseController {
  group: THREE.Group;
  update: (
    delta: number,
    controls: ControlState,
    cameraYaw: number,
    getHeight: (x: number, z: number, currentY?: number) => number
  ) => {
    isMounted: boolean;
    horsePos: THREE.Vector3;
    horseAngle: number;
    speedRatio: number;
  };
  mount: () => void;
  dismount: () => THREE.Vector3;
  isMounted: () => boolean;
  isNear: (pos: THREE.Vector3) => boolean;
  getPosition: () => THREE.Vector3;
  getFacingAngle: () => number;
  getSpeedRatio: () => number;
  dispose: () => void;
}

export function createRoyalHorse(scene: THREE.Scene): RoyalHorseController {
  const horseGroup = new THREE.Group();
  horseGroup.name = 'RoyalArabianHorse_Achour10';

  // Initial parked position right beside the Palace entrance plaza
  const initialPos = new THREE.Vector3(8.5, 0.12, 6.0);
  horseGroup.position.copy(initialPos);
  let currentAngle = -Math.PI * 0.25; // Facing slightly toward the palace gateway
  horseGroup.rotation.y = currentAngle;

  // Materials: Arabian Pearlescent White Coat with Golden Royal Accents
  const coatMat = new THREE.MeshStandardMaterial({
    color: 0xf5ede1,
    roughness: 0.65,
    metalness: 0.05,
  });

  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xdfcbba,
    roughness: 0.8,
  });

  const maneMat = new THREE.MeshStandardMaterial({
    color: 0x2b1c11, // Dark chestnut mane
    roughness: 0.7,
  });

  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a17,
    roughness: 0.5,
    metalness: 0.3,
  });

  const saddleMat = new THREE.MeshStandardMaterial({
    color: 0x82141c, // Imperial crimson velvet
    roughness: 0.55,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a726,
    metalness: 0.85,
    roughness: 0.25,
  });

  const reinMat = new THREE.MeshStandardMaterial({
    color: 0x3d2314,
    roughness: 0.6,
  });

  // --- 1. HORSE BODY (BARREL TORSO) ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.25, 0);

  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.75, 1.55), coatMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyGroup.add(torsoMesh);

  // Chest / Flank curves
  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 0.45), coatMat);
  chestMesh.position.set(0, 0.05, 0.68);
  chestMesh.castShadow = true;
  bodyGroup.add(chestMesh);

  const rumpMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 0.45), coatMat);
  rumpMesh.position.set(0, 0.05, -0.68);
  rumpMesh.castShadow = true;
  bodyGroup.add(rumpMesh);

  // --- 2. SADDLE & STIRRUPS (سرج ملكي مطرز بالذهب) ---
  const saddleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.72), saddleMat);
  saddleMesh.position.set(0, 0.42, 0);
  saddleMesh.castShadow = true;
  bodyGroup.add(saddleMesh);

  // Golden saddle trim
  const saddleTrimF = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.12), goldMat);
  saddleTrimF.position.set(0, 0.45, 0.34);
  bodyGroup.add(saddleTrimF);

  const saddleTrimB = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.14), goldMat);
  saddleTrimB.position.set(0, 0.48, -0.34);
  bodyGroup.add(saddleTrimB);

  // Golden Stirrups (Left & Right)
  [-0.42, 0.42].forEach((sx) => {
    const stirrupStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.08), reinMat);
    stirrupStrap.position.set(sx, 0.1, 0);
    bodyGroup.add(stirrupStrap);

    const stirrupIron = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), goldMat);
    stirrupIron.position.set(sx, -0.2, 0);
    bodyGroup.add(stirrupIron);
  });

  // --- 3. NECK & HEAD ---
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.35, 0.85);

  const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.55), coatMat);
  neckMesh.position.set(0, 0.35, 0.18);
  neckMesh.rotation.x = 0.42;
  neckMesh.castShadow = true;
  neckGroup.add(neckMesh);

  // Flowing Mane
  const maneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.35), maneMat);
  maneMesh.position.set(0, 0.45, -0.05);
  maneMesh.rotation.x = 0.42;
  neckGroup.add(maneMesh);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.85, 0.42);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.65), coatMat);
  headMesh.position.set(0, 0, 0.25);
  headMesh.rotation.x = 0.32;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Muzzle / Snout
  const muzzleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.35), snoutMat);
  muzzleMesh.position.set(0, -0.16, 0.58);
  muzzleMesh.rotation.x = 0.32;
  headGroup.add(muzzleMesh);

  // Nostrils
  [-0.08, 0.08].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.04), hoofMat);
    nostril.position.set(nx, -0.18, 0.74);
    headGroup.add(nostril);
  });

  // Eyes
  [-0.2, 0.2].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), hoofMat);
    eye.position.set(ex, 0.08, 0.28);
    headGroup.add(eye);
  });

  // Ears
  const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 4), coatMat);
  leftEar.position.set(-0.13, 0.3, -0.05);
  leftEar.rotation.x = 0.2;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 4), coatMat);
  rightEar.position.set(0.13, 0.3, -0.05);
  rightEar.rotation.x = 0.2;
  headGroup.add(rightEar);

  // Golden Bridle & Reins
  const bridleBand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), goldMat);
  bridleBand.position.set(0, 0.02, 0.35);
  bridleBand.rotation.x = 0.32;
  headGroup.add(bridleBand);

  neckGroup.add(headGroup);
  bodyGroup.add(neckGroup);

  // --- 4. TAIL ---
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.25, -0.85);

  const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.2), maneMat);
  tailMesh.position.set(0, -0.45, -0.15);
  tailMesh.rotation.x = -0.25;
  tailMesh.castShadow = true;
  tailGroup.add(tailMesh);
  bodyGroup.add(tailGroup);

  horseGroup.add(bodyGroup);

  // --- 5. FOUR ARTICULATED LEGS ---
  const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
  const hoofGeo = new THREE.BoxGeometry(0.22, 0.18, 0.24);

  const createLeg = (lx: number, lz: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx, 0.95, lz);

    const leg = new THREE.Mesh(legGeo, coatMat);
    leg.position.set(0, -0.38, 0);
    leg.castShadow = true;
    pivot.add(leg);

    const hoof = new THREE.Mesh(hoofGeo, hoofMat);
    hoof.position.set(0, -0.74, 0.02);
    pivot.add(hoof);

    horseGroup.add(pivot);
    return pivot;
  };

  const legFL = createLeg(-0.28, 0.58);
  const legFR = createLeg(0.28, 0.58);
  const legBL = createLeg(-0.28, -0.58);
  const legBR = createLeg(0.28, -0.58);

  // --- 6. HITCHING POST / PADDOCK MARKER (بجانب القصر) ---
  const postGroup = new THREE.Group();
  postGroup.position.set(initialPos.x + 1.4, 0, initialPos.z);

  const postPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.8 })
  );
  postPole.position.y = 0.8;
  postPole.castShadow = true;
  postGroup.add(postPole);

  const postRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.8 })
  );
  postRail.position.set(0, 1.2, 0);
  postGroup.add(postRail);

  // Royal Banner on Post
  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x82141c, side: THREE.DoubleSide })
  );
  flagMesh.position.set(0.1, 1.1, 0.8);
  flagMesh.rotation.y = Math.PI / 2;
  postGroup.add(flagMesh);

  scene.add(postGroup);
  scene.add(horseGroup);

  // Register hitching post in collision system
  collisionSystem.registerCylinder({
    id: 'horse_paddock_post',
    x: postGroup.position.x,
    z: postGroup.position.z,
    radius: 0.45,
    minY: 0,
    maxY: 2.0,
    isActive: true,
  });

  // State
  let isMounted = false;
  const currentPos = initialPos.clone();
  let velocityY = 0;
  let isGrounded = true;
  let animTimer = 0;
  let gallopSoundTimer = 0;

  // Collision radius
  const HORSE_RADIUS = 0.55;
  let currentSpeedRatio = 0;

  const controller: RoyalHorseController = {
    group: horseGroup,
    isMounted: () => isMounted,
    getPosition: () => currentPos,
    getFacingAngle: () => currentAngle,
    getSpeedRatio: () => currentSpeedRatio,

    mount: () => {
      isMounted = true;
      soundManager.playHorseNeigh();
    },

    dismount: () => {
      isMounted = false;
      soundManager.playClick();
      // Drop Sultan safely to the left of the horse
      const dropPos = currentPos.clone();
      const offsetX = Math.cos(currentAngle) * 1.2;
      const offsetZ = -Math.sin(currentAngle) * 1.2;
      dropPos.x += offsetX;
      dropPos.z += offsetZ;
      return dropPos;
    },

    isNear: (sultanPos: THREE.Vector3) => {
      if (isMounted) return false;
      const d = Math.hypot(sultanPos.x - currentPos.x, sultanPos.z - currentPos.z);
      return d < 3.5;
    },

    update: (delta, controls, cameraYaw, getHeight) => {
      animTimer += delta * 4;

      if (!isMounted) {
        // Idle animation: gentle breathing and tail swish
        const breath = Math.sin(animTimer) * 0.03;
        bodyGroup.position.y = 1.25 + breath;
        tailGroup.rotation.y = Math.sin(animTimer * 1.5) * 0.25;
        headGroup.rotation.x = 0.32 + Math.sin(animTimer * 0.8) * 0.06;

        legFL.rotation.x = 0;
        legFR.rotation.x = 0;
        legBL.rotation.x = 0;
        legBR.rotation.x = 0;

        const groundY = getHeight(currentPos.x, currentPos.z, currentPos.y);
        currentPos.y = groundY;
        horseGroup.position.copy(currentPos);
        horseGroup.rotation.y = currentAngle;

        return {
          isMounted: false,
          horsePos: currentPos,
          horseAngle: currentAngle,
          speedRatio: 0,
        };
      }

      // --- MOUNTED HORSE LOCOMOTION ---
      const inputX = controls.moveX;
      const inputZ = controls.moveY;
      const inputMag = Math.hypot(inputX, inputZ);
      const isMoving = inputMag > 0.08;
      const isGalloping = isMoving && (controls.isRunning || inputMag > 0.8);

      let targetSpeed = 0;
      if (isMoving) {
        targetSpeed = isGalloping ? 12.0 : 5.8;
        if (inputZ < -0.2) targetSpeed = 2.8; // Reversing
      }
      currentSpeedRatio = targetSpeed / 12.0;

      // Desired movement angle relative to camera
      if (isMoving) {
        const inputAngle = Math.atan2(inputX, inputZ);
        const desiredWorldAngle = cameraYaw + inputAngle;

        let angleDiff = desiredWorldAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        currentAngle += angleDiff * Math.min(1, 8.0 * delta);
      }

      // Translation vector
      let moveStepX = 0;
      let moveStepZ = 0;
      if (isMoving) {
        const forwardStep = targetSpeed * delta;
        moveStepX = Math.sin(currentAngle) * forwardStep;
        moveStepZ = Math.cos(currentAngle) * forwardStep;
      }

      // Collision resolution
      const resolved = collisionSystem.resolveMovement(
        currentPos,
        moveStepX,
        moveStepZ,
        HORSE_RADIUS
      );

      currentPos.x = resolved.x;
      currentPos.z = resolved.z;

      // Jump / Gravity
      const groundY = getHeight(currentPos.x, currentPos.z, currentPos.y);
      if (controls.isJumping && isGrounded) {
        velocityY = 6.2;
        isGrounded = false;
        soundManager.playJump();
      }

      if (!isGrounded) {
        velocityY -= 19.8 * delta;
        currentPos.y += velocityY * delta;
        if (currentPos.y <= groundY) {
          currentPos.y = groundY;
          velocityY = 0;
          isGrounded = true;
        }
      } else {
        currentPos.y = groundY;
      }

      // Leg Trot & Gallop Gait Animation
      const gaitFrequency = isGalloping ? 18.0 : 9.0;
      const legCycle = Math.sin(animTimer * gaitFrequency);
      const legCycleOffset = Math.cos(animTimer * gaitFrequency);

      if (isMoving) {
        const swing = isGalloping ? 0.75 : 0.45;
        legFL.rotation.x = legCycle * swing;
        legBR.rotation.x = legCycle * swing;
        legFR.rotation.x = -legCycleOffset * swing;
        legBL.rotation.x = -legCycleOffset * swing;

        // Horse body pitch and bounce during gallop
        bodyGroup.position.y = 1.25 + Math.abs(legCycle) * 0.12;
        bodyGroup.rotation.x = legCycle * 0.08;
        tailGroup.rotation.x = -0.45 + legCycle * 0.15;
        headGroup.rotation.x = 0.32 + legCycle * 0.1;

        // Sound of hooves
        gallopSoundTimer += delta * (isGalloping ? 3.8 : 2.2);
        if (gallopSoundTimer >= 1.0) {
          gallopSoundTimer = 0;
          soundManager.playHorseGallop();
        }
      } else {
        legFL.rotation.x = THREE.MathUtils.damp(legFL.rotation.x, 0, 10, delta);
        legFR.rotation.x = THREE.MathUtils.damp(legFR.rotation.x, 0, 10, delta);
        legBL.rotation.x = THREE.MathUtils.damp(legBL.rotation.x, 0, 10, delta);
        legBR.rotation.x = THREE.MathUtils.damp(legBR.rotation.x, 0, 10, delta);

        bodyGroup.position.y = 1.25;
        bodyGroup.rotation.x = 0;
      }

      horseGroup.position.copy(currentPos);
      horseGroup.rotation.y = currentAngle;

      return {
        isMounted: true,
        horsePos: currentPos,
        horseAngle: currentAngle,
        speedRatio: targetSpeed / 12.0,
      };
    },

    dispose: () => {
      scene.remove(horseGroup);
      scene.remove(postGroup);
      collisionSystem.removeCollider('horse_paddock_post');
    },
  };

  lodManager.register({
    id: 'royal_horse',
    root: horseGroup,
    getPosition: () => currentPos,
    setTier: (tier) => {
      if (tier === 'far') {
        torsoMesh.castShadow = false;
      } else {
        torsoMesh.castShadow = true;
      }
    },
    isImportant: true,
  });

  return controller;
}
