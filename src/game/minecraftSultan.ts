import * as THREE from 'three';
import { ControlState, AnimationState } from '../types/game';
import { soundManager } from '../utils/audio';
import { collisionSystem } from './collision';
import { lodManager } from './lodManager';

export interface CharacterController {
  model: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  update: (delta: number, controls: ControlState, cameraYaw: number, getHeight: (x: number, z: number, currentY?: number) => number) => void;
  getPosition: () => THREE.Vector3;
  setPosition?: (newPos: THREE.Vector3) => void;
  getFacingAngle: () => number;
  getCurrentState: () => AnimationState;
  getSpeedRatio: () => number;
  isGrounded: () => boolean;
}

// Procedural Canvas Pixel-Art Texture Generator (Minecraft Style)
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

// ---------------------------------------------------------------------
// 1. HEAD TEXTURES (FRONT ONLY HAS FACE, MUSTACHE & BEARD!)
// ---------------------------------------------------------------------

// FRONT FACE ONLY (+Z): Eyes, Eyebrows, Iconic Algerian Mustache ("شلاغم"), and Royal Beard ("لحية")
function createFaceFrontTexture(): THREE.CanvasTexture {
  return createPixelTexture(128, 128, (ctx) => {
    // Warm Mediterranean Skin Base
    ctx.fillStyle = '#eed2b4';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle skin pixel shading
    ctx.fillStyle = '#e4c4a2';
    for (let x = 0; x < 128; x += 8) {
      for (let y = 24; y < 128; y += 8) {
        if ((x + y) % 16 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }

    // Forehead Royal Dark Hair line
    ctx.fillStyle = '#261206';
    ctx.fillRect(0, 0, 128, 26);
    // Wavy hairline cuts
    ctx.fillStyle = '#eed2b4';
    ctx.fillRect(20, 20, 8, 8);
    ctx.fillRect(60, 22, 8, 6);
    ctx.fillRect(100, 20, 8, 8);

    // Sideburns framing cheeks
    ctx.fillStyle = '#261206';
    ctx.fillRect(0, 24, 16, 50);
    ctx.fillRect(112, 24, 16, 50);

    // Arched Royal Eyebrows
    ctx.fillStyle = '#140803';
    ctx.fillRect(20, 36, 32, 8);
    ctx.fillRect(18, 40, 8, 6); // outer arch
    ctx.fillRect(76, 36, 32, 8);
    ctx.fillRect(102, 40, 8, 6); // outer arch

    // Royal Eyes
    // Sclera (White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 46, 24, 14);
    ctx.fillRect(80, 46, 24, 14);

    // Iris (Deep Royal Brown)
    ctx.fillStyle = '#3a1a08';
    ctx.fillRect(32, 46, 14, 14);
    ctx.fillRect(82, 46, 14, 14);

    // Pupil (Black)
    ctx.fillStyle = '#0d0401';
    ctx.fillRect(34, 48, 8, 10);
    ctx.fillRect(84, 48, 8, 10);

    // Catchlight (White glimmer)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, 48, 4, 4);
    ctx.fillRect(88, 48, 4, 4);

    // Shaded Nose Bridge
    ctx.fillStyle = '#d6ad88';
    ctx.fillRect(58, 56, 12, 16);
    ctx.fillStyle = '#c49972';
    ctx.fillRect(54, 68, 20, 6); // nostrils

    // -----------------------------------------------------------------
    // الشلاغم (Sultan Achour 10 Iconic Algerian Handlebar Mustache)
    // -----------------------------------------------------------------
    ctx.fillStyle = '#100502';
    // Thick center mustache under nose
    ctx.fillRect(36, 74, 56, 14);

    // Upward-curling handlebar wings across cheeks
    ctx.fillRect(20, 70, 20, 14);
    ctx.fillRect(12, 64, 12, 14); // curled up tip left
    ctx.fillRect(8, 58, 8, 10);

    ctx.fillRect(92, 70, 20, 14);
    ctx.fillRect(104, 64, 12, 14); // curled up tip right
    ctx.fillRect(112, 58, 8, 10);

    // Mustache dark brown texture highlights
    ctx.fillStyle = '#261206';
    ctx.fillRect(40, 76, 48, 6);
    ctx.fillRect(24, 72, 14, 6);
    ctx.fillRect(90, 72, 14, 6);

    // Royal Mouth Line
    ctx.fillStyle = '#7a3328';
    ctx.fillRect(52, 90, 24, 4);

    // -----------------------------------------------------------------
    // اللحية (Sultan Achour Royal Sculpted Beard)
    // -----------------------------------------------------------------
    ctx.fillStyle = '#100502';
    // Soul patch / Goatee in center chin
    ctx.fillRect(50, 96, 28, 32);

    // Full jawline beard extending along bottom of chin and cheeks
    ctx.fillRect(0, 96, 128, 32);
    ctx.fillRect(8, 88, 28, 16);
    ctx.fillRect(92, 88, 28, 16);

    // Beard pixel depth variations
    ctx.fillStyle = '#261206';
    for (let x = 8; x < 120; x += 8) {
      for (let y = 98; y < 128; y += 8) {
        if ((x + y) % 16 === 0) ctx.fillRect(x, y, 6, 6);
      }
    }
  });
}

// SIDES OF HEAD (+X, -X): Pure Hair & Ears (NO FACE, NO MUSTACHE)
function createHeadSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(128, 128, (ctx) => {
    // Skin Base for lower cheek & neck
    ctx.fillStyle = '#eed2b4';
    ctx.fillRect(0, 0, 128, 128);

    // Thick Royal Hair covering top 60% of side
    ctx.fillStyle = '#261206';
    ctx.fillRect(0, 0, 128, 76);

    // Hair texture variation
    ctx.fillStyle = '#180a03';
    for (let x = 0; x < 128; x += 12) {
      for (let y = 0; y < 76; y += 12) {
        if ((x + y) % 24 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }

    // Ear on side
    ctx.fillStyle = '#e4c4a2';
    ctx.fillRect(48, 56, 24, 30);
    ctx.fillStyle = '#cf9f7c';
    ctx.fillRect(54, 62, 12, 18);

    // Jawline Beard connecting to front
    ctx.fillStyle = '#100502';
    ctx.fillRect(0, 88, 128, 40);
    ctx.fillRect(16, 76, 32, 16); // connects with sideburns
  });
}

// BACK OF HEAD (-Z): Full Royal Hair (NO FACE)
function createHeadBackTexture(): THREE.CanvasTexture {
  return createPixelTexture(128, 128, (ctx) => {
    // Full dark brown royal hair down to neck
    ctx.fillStyle = '#261206';
    ctx.fillRect(0, 0, 128, 128);

    // Hair strands & texture
    ctx.fillStyle = '#140803';
    for (let x = 0; x < 128; x += 12) {
      for (let y = 0; y < 128; y += 12) {
        if ((x + y) % 24 === 0) ctx.fillRect(x, y, 8, 10);
      }
    }
  });
}

// TOP OF HEAD (+Y): Hair top
function createHeadTopTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#261206';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#180a03';
    for (let x = 0; x < 64; x += 8) {
      for (let y = 0; y < 64; y += 8) {
        if ((x + y) % 16 === 0) ctx.fillRect(x, y, 6, 6);
      }
    }
  });
}

