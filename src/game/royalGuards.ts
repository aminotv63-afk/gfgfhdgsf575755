import * as THREE from 'three';
import { collisionSystem } from './collision';
import { lodManager } from './lodManager';

export interface GuardCommandOptions {
  isKneeling: boolean;        // الركوع والانحناء مع خفض الرؤوس واليد على الصدر
  isHoldPosition: boolean;    // التوقف والثبات في المكان دون اتباع
  isProtectFormation: boolean;// تشكيل الحماية: واحد في الأمام وواحد في الخلف
  isHorseMounted?: boolean;   // عند ركوب السلطان للحصان: يتوقف الحراس ولا يتبعونه
}

export interface RoyalGuardsController {
  update: (
    delta: number,
    sultanPos: THREE.Vector3,
    sultanAngle: number,
    sultanSpeed: number,
    getHeight: (x: number, z: number, currentY?: number) => number,
    isSultanAttacking?: boolean,
    isSultanSwordDrawn?: boolean,
    guardOptions?: GuardCommandOptions
  ) => void;
  dispose: () => void;
}

// Procedural Canvas Pixel-Art Texture Generator
function createPixelTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  draw(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Guard Stern Face Texture (Front face strictly!)
function createGuardFaceTexture(mustacheStyle: number): THREE.CanvasTexture {
  return createPixelTexture(128, 128, (ctx) => {
    // Skin Base (Tanned Mediterranean)
    ctx.fillStyle = '#dfb892';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle skin pixel shading
    ctx.fillStyle = '#d1a87e';
    for (let x = 0; x < 128; x += 8) {
      for (let y = 32; y < 128; y += 8) {
        if ((x + y) % 16 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }

    // Steel Helmet Forehead Band & Rivets
    ctx.fillStyle = '#5a626a';
    ctx.fillRect(0, 0, 128, 30);
    ctx.fillStyle = '#838e99';
    ctx.fillRect(0, 0, 128, 6);
    ctx.fillStyle = '#c79822'; // Gold rim
    ctx.fillRect(0, 26, 128, 6);
    // Rivets
    ctx.fillStyle = '#e2edf7';
    ctx.fillRect(16, 12, 6, 6);
    ctx.fillRect(61, 12, 6, 6);
    ctx.fillRect(106, 12, 6, 6);

    // Guard Fierce Eyebrows
    ctx.fillStyle = '#1c120a';
    ctx.fillRect(22, 40, 32, 8);
    ctx.fillRect(20, 44, 8, 6);
    ctx.fillRect(74, 40, 32, 8);
    ctx.fillRect(100, 44, 8, 6);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(26, 50, 22, 12);
    ctx.fillRect(80, 50, 22, 12);

    ctx.fillStyle = '#3a2211'; // Brown Iris
    ctx.fillRect(32, 50, 12, 12);
    ctx.fillRect(82, 50, 12, 12);

    ctx.fillStyle = '#0a0502'; // Pupil
    ctx.fillRect(34, 52, 6, 8);
    ctx.fillRect(84, 52, 6, 8);

    ctx.fillStyle = '#ffffff'; // Glimmer
    ctx.fillRect(36, 52, 3, 3);
    ctx.fillRect(86, 52, 3, 3);

    // Nose
    ctx.fillStyle = '#c49970';
    ctx.fillRect(58, 60, 12, 18);
    ctx.fillStyle = '#ae835b';
    ctx.fillRect(54, 74, 20, 6);

    // Guard Algerian Mustache (Thick and disciplined)
    ctx.fillStyle = '#120b06';
    if (mustacheStyle === 0) {
      // Wide straight warrior mustache
      ctx.fillRect(32, 78, 64, 14);
      ctx.fillRect(24, 82, 12, 12);
      ctx.fillRect(92, 82, 12, 12);
    } else {
      // Curled warrior mustache
      ctx.fillRect(34, 78, 60, 14);
      ctx.fillRect(20, 74, 16, 12);
      ctx.fillRect(12, 68, 10, 10);
      ctx.fillRect(92, 74, 16, 12);
      ctx.fillRect(106, 68, 10, 10);
    }

    // Mouth
    ctx.fillStyle = '#6e3025';
    ctx.fillRect(54, 94, 20, 4);

    // Stubble / Chin Beard
    ctx.fillStyle = '#1a1009';
    ctx.fillRect(44, 100, 40, 28);
    ctx.fillRect(16, 106, 28, 22);
    ctx.fillRect(84, 106, 28, 22);
  });
}

// Guard Helmet Sides & Back
function createGuardHelmetTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    // Steel Plate
    ctx.fillStyle = '#5c646c';
    ctx.fillRect(0, 0, 64, 64);
    // Plate highlights & rivets
    ctx.fillStyle = '#7a8590';
    ctx.fillRect(0, 0, 64, 10);
    ctx.fillStyle = '#40464c';
    ctx.fillRect(0, 54, 64, 10);

    // Gold decorative band
    ctx.fillStyle = '#c79822';
    ctx.fillRect(0, 24, 64, 8);
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(0, 26, 64, 4);

    // Rivets
    ctx.fillStyle = '#e2edf7';
    ctx.fillRect(12, 14, 4, 4);
    ctx.fillRect(48, 14, 4, 4);
    ctx.fillRect(12, 44, 4, 4);
    ctx.fillRect(48, 44, 4, 4);
  });
}