// BOTTOM OF HEAD (-Y): Neck skin & chin underside
function createHeadBottomTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#eed2b4';
    ctx.fillRect(0, 0, 64, 64);
    // Beard under chin
    ctx.fillStyle = '#100502';
    ctx.fillRect(0, 44, 64, 20);
  });
}

// ---------------------------------------------------------------------
// 2. CROWN TEXTURES (NUMBER "10" ON FRONT ONLY!)
// ---------------------------------------------------------------------

// FRONT OF CROWN (+Z): Bold Gold Crown with Central Crimson Badge & NUMBER "10"
function createCrownFrontTexture(): THREE.CanvasTexture {
  return createPixelTexture(128, 64, (ctx) => {
    // Pure Polished Gold Base
    ctx.fillStyle = '#f5c227';
    ctx.fillRect(0, 0, 128, 64);

    // Darker gold engraved borders
    ctx.fillStyle = '#c99812';
    ctx.fillRect(0, 0, 128, 6);
    ctx.fillRect(0, 58, 128, 6);

    // -----------------------------------------------------------------
    // Central Royal Shield for Number "10" (FRONT ONLY!)
    // -----------------------------------------------------------------
    ctx.fillStyle = '#8a121d'; // Crimson velvet royal plaque
    ctx.fillRect(36, 8, 56, 48);

    // Gold braided frame around 10
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(36, 8, 56, 4); // top
    ctx.fillRect(36, 52, 56, 4); // bottom
    ctx.fillRect(36, 8, 4, 48); // left
    ctx.fillRect(88, 8, 4, 48); // right

    // Corner studs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, 10, 3, 3);
    ctx.fillRect(85, 10, 3, 3);
    ctx.fillRect(38, 49, 3, 3);
    ctx.fillRect(85, 49, 3, 3);

    // -----------------------------------------------------------------
    // BOLD NUMERAL "10" IN BRIGHT GOLD & WHITE
    // -----------------------------------------------------------------
    ctx.fillStyle = '#ffffff';

    // Digit "1"
    ctx.fillRect(48, 18, 6, 28); // main stem
    ctx.fillRect(44, 22, 6, 5);  // top hook serif
    ctx.fillRect(44, 42, 14, 5); // wide solid base

    // Digit "0"
    ctx.fillRect(64, 18, 18, 6); // top
    ctx.fillRect(64, 40, 18, 6); // bottom
    ctx.fillRect(64, 18, 6, 28); // left bar
    ctx.fillRect(76, 18, 6, 28); // right bar

    // Gold inner outline highlights on "10"
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(49, 20, 4, 24);
    ctx.fillRect(66, 20, 14, 3);
    ctx.fillRect(66, 41, 14, 3);

    // -----------------------------------------------------------------
    // Sparkling Gems flanking the 10 badge
    // -----------------------------------------------------------------
    // Large Rubies
    ctx.fillStyle = '#e6193c';
    ctx.fillRect(14, 20, 12, 24);
    ctx.fillRect(102, 20, 12, 24);
    ctx.fillStyle = '#ffffff'; // ruby shine
    ctx.fillRect(16, 22, 4, 6);
    ctx.fillRect(104, 22, 4, 6);

    // Emeralds
    ctx.fillStyle = '#10a352';
    ctx.fillRect(4, 24, 6, 16);
    ctx.fillRect(118, 24, 6, 16);
  });
}

// SIDES & BACK OF CROWN (+X, -X, -Z): Solid Gold & Jewels (NO NUMBER 10!)
function createCrownSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(128, 64, (ctx) => {
    // Pure Polished Gold Base
    ctx.fillStyle = '#f5c227';
    ctx.fillRect(0, 0, 128, 64);

    // Dark gold bevel lines
    ctx.fillStyle = '#c99812';
    ctx.fillRect(0, 0, 128, 6);
    ctx.fillRect(0, 58, 128, 6);

    // Alternating Rubies & Emeralds around crown (NO NUMBER 10!)
    for (let x = 16; x < 120; x += 32) {
      // Ruby
      ctx.fillStyle = '#e6193c';
      ctx.fillRect(x, 18, 10, 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, 20, 3, 6);

      // Emerald
      ctx.fillStyle = '#10a352';
      ctx.fillRect(x + 16, 22, 8, 18);
    }
  });
}

// ---------------------------------------------------------------------
// 3. TORSO TEXTURES (FRONT HAS ROYAL BUTTONS & ERMINE, BACK IS CLEAN)
// ---------------------------------------------------------------------

function createTorsoFrontTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    // Rich royal crimson velvet
    ctx.fillStyle = '#8f1520';
    ctx.fillRect(0, 0, 64, 64);

    // Velvet shading noise
    ctx.fillStyle = '#7a101a';
    for (let x = 0; x < 64; x += 4) {
      for (let y = 0; y < 64; y += 4) {
        if ((x + y) % 8 === 0) ctx.fillRect(x, y, 4, 4);
      }
    }

    // White Ermine Fur Collar
    ctx.fillStyle = '#f5f3ec';
    ctx.fillRect(14, 0, 36, 14);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(18, 4, 2, 4);
    ctx.fillRect(31, 6, 2, 4);
    ctx.fillRect(44, 4, 2, 4);

    // Golden Royal Embroidery down center
    ctx.fillStyle = '#e5b824';
    ctx.fillRect(28, 14, 8, 34);
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(30, 16, 4, 30);

    // Golden buttons
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(31, 20, 2, 2);
    ctx.fillRect(31, 28, 2, 2);
    ctx.fillRect(31, 36, 2, 2);
    ctx.fillRect(31, 44, 2, 2);

    // Golden Royal Belt
    ctx.fillStyle = '#381c0e';
    ctx.fillRect(0, 48, 64, 12);
    // Buckle
    ctx.fillStyle = '#f5c227';
    ctx.fillRect(22, 46, 20, 16);
    ctx.fillStyle = '#8f1520';
    ctx.fillRect(26, 50, 12, 8);
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(30, 52, 4, 4);
  });
}