// Guard Armored Torso Texture (Iron plate over royal crimson tunic)
function createGuardTorsoTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    // Base royal crimson gambeson
    ctx.fillStyle = '#70141b';
    ctx.fillRect(0, 0, 64, 64);

    // Heavy Iron Breastplate
    ctx.fillStyle = '#5c656d';
    ctx.fillRect(8, 6, 48, 46);
    ctx.fillStyle = '#78848f';
    ctx.fillRect(12, 8, 40, 16); // Upper chest plate highlight

    // Gold royal emblem crest on chest (Kingdom of Achour star)
    ctx.fillStyle = '#d9a726';
    ctx.fillRect(28, 18, 8, 8);
    ctx.fillRect(26, 20, 12, 4);
    ctx.fillRect(30, 16, 4, 12);

    // Armor Rivets
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 10, 3, 3);
    ctx.fillRect(49, 10, 3, 3);
    ctx.fillRect(12, 48, 3, 3);
    ctx.fillRect(49, 48, 3, 3);

    // Heavy Leather War Belt with Golden Buckle
    ctx.fillStyle = '#2b170c';
    ctx.fillRect(0, 50, 64, 14);
    ctx.fillStyle = '#d9a726';
    ctx.fillRect(24, 49, 16, 15);
    ctx.fillStyle = '#2b170c';
    ctx.fillRect(28, 53, 8, 7);
  });
}

// Single Armored Guard Unit
class ArmoredGuard {
  public root: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private weaponGroup: THREE.Group;
  private shadowMesh: THREE.Mesh;

  public position: THREE.Vector3;
  private currentAngle: number = 0;
  private animTimer: number = Math.random() * 10;
  private isMoving: boolean = false;
  private isRunning: boolean = false;
  private readonly offsetSide: number; // +1.5 for right guard, -1.5 for left guard
  private readonly guardIndex: number;
  private holdPositionPoint: THREE.Vector3 = new THREE.Vector3();
  private wasHoldActive: boolean = false;

  constructor(scene: THREE.Scene, side: 'right' | 'left', guardIndex: number) {
    this.guardIndex = guardIndex;
    this.offsetSide = side === 'right' ? 1.5 : -1.5;
    this.root = new THREE.Group();
    this.position = new THREE.Vector3(this.offsetSide, 0.04, 0);
    this.root.position.copy(this.position);
    this.holdPositionPoint.copy(this.position);

    // 1. Multi-material Head
    const helmetMat = new THREE.MeshStandardMaterial({
      map: createGuardHelmetTexture(),
      metalness: 0.75,
      roughness: 0.35,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: createGuardFaceTexture(guardIndex),
      roughness: 0.75,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x5e676f,
      metalness: 0.8,
      roughness: 0.35,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd9a726,
      metalness: 0.85,
      roughness: 0.25,
    });
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0x8a151f,
      roughness: 0.65,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x3d4349,
      metalness: 0.6,
      roughness: 0.5,
    });

    const headMaterials = [
      helmetMat, // +X
      helmetMat, // -X
      helmetMat, // +Y
      helmetMat, // -Y
      faceMat,   // +Z Front (Face strictly forward!)
      helmetMat, // -Z Back
    ];

    // --- TORSO ---
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.75, 0);

    const torsoGeo = new THREE.BoxGeometry(0.46, 0.66, 0.26);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: createGuardTorsoTexture(),
      roughness: 0.5,
      metalness: 0.65,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.set(0, 0.33, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Heavy Armored Pauldrons (Shoulders)
    const pauldronGeo = new THREE.BoxGeometry(0.18, 0.12, 0.28);
    const leftPauldron = new THREE.Mesh(pauldronGeo, ironMat);
    leftPauldron.position.set(-0.28, 0.62, 0);
    this.torsoGroup.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, ironMat);
    rightPauldron.position.set(0.28, 0.62, 0);
    this.torsoGroup.add(rightPauldron);

    this.root.add(this.torsoGroup);

    // --- HEAD & HELMET ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.41, 0);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.position.set(0, 0.2, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Royal Guard Helmet Crest / Plume (Crimson Feathered Comb)
    const plumeGeo = new THREE.BoxGeometry(0.08, 0.2, 0.38);
    const plume = new THREE.Mesh(plumeGeo, crimsonMat);
    plume.position.set(0, 0.46, -0.02);
    this.headGroup.add(plume);

    // Gold plume holder base
    const plumeHolderGeo = new THREE.BoxGeometry(0.12, 0.05, 0.4);
    const plumeHolder = new THREE.Mesh(plumeHolderGeo, goldMat);
    plumeHolder.position.set(0, 0.4, -0.02);
    this.headGroup.add(plumeHolder);

    this.root.add(this.headGroup);

    // --- ARMS ---
    const armGeo = new THREE.BoxGeometry(0.17, 0.66, 0.19);
    const handGeo = new THREE.BoxGeometry(0.16, 0.12, 0.18);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfb892, roughness: 0.8 });

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.34, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, crimsonMat);
    leftArmMesh.position.set(0, -0.33, 0);
    this.leftArmGroup.add(leftArmMesh);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(0, -0.6, 0);
    this.leftArmGroup.add(leftHand);

    // Royal Guard Iron Shield on Left Forearm
    const shieldGeo = new THREE.BoxGeometry(0.04, 0.48, 0.32);
    const shieldMesh = new THREE.Mesh(shieldGeo, ironMat);
    shieldMesh.position.set(-0.11, -0.38, 0.04);
    this.leftArmGroup.add(shieldMesh);
    // Shield Gold Emblem Boss
    const shieldBossGeo = new THREE.BoxGeometry(0.06, 0.14, 0.14);
    const shieldBoss = new THREE.Mesh(shieldBossGeo, goldMat);
    shieldBoss.position.set(-0.12, -0.38, 0.04);
    this.leftArmGroup.add(shieldBoss);

    this.root.add(this.leftArmGroup);

    // Right Arm (Armed Hand)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.34, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, crimsonMat);
    rightArmMesh.position.set(0, -0.33, 0);
    this.rightArmGroup.add(rightArmMesh);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0, -0.6, 0);
    this.rightArmGroup.add(rightHand);

    // --- ROYAL GUARD WEAPON: FORGED STEEL BROADSWORD HELD UPRIGHT IN GUARD ---
    this.weaponGroup = new THREE.Group();
    this.weaponGroup.position.set(0, -0.6, 0.06);
    // Point sword blade upright & slightly forward
    this.weaponGroup.rotation.x = Math.PI / 2 - 0.3; // Forward/upward
    this.weaponGroup.rotation.z = -0.1;

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.18, 0.04);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x1f140c, roughness: 0.6 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.02;
    this.weaponGroup.add(grip);

    // Crossguard
    const guardCrossGeo = new THREE.BoxGeometry(0.2, 0.04, 0.07);
    const guardCross = new THREE.Mesh(guardCrossGeo, goldMat);
    guardCross.position.y = 0.08;
    this.weaponGroup.add(guardCross);

    // Steel Blade
    const bladeGeo = new THREE.BoxGeometry(0.065, 0.82, 0.022);
    bladeGeo.translate(0, 0.41, 0);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xebf2fa,
      metalness: 0.95,
      roughness: 0.15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.1;
    blade.castShadow = true;
    this.weaponGroup.add(blade);

    // Blade central gold fuller
    const fullerGeo = new THREE.BoxGeometry(0.016, 0.68, 0.026);
    fullerGeo.translate(0, 0.34, 0);
    const fuller = new THREE.Mesh(fullerGeo, goldMat);
    fuller.position.y = 0.1;
    this.weaponGroup.add(fuller);

    this.rightArmGroup.add(this.weaponGroup);
    this.root.add(this.rightArmGroup);

    // --- LEGS ---
    const legGeo = new THREE.BoxGeometry(0.19, 0.42, 0.21);
    const bootGeo = new THREE.BoxGeometry(0.2, 0.33, 0.23);

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.13, 0.75, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, crimsonMat);
    leftLegMesh.position.set(0, -0.21, 0);
    this.leftLegGroup.add(leftLegMesh);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.585, 0.01);
    this.leftLegGroup.add(leftBoot);
    this.root.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.13, 0.75, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, crimsonMat);
    rightLegMesh.position.set(0, -0.21, 0);
    this.rightLegGroup.add(rightLegMesh);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.585, 0.01);
    this.rightLegGroup.add(rightBoot);
    this.root.add(this.rightLegGroup);

    // Soft Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(1.1, 1.1);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(32, 32, 6, 32, 32, 30);
    grad.addColorStop(0, 'rgba(10, 20, 10, 0.65)');
    grad.addColorStop(0.5, 'rgba(10, 20, 10, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = 0.03;
    scene.add(this.shadowMesh);

    scene.add(this.root);

    lodManager.register({
      id: `escort_guard_${this.guardIndex}`,
      root: this.root,
      getPosition: () => this.position,
      setTier: () => {},
      isImportant: true,
    });
  }

  public update(
    delta: number,
    sultanPos: THREE.Vector3,
    sultanAngle: number,
    sultanSpeed: number,
    getHeight: (x: number, z: number, currentY?: number) => number,
    isSultanAttacking?: boolean,
    isSultanSwordDrawn?: boolean,
    guardOptions?: GuardCommandOptions
  ) {
    const clampedDelta = Math.min(delta, 0.08);
    const isKneeling = !!guardOptions?.isKneeling;
    const isHoldPosition = !!guardOptions?.isHoldPosition || !!guardOptions?.isHorseMounted;
    const isProtectFormation = !!guardOptions?.isProtectFormation;

    const groundY = getHeight(this.position.x, this.position.z, this.position.y) + 0.04;

    // -------------------------------------------------------------
    // 1. FULL SUJOOD PROSTRATION STATE (سجود وانحناء كامل بالأرض)
    // -------------------------------------------------------------
    if (isKneeling) {
      this.isMoving = false;
      this.isRunning = false;

      // When performing Sujood before the Sultan, face directly towards the Sultan
      const toSultanX = sultanPos.x - this.position.x;
      const toSultanZ = sultanPos.z - this.position.z;
      const angleToSultan = Math.atan2(toSultanX, toSultanZ);
      let angleDiff = angleToSultan - this.currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.currentAngle += angleDiff * Math.min(1, 8.0 * clampedDelta);
      this.root.rotation.y = this.currentAngle;

      // Lower body completely to ground level in full Sujood
      const sujoodGroundY = groundY - 0.44;
      this.position.y = THREE.MathUtils.damp(this.position.y, sujoodGroundY, 16, clampedDelta);
      this.root.position.copy(this.position);
      this.shadowMesh.position.set(this.position.x, groundY - 0.01, this.position.z);
      this.shadowMesh.scale.set(1.3, 1.3, 1.3);

      // Legs folded under thighs with shins flat along ground
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 1.55, 14, clampedDelta);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 1.55, 14, clampedDelta);

      // Torso laid flat forward parallel to the ground (90 deg prostration)
      this.torsoGroup.position.set(0, 0.22, 0.16);
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 1.52, 14, clampedDelta);
      this.torsoGroup.rotation.y = THREE.MathUtils.damp(this.torsoGroup.rotation.y, 0.0, 14, clampedDelta);

      // Head lowered completely touching the ground in Sujood ("مطأطئو الرؤوس ساجدون")
      this.headGroup.position.set(0, 0.26, 0.62);
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, 1.55, 14, clampedDelta);
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, 0.0, 14, clampedDelta);

      // Arms and hands stretched forward flat on the ground beside head in authentic Sujood
      this.rightArmGroup.position.set(0.32, 0.24, 0.48);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 1.48, 14, clampedDelta);
      this.rightArmGroup.rotation.y = THREE.MathUtils.damp(this.rightArmGroup.rotation.y, -0.22, 14, clampedDelta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, 0.25, 14, clampedDelta);

      this.leftArmGroup.position.set(-0.32, 0.24, 0.48);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 1.48, 14, clampedDelta);
      this.leftArmGroup.rotation.y = THREE.MathUtils.damp(this.leftArmGroup.rotation.y, 0.22, 14, clampedDelta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, -0.25, 14, clampedDelta);
      return;
    }

    // Restore standard posture positions when standing up from Sujood
    this.torsoGroup.position.set(0, 0.75, 0);
    this.headGroup.position.set(0, 1.41, 0);
    this.rightArmGroup.position.set(0.34, 1.35, 0);
    this.leftArmGroup.position.set(-0.34, 1.35, 0);
    this.shadowMesh.scale.set(1.0, 1.0, 1.0);

    // -------------------------------------------------------------
    // 2. TARGET POSITION & FORMATION CALCULATION
    // -------------------------------------------------------------
    let targetX = this.position.x;
    let targetZ = this.position.z;

    if (isHoldPosition) {
      // HOLD POSITION: Freeze in place, do not follow Sultan
      if (!this.wasHoldActive) {
        this.holdPositionPoint.copy(this.position);
        this.wasHoldActive = true;
      }
      targetX = this.holdPositionPoint.x;
      targetZ = this.holdPositionPoint.z;
    } else {
      this.wasHoldActive = false;

      // FORMATION LOGIC:
      // A) Protect Formation: One in FRONT (+2.3m), second in BACK (-2.3m)
      // B) Flank Escort: One on the RIGHT (+1.5m), second on the LEFT (-1.5m)
      let sideOffset = this.offsetSide; // +1.5 or -1.5
      let forwardOffset = 0.0;

      if (isProtectFormation) {
        if (this.guardIndex === 0) {
          // Guard 1: Vanguard directly in FRONT of Sultan
          sideOffset = 0.0;
          forwardOffset = 2.4;
        } else {
          // Guard 2: Rearguard directly BEHIND Sultan
          sideOffset = 0.0;
          forwardOffset = -2.4;
        }
      }

      const cosA = Math.cos(sultanAngle);
      const sinA = Math.sin(sultanAngle);

      // World target offset
      const worldOffsetX = cosA * sideOffset + sinA * forwardOffset;
      const worldOffsetZ = -sinA * sideOffset + cosA * forwardOffset;

      targetX = sultanPos.x + worldOffsetX;
      targetZ = sultanPos.z + worldOffsetZ;
    }

    // Distance to target
    const dx = targetX - this.position.x;
    const dz = targetZ - this.position.z;
    const distToTarget = Math.hypot(dx, dz);

    // -------------------------------------------------------------
    // 3. FOLLOWING / LOCOMOTION AI
    // -------------------------------------------------------------
    const STOP_DIST = isHoldPosition ? 0.15 : 0.28;
    const RUN_DIST = 1.9;

    if (distToTarget > STOP_DIST) {
      this.isMoving = true;
      this.isRunning = distToTarget > RUN_DIST || sultanSpeed > 5.0;

      let moveSpeed = this.isRunning ? 8.4 : 4.3;
      if (distToTarget > 3.6) moveSpeed = 12.0; // Catch up sprint if separated

      const moveDirX = dx / distToTarget;
      const moveDirZ = dz / distToTarget;

      const deltaMoveX = moveDirX * moveSpeed * clampedDelta;
      const deltaMoveZ = moveDirZ * moveSpeed * clampedDelta;
      const resolved = collisionSystem.resolveMovement(this.position, deltaMoveX, deltaMoveZ, 0.35);
      this.position.x = resolved.x;
      this.position.z = resolved.z;

      // Rotate towards destination
      const moveAngle = Math.atan2(moveDirX, moveDirZ);
      const targetFacing = (!isHoldPosition && distToTarget < 1.0) ? sultanAngle : moveAngle;
      let angleDiff = targetFacing - this.currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.currentAngle += angleDiff * Math.min(1, 10.0 * clampedDelta);
    } else {
      this.isMoving = false;
      this.isRunning = false;

      // When stopped, align orientation
      let desiredFacing = sultanAngle;
      if (isHoldPosition) {
        // Look outward as a sentry
        desiredFacing = this.currentAngle;
      } else if (isProtectFormation && this.guardIndex === 1) {
        // Rearguard watches behind Sultan to cover his back!
        desiredFacing = sultanAngle + Math.PI;
      }

      let angleDiff = desiredFacing - this.currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.currentAngle += angleDiff * Math.min(1, 8.0 * clampedDelta);
    }

    this.root.rotation.y = this.currentAngle;

    // Height snapping on terrain
    this.position.y = THREE.MathUtils.damp(this.position.y, groundY, 24, clampedDelta);
    this.root.position.copy(this.position);

    // Update Shadow
    this.shadowMesh.position.set(this.position.x, groundY - 0.01, this.position.z);

    // -------------------------------------------------------------
    // 4. MARCHING & COMBAT ANIMATION SYSTEM (PROTECT STANCE INCLUDED!)
    // -------------------------------------------------------------
    const animRate = this.isRunning ? 13.5 : (this.isMoving ? 8.2 : 2.0);
    this.animTimer += clampedDelta * animRate;

    if (this.isMoving) {
      const swingAmp = this.isRunning ? 0.9 : 0.6;
      const swing = Math.sin(this.animTimer) * swingAmp;

      // Legs march in rhythm
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, -swing, 20, clampedDelta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, swing, 20, clampedDelta);

      // Left arm with shield held firmly in front
      const shieldRaise = isProtectFormation ? -0.65 : -0.4;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, shieldRaise + swing * 0.15, 15, clampedDelta);
      this.leftArmGroup.rotation.y = THREE.MathUtils.damp(this.leftArmGroup.rotation.y, 0.0, 15, clampedDelta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, -0.2, 15, clampedDelta);

      // Right arm with broadsword held forward in battle-ready march
      const swordForward = isProtectFormation ? -0.75 : -0.6;
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, swordForward - swing * 0.15, 15, clampedDelta);
      this.rightArmGroup.rotation.y = THREE.MathUtils.damp(this.rightArmGroup.rotation.y, -0.2, 15, clampedDelta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, 0.25, 15, clampedDelta);

      const lean = this.isRunning ? 0.15 : 0.05;
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, lean, 15, clampedDelta);
      this.torsoGroup.rotation.y = THREE.MathUtils.damp(this.torsoGroup.rotation.y, 0.0, 15, clampedDelta);
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, lean * 0.5, 15, clampedDelta);
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, 0.0, 15, clampedDelta);
      this.headGroup.position.y = 1.41;
    } else {
      // Standing Sentry & Alert Protection Stance
      const breath = Math.sin(this.animTimer) * 0.03;

      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0.0, 10, clampedDelta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0.0, 10, clampedDelta);

      // In Protection Mode: High-readiness battle stance! Shield up and sword ready!
      let alertRaise = (isSultanAttacking || isSultanSwordDrawn) ? -0.85 : -0.55;
      if (isProtectFormation) {
        alertRaise = -0.88; // Always ready to protect Sultan!
      }

      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, alertRaise + breath, 12, clampedDelta);
      this.rightArmGroup.rotation.y = THREE.MathUtils.damp(this.rightArmGroup.rotation.y, -0.22, 12, clampedDelta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, 0.32, 12, clampedDelta);

      const shieldForward = isProtectFormation ? -0.58 : -0.35;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, shieldForward + breath, 12, clampedDelta);
      this.leftArmGroup.rotation.y = THREE.MathUtils.damp(this.leftArmGroup.rotation.y, 0.0, 12, clampedDelta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, -0.25, 12, clampedDelta);

      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.0, 10, clampedDelta);
      this.torsoGroup.rotation.y = THREE.MathUtils.damp(this.torsoGroup.rotation.y, 0.0, 10, clampedDelta);
      this.headGroup.position.y = 1.41 + breath * 0.25;
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, breath * 0.3, 10, clampedDelta);
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, 0.0, 10, clampedDelta);
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.root);
    scene.remove(this.shadowMesh);
  }
}

// Controller for both flanking guards
export function createRoyalGuards(scene: THREE.Scene): RoyalGuardsController {
  // Guard 1: Right Flank / Vanguard
  const rightGuard = new ArmoredGuard(scene, 'right', 0);
  // Guard 2: Left Flank / Rearguard
  const leftGuard = new ArmoredGuard(scene, 'left', 1);

  const update = (
    delta: number,
    sultanPos: THREE.Vector3,
    sultanAngle: number,
    sultanSpeed: number,
    getHeight: (x: number, z: number, currentY?: number) => number,
    isSultanAttacking?: boolean,
    isSultanSwordDrawn?: boolean,
    guardOptions?: GuardCommandOptions
  ) => {
    rightGuard.update(delta, sultanPos, sultanAngle, sultanSpeed, getHeight, isSultanAttacking, isSultanSwordDrawn, guardOptions);
    leftGuard.update(delta, sultanPos, sultanAngle, sultanSpeed, getHeight, isSultanAttacking, isSultanSwordDrawn, guardOptions);
  };

  const dispose = () => {
    rightGuard.dispose(scene);
    leftGuard.dispose(scene);
  };

  return {
    update,
    dispose,
  };
}