function createTorsoBackTexture(): THREE.CanvasTexture {
  return createPixelTexture(64, 64, (ctx) => {
    // Solid crimson velvet back (covered by cape)
    ctx.fillStyle = '#8f1520';
    ctx.fillRect(0, 0, 64, 64);
    // Belt continuing around back
    ctx.fillStyle = '#381c0e';
    ctx.fillRect(0, 48, 64, 12);
  });
}

function createTorsoSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(32, 64, (ctx) => {
    ctx.fillStyle = '#8f1520';
    ctx.fillRect(0, 0, 32, 64);
    ctx.fillStyle = '#381c0e';
    ctx.fillRect(0, 48, 32, 12);
  });
}

// ---------------------------------------------------------------------
// 4. ROYAL CAPE TEXTURE
// ---------------------------------------------------------------------
function createCapeTexture(): THREE.CanvasTexture {
  return createPixelTexture(32, 64, (ctx) => {
    ctx.fillStyle = '#9e1b24';
    ctx.fillRect(0, 0, 32, 64);

    // Gold braided fringe border
    ctx.fillStyle = '#f5c227';
    ctx.fillRect(0, 0, 3, 64);
    ctx.fillRect(29, 0, 3, 64);
    ctx.fillRect(0, 58, 32, 6);

    // Golden royal diamond emblem
    ctx.fillStyle = '#f5c227';
    ctx.fillRect(10, 16, 12, 12);
    ctx.fillStyle = '#9e1b24';
    ctx.fillRect(13, 19, 6, 6);
    ctx.fillStyle = '#ffd747';
    ctx.fillRect(14, 20, 4, 4);
  });
}

// =====================================================================
// MAIN BUILDER: MINECRAFT SULTAN ACHOUR 10
// =====================================================================
export function createMinecraftSultan(scene: THREE.Scene): CharacterController {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  // -------------------------------------------------------------------
  // MULTI-MATERIAL ARRAYS FOR BOXGEOMETRY (6 FACES):
  // [0: +X Right, 1: -X Left, 2: +Y Top, 3: -Y Bottom, 4: +Z FRONT, 5: -Z Back]
  // -------------------------------------------------------------------

  // 1. HEAD MATERIALS: FACE, MUSTACHE & BEARD STRICTLY ON FACE 4 (+Z)!
  const headMaterials = [
    new THREE.MeshStandardMaterial({ map: createHeadSideTexture(), roughness: 0.85 }),   // +X Right
    new THREE.MeshStandardMaterial({ map: createHeadSideTexture(), roughness: 0.85 }),   // -X Left
    new THREE.MeshStandardMaterial({ map: createHeadTopTexture(), roughness: 0.9 }),     // +Y Top
    new THREE.MeshStandardMaterial({ map: createHeadBottomTexture(), roughness: 0.9 }),  // -Y Bottom
    new THREE.MeshStandardMaterial({ map: createFaceFrontTexture(), roughness: 0.8 }),   // +Z FRONT ONLY!
    new THREE.MeshStandardMaterial({ map: createHeadBackTexture(), roughness: 0.9 }),    // -Z Back
  ];

  // 2. CROWN MATERIALS: NUMBER "10" STRICTLY ON FACE 4 (+Z FRONT ONLY)!
  const crownSideMat = new THREE.MeshStandardMaterial({
    map: createCrownSideTexture(),
    roughness: 0.25,
    metalness: 0.8,
  });

  const crownFrontMat = new THREE.MeshStandardMaterial({
    map: createCrownFrontTexture(),
    roughness: 0.2,
    metalness: 0.75,
  });

  const crownTopMat = new THREE.MeshStandardMaterial({
    color: 0xf5c227,
    roughness: 0.3,
    metalness: 0.85,
  });

  const crownMaterials = [
    crownSideMat,   // +X Right (NO 10)
    crownSideMat,   // -X Left (NO 10)
    crownTopMat,    // +Y Top
    crownTopMat,    // -Y Bottom
    crownFrontMat,  // +Z FRONT ONLY (BOLD NUMBER 10!)
    crownSideMat,   // -Z Back (NO 10)
  ];

  // 3. TORSO MATERIALS:
  const torsoMaterials = [
    new THREE.MeshStandardMaterial({ map: createTorsoSideTexture(), roughness: 0.75 }),   // +X
    new THREE.MeshStandardMaterial({ map: createTorsoSideTexture(), roughness: 0.75 }),   // -X
    new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: 0.8 }),                  // +Y
    new THREE.MeshStandardMaterial({ color: 0x381c0e, roughness: 0.8 }),                  // -Y
    new THREE.MeshStandardMaterial({ map: createTorsoFrontTexture(), roughness: 0.75 }),  // +Z Front
    new THREE.MeshStandardMaterial({ map: createTorsoBackTexture(), roughness: 0.75 }),   // -Z Back
  ];

  // Cape & Limbs
  const capeMat = new THREE.MeshStandardMaterial({
    map: createCapeTexture(),
    roughness: 0.65,
    side: THREE.DoubleSide,
  });

  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x8f1520, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xeed2b4, roughness: 0.8 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7 });

  // --- 1. TORSO ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.75, 0);

  const torsoGeo = new THREE.BoxGeometry(0.48, 0.66, 0.26);
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterials);
  torsoMesh.position.set(0, 0.33, 0);
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // White Ermine Epaulets on shoulders
  const epauletGeo = new THREE.BoxGeometry(0.16, 0.1, 0.3);
  const epauletMat = new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: 0.9 });
  const leftEpaulet = new THREE.Mesh(epauletGeo, epauletMat);
  leftEpaulet.position.set(-0.28, 0.62, 0);
  torsoGroup.add(leftEpaulet);

  const rightEpaulet = new THREE.Mesh(epauletGeo, epauletMat);
  rightEpaulet.position.set(0.28, 0.62, 0);
  torsoGroup.add(rightEpaulet);

  root.add(torsoGroup);

  // --- 2. HEAD & CROWN ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.41, 0);

  // Head Box with 6 face materials (Face strictly on front!)
  const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.position.set(0, 0.21, 0);
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Subtle 3D pop for the Algerian Mustache on front of head
  const mustache3DGeo = new THREE.BoxGeometry(0.24, 0.05, 0.02);
  const mustache3DMat = new THREE.MeshStandardMaterial({ color: 0x100502, roughness: 0.9 });
  const mustache3D = new THREE.Mesh(mustache3DGeo, mustache3DMat);
  mustache3D.position.set(0, 0.12, 0.22);
  headGroup.add(mustache3D);

  // 3D MINECRAFT GOLDEN CROWN (Number 10 strictly on front face!)
  const crownBaseGeo = new THREE.BoxGeometry(0.46, 0.14, 0.46);
  const crownBase = new THREE.Mesh(crownBaseGeo, crownMaterials);
  crownBase.position.set(0, 0.4, 0);
  headGroup.add(crownBase);

  // Raised 3D Front Plaque for the Number 10 (Strictly on FRONT +Z!)
  const plaqueGeo = new THREE.BoxGeometry(0.22, 0.12, 0.02);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: createCrownFrontTexture(),
    roughness: 0.2,
    metalness: 0.75,
  });
  const frontPlaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  frontPlaque.position.set(0, 0.4, 0.24); // Strictly on front facing forward!
  headGroup.add(frontPlaque);

  // 5 Golden Crown Peaks on corners & front center
  const peakGeo = new THREE.BoxGeometry(0.09, 0.14, 0.09);
  const peakPositions = [
    [-0.19, 0.52, -0.19], // back-left
    [0.19, 0.52, -0.19],  // back-right
    [-0.19, 0.52, 0.19],  // front-left
    [0.19, 0.52, 0.19],   // front-right
    [0.0, 0.55, 0.2],     // tall center front peak above the 10!
  ];

  peakPositions.forEach(([px, py, pz]) => {
    const peak = new THREE.Mesh(peakGeo, crownTopMat);
    peak.position.set(px, py, pz);
    headGroup.add(peak);
  });

  root.add(headGroup);

  // --- 3. ARMS ---
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.35, 1.35, 0);

  const armGeo = new THREE.BoxGeometry(0.18, 0.66, 0.2);
  const leftArmMesh = new THREE.Mesh(armGeo, sleeveMat);
  leftArmMesh.position.set(0, -0.33, 0);
  leftArmMesh.receiveShadow = true;
  leftArmGroup.add(leftArmMesh);

  const handGeo = new THREE.BoxGeometry(0.17, 0.12, 0.19);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0, -0.6, 0);
  leftArmGroup.add(leftHand);

  root.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.35, 1.35, 0);

  const rightArmMesh = new THREE.Mesh(armGeo, sleeveMat);
  rightArmMesh.position.set(0, -0.33, 0);
  rightArmMesh.receiveShadow = true;
  rightArmGroup.add(rightArmMesh);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0, -0.6, 0);
  rightArmGroup.add(rightHand);

  root.add(rightArmGroup);

  // --- 4. LEGS ---
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.13, 0.75, 0);

  const legUpperGeo = new THREE.BoxGeometry(0.2, 0.42, 0.22);
  const leftLegUpper = new THREE.Mesh(legUpperGeo, whiteMat);
  leftLegUpper.position.set(0, -0.21, 0);
  leftLegUpper.receiveShadow = true;
  leftLegGroup.add(leftLegUpper);

  const bootGeo = new THREE.BoxGeometry(0.21, 0.33, 0.24);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.585, 0.01);
  leftBoot.receiveShadow = true;
  leftLegGroup.add(leftBoot);

  root.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.13, 0.75, 0);

  const rightLegUpper = new THREE.Mesh(legUpperGeo, whiteMat);
  rightLegUpper.position.set(0, -0.21, 0);
  rightLegUpper.receiveShadow = true;
  rightLegGroup.add(rightLegUpper);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.585, 0.01);
  rightBoot.receiveShadow = true;
  rightLegGroup.add(rightBoot);

  root.add(rightLegGroup);

  // --- 5. FLOWING CAPE (Behind Shoulders) ---
  const capeGroup = new THREE.Group();
  capeGroup.position.set(0, 1.38, -0.14);

  const capeGeo = new THREE.BoxGeometry(0.44, 0.88, 0.03);
  capeGeo.translate(0, -0.44, 0);
  const capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.receiveShadow = true;
  capeGroup.add(capeMesh);

  root.add(capeGroup);

  // --- 6. ROYAL SWORD & SCABBARD ---
  // A. Hip Scabbard (Always on Left Hip)
  const scabbardGroup = new THREE.Group();
  scabbardGroup.position.set(-0.26, 0.78, 0);
  scabbardGroup.rotation.z = 0.22;
  scabbardGroup.rotation.y = 0.15;

  const scabbardMat = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.6 });
  const goldMetalMat = new THREE.MeshStandardMaterial({
    color: 0xf5c227,
    metalness: 0.85,
    roughness: 0.25,
  });
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xd81436,
    metalness: 0.5,
    roughness: 0.2,
  });

  // Scabbard sheath body
  const scabbardGeo = new THREE.BoxGeometry(0.065, 0.72, 0.09);
  const scabbardMesh = new THREE.Mesh(scabbardGeo, scabbardMat);
  scabbardMesh.position.y = -0.25;
  scabbardGroup.add(scabbardMesh);

  // Scabbard gold chape (tip) & locket (mouth)
  const locketGeo = new THREE.BoxGeometry(0.075, 0.08, 0.1);
  const locket = new THREE.Mesh(locketGeo, goldMetalMat);
  locket.position.y = 0.08;
  scabbardGroup.add(locket);

  const chapeGeo = new THREE.BoxGeometry(0.07, 0.08, 0.095);
  const chape = new THREE.Mesh(chapeGeo, goldMetalMat);
  chape.position.y = -0.58;
  scabbardGroup.add(chape);

  // B. Sheathed Sword Hilt (Visible ONLY when sword is NOT drawn)
  const sheathedHiltGroup = new THREE.Group();
  sheathedHiltGroup.position.y = 0.12;

  const sheathedCrossguardGeo = new THREE.BoxGeometry(0.16, 0.04, 0.08);
  const sheathedCrossguard = new THREE.Mesh(sheathedCrossguardGeo, goldMetalMat);
  sheathedHiltGroup.add(sheathedCrossguard);

  const sheathedGripGeo = new THREE.BoxGeometry(0.045, 0.16, 0.05);
  const sheathedGrip = new THREE.Mesh(sheathedGripGeo, scabbardMat);
  sheathedGrip.position.y = 0.1;
  sheathedHiltGroup.add(sheathedGrip);

  const sheathedPommelGeo = new THREE.BoxGeometry(0.07, 0.05, 0.07);
  const sheathedPommel = new THREE.Mesh(sheathedPommelGeo, goldMetalMat);
  sheathedPommel.position.y = 0.2;
  sheathedHiltGroup.add(sheathedPommel);

  // Ruby gem on pommel
  const sheathedRubyGeo = new THREE.BoxGeometry(0.04, 0.04, 0.08);
  const sheathedRuby = new THREE.Mesh(sheathedRubyGeo, rubyMat);
  sheathedRuby.position.y = 0.2;
  sheathedHiltGroup.add(sheathedRuby);

  scabbardGroup.add(sheathedHiltGroup);
  root.add(scabbardGroup);

  // C. Held Sword in Right Hand (Visible ONLY when sword IS drawn)
  const heldSwordGroup = new THREE.Group();
  // Attach at the bottom of the right arm where hand grips
  heldSwordGroup.position.set(0, -0.62, 0.04);
  // Grip orientation: sword extends forward (+Z) and slightly tilted upward (+Y) in FRONT of the character
  heldSwordGroup.rotation.x = Math.PI / 2 - 0.25; // Directly FORWARD in front of the Sultan!
  heldSwordGroup.rotation.y = 0.0;
  heldSwordGroup.rotation.z = -0.08;
  heldSwordGroup.visible = false; // Initially sheathed

  // Sword Grip Handle
  const heldGripGeo = new THREE.BoxGeometry(0.045, 0.18, 0.045);
  const heldGrip = new THREE.Mesh(heldGripGeo, scabbardMat);
  heldGrip.position.y = -0.02;
  heldSwordGroup.add(heldGrip);

  // Pommel
  const heldPommel = new THREE.Mesh(sheathedPommelGeo, goldMetalMat);
  heldPommel.position.y = -0.12;
  heldSwordGroup.add(heldPommel);

  const heldRuby = new THREE.Mesh(sheathedRubyGeo, rubyMat);
  heldRuby.position.y = -0.12;
  heldSwordGroup.add(heldRuby);

  // Royal Golden Crossguard
  const heldCrossguardGeo = new THREE.BoxGeometry(0.22, 0.045, 0.08);
  const heldCrossguard = new THREE.Mesh(heldCrossguardGeo, goldMetalMat);
  heldCrossguard.position.y = 0.08;
  heldSwordGroup.add(heldCrossguard);

  // Crossguard jewels
  const guardGemGeo = new THREE.BoxGeometry(0.04, 0.04, 0.09);
  const guardGem = new THREE.Mesh(guardGemGeo, rubyMat);
  guardGem.position.y = 0.08;
  heldSwordGroup.add(guardGem);

  // Gleaming Royal Steel Blade
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe8eff8,
    metalness: 0.95,
    roughness: 0.12,
  });

  const bladeGeo = new THREE.BoxGeometry(0.075, 0.82, 0.025);
  bladeGeo.translate(0, 0.41, 0); // Origin at base of blade
  const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
  bladeMesh.position.y = 0.1;
  bladeMesh.castShadow = true;
  heldSwordGroup.add(bladeMesh);

  // Blade Golden Fuller / Ridge down the center
  const fullerGeo = new THREE.BoxGeometry(0.02, 0.68, 0.03);
  fullerGeo.translate(0, 0.34, 0);
  const fullerMesh = new THREE.Mesh(fullerGeo, goldMetalMat);
  fullerMesh.position.y = 0.1;
  heldSwordGroup.add(fullerMesh);

  // Blade Tapered Tip (Minecraft 45° step tip)
  const tipGeo = new THREE.BoxGeometry(0.05, 0.08, 0.024);
  const tipMesh = new THREE.Mesh(tipGeo, bladeMat);
  tipMesh.position.set(0, 0.94, 0);
  heldSwordGroup.add(tipMesh);

  rightArmGroup.add(heldSwordGroup);

  // D. Dynamic Sword Slash Crescent Trail Effect (strictly IN FRONT of Sultan)
  const slashArcGeo = new THREE.RingGeometry(0.65, 1.25, 32, 1, 0, Math.PI * 0.85);
  const slashArcMat = new THREE.MeshBasicMaterial({
    color: 0x9be8ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const slashTrailMesh = new THREE.Mesh(slashArcGeo, slashArcMat);
  slashTrailMesh.rotation.x = Math.PI / 2 - 0.25;
  slashTrailMesh.rotation.z = -0.4;
  slashTrailMesh.position.set(0.15, 1.05, 0.7);
  slashTrailMesh.visible = false;
  root.add(slashTrailMesh);

  // --- 7. SOFT GROUND CONTACT SHADOW DISC ---
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(10, 25, 10, 0.7)');
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
  shadowMesh.position.y = 0.02;
  shadowMesh.renderOrder = 2;
  scene.add(shadowMesh);

  scene.add(root);

  // Register with LOD Manager so Sultan is never frustum culled or hidden
  lodManager.register({
    id: 'sultan_achour_10',
    root,
    getPosition: () => position,
    setTier: () => {},
    isImportant: true,
  });

  // Kinematics and Movement State
  const SOLE_OFFSET = 0.04;
  const position = new THREE.Vector3(0, SOLE_OFFSET, 0);
  let velocityY = 0;
  let currentAngle = 0;
  let targetAngle = 0;
  let currentState: AnimationState = 'idle';
  let grounded = true;
  let distanceSinceFootstep = 0;
  let animTimer = 0;

  // Combat & Sword State
  let isSwordDrawn = false;
  let prevSwordDrawn = false;
  let isDrawingSword = false;
  let drawTimer = 0;
  const DRAW_DURATION = 0.38; // 380ms forward draw animation

  let isAttacking = false;
  let attackTimer = 0;
  const ATTACK_DURATION = 0.52; // 520ms snappy realistic forward slash
  let hasPlayedSlashSound = false;
  let prevAttackControl = false;

  const WALK_SPEED = 3.4;
  const RUN_SPEED = 7.2;
  const JUMP_FORCE = 7.4;
  const GRAVITY = 21.0;
  const ROTATION_SMOOTHING = 12.0;

  const update = (
    delta: number,
    controls: ControlState,
    cameraYaw: number,
    getHeight: (x: number, z: number, currentY?: number) => number
  ) => {
    const clampedDelta = Math.min(delta, 0.08);

    // 0. Sword Draw & Sheath Synchronization
    if (controls.isSwordDrawn !== prevSwordDrawn) {
      prevSwordDrawn = controls.isSwordDrawn;
      if (controls.isSwordDrawn) {
        // Trigger forward drawing animation from hip across front
        isDrawingSword = true;
        drawTimer = 0;
        soundManager.playSwordDraw();
      } else {
        // Sheath back to hip
        isDrawingSword = false;
        isSwordDrawn = false;
        soundManager.playSwordSheath();
      }
    }

    // Trigger attack on rising edge of isAttacking control
    if (controls.isAttacking && !prevAttackControl && !isAttacking) {
      isAttacking = true;
      attackTimer = 0;
      hasPlayedSlashSound = false;
      isDrawingSword = false;

      // Auto-draw sword immediately if attacking while sheathed
      if (!isSwordDrawn) {
        isSwordDrawn = true;
        prevSwordDrawn = true;
        controls.isSwordDrawn = true;
        soundManager.playSwordDraw();
      }
    }
    prevAttackControl = !!controls.isAttacking;

    // Handle sword drawing progress in front of body
    if (isDrawingSword) {
      drawTimer += clampedDelta;
      const drawProgress = Math.min(1.0, drawTimer / DRAW_DURATION);

      // Halfway through draw gesture, the blade emerges from the scabbard into the hand in front
      if (drawProgress >= 0.35 && !isSwordDrawn) {
        isSwordDrawn = true;
      }

      if (drawProgress >= 1.0) {
        isDrawingSword = false;
      }
    }

    // Toggle 3D mesh visibility
    sheathedHiltGroup.visible = !isSwordDrawn;
    heldSwordGroup.visible = isSwordDrawn;

    // 1. Throne Seating Controller (جلوس السلطان فوق العرش)
    const isSitting = !!controls.isSittingOnThrone;
    if (isSitting) {
      // Snap position smoothly onto the Royal Throne Seat Cushion (Facing Entrance -Z)
      position.x = THREE.MathUtils.damp(position.x, 0.0, 14, clampedDelta);
      position.y = THREE.MathUtils.damp(position.y, 1.48, 14, clampedDelta);
      position.z = THREE.MathUtils.damp(position.z, 42.9, 14, clampedDelta);
      currentAngle = THREE.MathUtils.damp(currentAngle, Math.PI, 14, clampedDelta);
      root.rotation.y = currentAngle;
      root.position.copy(position);

      grounded = true;
      currentState = 'idle';

      // Seated pose:
      // Legs bent forward at 90 degrees to sit on the cushion
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, -Math.PI / 2 + 0.12, 16, clampedDelta);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, -Math.PI / 2 + 0.12, 16, clampedDelta);
      leftLegGroup.position.z = THREE.MathUtils.damp(leftLegGroup.position.z, 0.18, 16, clampedDelta);
      rightLegGroup.position.z = THREE.MathUtils.damp(rightLegGroup.position.z, 0.18, 16, clampedDelta);

      // Torso rests upright against throne golden backrest
      torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, -0.05, 12, clampedDelta);
      torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0.0, 12, clampedDelta);

      // Arms rest royally upon the golden armrests
      leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.42, 14, clampedDelta);
      leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, -0.15, 14, clampedDelta);
      leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.32, 14, clampedDelta);

      rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.42, 14, clampedDelta);
      rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, 0.15, 14, clampedDelta);
      rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.32, 14, clampedDelta);

      // Head holds regal posture with gentle breathing
      const breath = Math.sin(animTimer) * 0.025;
      headGroup.position.y = 1.41 + breath * 0.3;
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, breath * 0.4, 10, clampedDelta);
      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.0, 10, clampedDelta);

      // Cape drapes smoothly behind the throne
      capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, 0.12, 10, clampedDelta);

      // Shadow under throne
      shadowMesh.position.set(0, 0.98, 43.1);
      (shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.5;

      return;
    } else {
      // Reset leg position offset when standing
      leftLegGroup.position.z = THREE.MathUtils.damp(leftLegGroup.position.z, 0.0, 16, clampedDelta);
      rightLegGroup.position.z = THREE.MathUtils.damp(rightLegGroup.position.z, 0.0, 16, clampedDelta);
    }

    // 1.5 Horse Mounted Controller (ركوب الحصان الملكي العربي)
    if (controls.isRidingHorse && controls.horsePos) {
      // Sync Sultan's position directly on top of the horse saddle
      position.x = controls.horsePos.x;
      position.y = controls.horsePos.y + 1.28;
      position.z = controls.horsePos.z;
      if (controls.horseAngle !== undefined) {
        currentAngle = controls.horseAngle;
      }

      root.rotation.y = currentAngle;
      root.position.copy(position);
      grounded = true;

      const speedRatio = controls.horseSpeedRatio || 0;
      currentState = speedRatio > 0.5 ? 'run' : speedRatio > 0.05 ? 'walk' : 'idle';

      // Riding pose:
      // Legs astride the horse flanks
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, -0.62, 14, clampedDelta);
      leftLegGroup.rotation.z = THREE.MathUtils.damp(leftLegGroup.rotation.z, -0.34, 14, clampedDelta);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, -0.62, 14, clampedDelta);
      rightLegGroup.rotation.z = THREE.MathUtils.damp(rightLegGroup.rotation.z, 0.34, 14, clampedDelta);

      // Riding posture bounce
      const gallopBounce = Math.sin(animTimer * (speedRatio > 0.5 ? 18.0 : 9.0)) * (speedRatio * 0.07);
      torsoGroup.position.y = 0.75 + gallopBounce;
      torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, -0.12 + (speedRatio * 0.08), 12, clampedDelta);

      // Hands holding reins
      leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.85, 14, clampedDelta);
      leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0.22, 14, clampedDelta);
      rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.85, 14, clampedDelta);
      rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, -0.22, 14, clampedDelta);

      // Cape flowing behind during gallop
      capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, 0.25 + speedRatio * 0.6, 12, clampedDelta);

      // Shadow hidden while riding because horse has its own shadow
      shadowMesh.position.set(position.x, position.y - 1.25, position.z);
      (shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0;

      return;
    } else {
      // Restore leg rotation.z when dismounted
      leftLegGroup.rotation.z = THREE.MathUtils.damp(leftLegGroup.rotation.z, 0.0, 16, clampedDelta);
      rightLegGroup.rotation.z = THREE.MathUtils.damp(rightLegGroup.rotation.z, 0.0, 16, clampedDelta);
      torsoGroup.position.y = THREE.MathUtils.damp(torsoGroup.position.y, 0.75, 16, clampedDelta);
    }

    // 2. Inputs & Direction
    const inputX = controls.moveX;
    const inputZ = controls.moveY;
    const inputMagnitude = Math.hypot(inputX, inputZ);

    const isMoving = inputMagnitude > 0.08;
    const isSprinting = isMoving && (controls.isRunning || (!controls.isWalking && inputMagnitude > 0.8));

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

    // Smooth character rotation
    let angleDiff = targetAngle - currentAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentAngle += angleDiff * Math.min(1, ROTATION_SMOOTHING * clampedDelta);
    root.rotation.y = currentAngle;

    // Translation with Rock-Solid Wall & Obstacle Collision Sliding
    const baseSpeed = isSprinting ? RUN_SPEED : WALK_SPEED;
    const currentSpeed = isMoving ? baseSpeed * Math.min(1, inputMagnitude) : 0;

    if (isMoving) {
      const deltaX = moveDirX * currentSpeed * clampedDelta;
      const deltaZ = moveDirZ * currentSpeed * clampedDelta;
      // Slidably resolves horizontal collision with walls, columns, doors, and dungeon barriers
      const resolved = collisionSystem.resolveMovement(position, deltaX, deltaZ, 0.38);
      position.x = resolved.x;
      position.z = resolved.z;
    }

    // World boundary
    const distFromCenter = Math.hypot(position.x, position.z);
    if (distFromCenter > 95) {
      position.x = (position.x / distFromCenter) * 95;
      position.z = (position.z / distFromCenter) * 95;
    }

    // 2. Physics & Ground Snapping
    const rawGroundHeight = getHeight(position.x, position.z, position.y);
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
        currentState = isAttacking ? 'attack' : (isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        soundManager.playLand();
      } else {
        currentState = velocityY > 0 ? 'jump' : 'fall';
      }

      // Ceiling Collision Check
      const ceilingY = collisionSystem.getCeilingY(position.x, position.z, position.y);
      if (ceilingY !== null && position.y > ceilingY - 1.85) {
        position.y = ceilingY - 1.85;
        if (velocityY > 0) velocityY = 0;
      }
    } else {
      if (position.y < targetGroundY) {
        position.y = targetGroundY;
      } else {
        position.y = THREE.MathUtils.damp(position.y, targetGroundY, 28, clampedDelta);
      }
    }

    root.position.copy(position);

    // Update Shadow
    shadowMesh.position.set(position.x, rawGroundHeight + 0.03, position.z);
    const airOffset = Math.max(0, position.y - targetGroundY);
    const shadowOpacity = Math.max(0.12, 0.75 - airOffset * 0.35);
    (shadowMesh.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
    const shadowScale = Math.max(0.6, 1.0 - airOffset * 0.15);
    shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);

    // 3. State & Procedural Minecraft Animation System
    if (grounded) {
      if (isAttacking) currentState = 'attack';
      else if (!isMoving) currentState = 'idle';
      else if (isSprinting) currentState = 'run';
      else currentState = 'walk';
    }

    const animSpeed = isSprinting ? 14 : (isMoving ? 8.5 : 2.0);
    animTimer += clampedDelta * animSpeed;

    // Base leg movements
    if (!grounded) {
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, 0.35, 15, clampedDelta);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, -0.2, 15, clampedDelta);
    } else if (isMoving) {
      const limbAmplitude = isSprinting ? 0.95 : 0.65;
      const swing = Math.sin(animTimer) * limbAmplitude;
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, -swing, 20, clampedDelta);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, swing, 20, clampedDelta);
    } else {
      leftLegGroup.rotation.x = THREE.MathUtils.damp(leftLegGroup.rotation.x, 0.0, 10, clampedDelta);
      rightLegGroup.rotation.x = THREE.MathUtils.damp(rightLegGroup.rotation.x, 0.0, 10, clampedDelta);
    }

    // 4. ANIMATION CONTROLLER: DRAWING / ATTACKING / COMBAT GUARD (ALL IN FRONT!)
    if (isAttacking) {
      // -------------------------------------------------------------
      // REALISTIC FORWARD SWORD STRIKE (STRICTLY IN FRONT OF SULTAN!)
      // -------------------------------------------------------------
      attackTimer += clampedDelta;
      const progress = Math.min(1.0, attackTimer / ATTACK_DURATION);

      if (progress < 0.22) {
        // --- PHASE 1: Windup in Front (0.0 to 0.22) ---
        // Right arm raises high above and in front of the right shoulder
        const t = progress / 0.22;
        const easeIn = t * t;

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.65, -1.65, easeIn); // High forward raise
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(-0.22, 0.42, easeIn);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(0.25, 0.62, easeIn);

        // Counter-balance left arm in front
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.3, 20, clampedDelta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.35, 20, clampedDelta);

        // Torso rotates back slightly to gather strike power
        torsoGroup.rotation.y = THREE.MathUtils.lerp(0.0, 0.28, easeIn);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(0.0, -0.06, easeIn);
        headGroup.rotation.y = THREE.MathUtils.lerp(0.0, -0.15, easeIn);

        slashTrailMesh.visible = false;
      } else if (progress < 0.62) {
        // --- PHASE 2: Powerful Forward Diagonal Slash (0.22 to 0.62) ---
        // Slashes forward and diagonally down across front of chest to lower-left
        const t = (progress - 0.22) / 0.40;
        const strikeEase = 1 - Math.pow(1 - t, 3);

        if (!hasPlayedSlashSound) {
          soundManager.playSwordSlash();
          hasPlayedSlashSound = true;
        }

        // Arm cuts down and forward (rotation.x stays strictly NEGATIVE so it never goes behind!)
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(-1.65, -0.38, strikeEase);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(0.42, -0.72, strikeEase);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(0.62, -0.28, strikeEase);

        // Torso drives forward into the slash
        torsoGroup.rotation.y = THREE.MathUtils.lerp(0.28, -0.42, strikeEase);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(-0.06, 0.16, strikeEase);
        headGroup.rotation.y = THREE.MathUtils.lerp(-0.15, 0.15, strikeEase);

        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.45, 20, clampedDelta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.45, 20, clampedDelta);

        // Forward Crescent Slash Trail sweeps in front
        slashTrailMesh.visible = true;
        const trailAlpha = Math.sin(t * Math.PI);
        (slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = 0.95 * trailAlpha;
        slashTrailMesh.rotation.z = -0.55 + t * 0.95;
        slashTrailMesh.scale.setScalar(0.95 + trailAlpha * 0.25);
      } else {
        // --- PHASE 3: Follow-through and Recovery to Front Guard (0.62 to 1.0) ---
        const t = (progress - 0.62) / 0.38;
        const easeOut = 1 - Math.pow(1 - t, 2);

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.38, -0.65, easeOut);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(-0.72, -0.22, easeOut);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.28, 0.25, easeOut);

        torsoGroup.rotation.y = THREE.MathUtils.lerp(-0.42, 0.0, easeOut);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(0.16, 0.0, easeOut);
        headGroup.rotation.y = THREE.MathUtils.lerp(0.15, 0.0, easeOut);

        (slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.25);
        if (t > 0.5) slashTrailMesh.visible = false;
      }

      capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, 0.45, 15, clampedDelta);

      if (progress >= 1.0) {
        isAttacking = false;
        slashTrailMesh.visible = false;
      }
    } else if (isDrawingSword) {
      // -------------------------------------------------------------
      // DRAWING SWORD IN FRONT: Hand reaches across front to hip, pulls sword forward!
      // -------------------------------------------------------------
      slashTrailMesh.visible = false;
      const t = Math.min(1.0, drawTimer / DRAW_DURATION);

      if (t < 0.4) {
        // Hand reaches across the front of the abdomen to the left hip
        const p = t / 0.4;
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(0.0, -0.38, p);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(0.0, -0.75, p);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(0.06, -0.28, p);
        torsoGroup.rotation.y = THREE.MathUtils.lerp(0.0, -0.2, p);
      } else {
        // Hand pulls sword out forward from the hip into ready guard in front
        const p = (t - 0.4) / 0.6;
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.38, -0.65, p);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(-0.75, -0.22, p);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.28, 0.25, p);
        torsoGroup.rotation.y = THREE.MathUtils.lerp(-0.2, 0.0, p);
      }

      leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.2, 12, clampedDelta);
      leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.15, 12, clampedDelta);
    } else {
      // -------------------------------------------------------------
      // STANDARD NON-ATTACKING POSES (WITH SWORD IN FRONT GUARD IF DRAWN)
      // -------------------------------------------------------------
      slashTrailMesh.visible = false;

      if (!grounded) {
        // Jumping / In Air Pose
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.6, 15, clampedDelta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.25, 15, clampedDelta);
        leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0.0, 15, clampedDelta);

        if (isSwordDrawn) {
          // Sword held ready in air in front of chest
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.85, 15, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, -0.22, 15, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.32, 15, clampedDelta);
        } else {
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.6, 15, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, 0.0, 15, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.25, 15, clampedDelta);
        }

        capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, 0.65, 12, clampedDelta);
        headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, -0.1, 15, clampedDelta);
        headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.0, 15, clampedDelta);
        torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, 0.0, 15, clampedDelta);
        torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0.0, 15, clampedDelta);
      } else if (isMoving) {
        const limbAmplitude = isSprinting ? 0.95 : 0.65;
        const swing = Math.sin(animTimer) * limbAmplitude;

        // Left Arm natural swing
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, swing, 20, clampedDelta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, 0.0, 15, clampedDelta);
        leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0.0, 15, clampedDelta);

        if (isSwordDrawn) {
          // Combat run/walk: Sword held ready forward in front of chest
          const subtleArmSway = Math.sin(animTimer * 0.8) * 0.08;
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.65 + subtleArmSway, 15, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, -0.22, 15, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.25, 15, clampedDelta);
        } else {
          // Normal arm swing
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -swing, 20, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.0, 15, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, 0.0, 15, clampedDelta);
        }

        const lean = isSprinting ? 0.18 : 0.06;
        torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, lean, 15, clampedDelta);
        torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0.0, 15, clampedDelta);

        headGroup.position.y = 1.41 + Math.abs(Math.sin(animTimer * 2)) * 0.025;
        headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, lean * 0.5, 15, clampedDelta);
        headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.0, 15, clampedDelta);

        const capeBase = isSprinting ? 0.55 : 0.28;
        const capeFlutter = Math.sin(animTimer * 1.5) * 0.12;
        capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, capeBase + capeFlutter, 15, clampedDelta);
      } else {
        // Regal Idle Standing
        const breath = Math.sin(animTimer) * 0.035;

        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, 0.0, 10, clampedDelta);
        leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0.0, 10, clampedDelta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.06 + breath, 10, clampedDelta);

        if (isSwordDrawn) {
          // Combat Ready Guard Stance IN FRONT OF CHEST
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, -0.65 + breath, 12, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, -0.22, 12, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.25, 12, clampedDelta);

          leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, -0.25 + breath, 12, clampedDelta);
          leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.15, 12, clampedDelta);
        } else {
          // Regular Royal Idle
          rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, 0.0, 10, clampedDelta);
          rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, 0.0, 10, clampedDelta);
          rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 0.06 - breath, 10, clampedDelta);
        }

        torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, 0.0, 10, clampedDelta);
        torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0.0, 10, clampedDelta);
        headGroup.position.y = 1.41 + breath * 0.3;
        headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, breath * 0.4, 10, clampedDelta);
        headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.0, 10, clampedDelta);

        const capeBreeze = 0.08 + Math.sin(animTimer * 0.7) * 0.04;
        capeGroup.rotation.x = THREE.MathUtils.damp(capeGroup.rotation.x, capeBreeze, 10, clampedDelta);
      }
    }

    // Footstep audio
    if (grounded && isMoving) {
      const stepDistance = isSprinting ? 1.6 : 1.1;
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
    model: root,
    mixer: null,
    update,
    getPosition: () => position,
    setPosition: (newPos: THREE.Vector3) => {
      position.copy(newPos);
      root.position.copy(position);
    },
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
