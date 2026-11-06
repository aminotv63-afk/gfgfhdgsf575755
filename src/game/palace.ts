import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { soundManager } from '../utils/audio';
import { collisionSystem } from './collision';
import { lodManager } from './lodManager';

// Royal Banner with Algerian Golden Crescent & Star of Achour 10
function createRoyalBanner(clothColor: number = 0x8a101b): THREE.Group {
  const bannerGroup = new THREE.Group();
  bannerGroup.name = 'RoyalBanner_Achour10';

  // Wooden flagpole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 3.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 })
  );
  pole.position.y = 1.9;
  pole.castShadow = true;
  bannerGroup.add(pole);

  // Golden finial on top
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4a528, metalness: 0.85, roughness: 0.2 })
  );
  finial.position.y = 3.85;
  bannerGroup.add(finial);

  // Velvet cloth flag
  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 1.8, 1.15),
    new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.65 })
  );
  cloth.position.set(0.02, 2.7, 0.58);
  cloth.castShadow = true;
  bannerGroup.add(cloth);

  // Golden Royal Crescent Emblem
  const crescent = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.05, 8, 16, Math.PI * 1.55),
    new THREE.MeshStandardMaterial({ color: 0xd4a528, metalness: 0.85, roughness: 0.2 })
  );
  crescent.rotation.y = Math.PI / 2;
  crescent.rotation.z = Math.PI * 0.2;
  crescent.position.set(0.035, 2.7, 0.58);
  bannerGroup.add(crescent);

  return bannerGroup;
}

export interface InteractiveDoor {
  id: string;
  name: string;
  pivot: THREE.Group;
  isOpen: boolean;
  openAngle: number;
  closedAngle: number;
  colliderId: string;
  colliderBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export interface GuardNPC {
  id: string;
  name: string;
  root: THREE.Group;
  postPos: THREE.Vector3;
  postAngle: number;
  currentPos: THREE.Vector3;
  currentAngle: number;
  targetPos: THREE.Vector3;
  targetAngle: number;
  state: 'guarding' | 'walking' | 'kneeling' | 'saluting' | 'opening_door' | 'returning';
  spearPivot: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  torso: THREE.Mesh;
  doorToOpen?: InteractiveDoor;
  update: (delta: number, sultanPos?: THREE.Vector3) => void;
  kneel: () => void;
  stand: () => void;
  salute: () => void;
  returnToPost: () => void;
}

export interface PalaceSystem {
  group: THREE.Group;
  getHeight: (x: number, z: number, currentY?: number) => number | null;
  update: (delta: number, sultanPos?: THREE.Vector3) => void;
  isNearThrone: (sultanPos?: THREE.Vector3) => boolean;
  isNearGate: (sultanPos?: THREE.Vector3) => boolean;
  toggleGate: () => void;
  openAllDoors: () => void;
  closeAllDoors: () => void;
  kneelAllPalaceGuards: () => void;
  standAllPalaceGuards: () => void;
  returnAllPalaceGuardsToPosts: () => void;
  getDoors: () => InteractiveDoor[];
  getGuards: () => GuardNPC[];
}

// Procedural Canvas Textures
function createPalaceWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d2be9b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#a69070';
  ctx.lineWidth = 3;

  const rowHeight = 32;
  const colWidth = 64;

  for (let y = 0; y < 256; y += rowHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    const offset = (y / rowHeight) % 2 === 0 ? 0 : colWidth / 2;
    for (let x = offset; x < 256; x += colWidth) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowHeight);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 600; i++) {
    const rx = Math.random() * 256;
    const ry = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 245, 230, 0.25)' : 'rgba(120, 100, 80, 0.2)';
    ctx.fillRect(rx, ry, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPalaceFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b8a892';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#8a7a66';
  ctx.lineWidth = 2;

  const size = 32;
  for (let y = 0; y < 256; y += size) {
    for (let x = 0; x < 256; x += size) {
      ctx.strokeRect(x, y, size, size);
      if ((x + y) % (size * 2) === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWoodDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a2c11';
  ctx.fillRect(0, 0, 256, 256);

  const plankW = 42;
  ctx.strokeStyle = '#2d1808';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 256; x += plankW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * 256;
    const ry = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 55, 25, 0.4)' : 'rgba(30, 15, 5, 0.35)';
    ctx.fillRect(rx, ry, 2, 8 + Math.random() * 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Factory to create fully articulated Palace Guard NPCs with AI state machine
export function createPalaceGuardNPC(
  id: string,
  name: string,
  postX: number,
  postY: number,
  postZ: number,
  postAngle: number
): GuardNPC {
  const root = new THREE.Group();
  root.position.set(postX, postY, postZ);
  root.rotation.y = postAngle;

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x5a636b, metalness: 0.8, roughness: 0.35 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a726, metalness: 0.85, roughness: 0.25 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x82141c, roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfb892, roughness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.6 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.28), crimsonMat);
  torso.position.y = 1.08;
  torso.castShadow = true;
  root.add(torso);

  // Breastplate & Golden Crest
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.3), ironMat);
  plate.position.set(0, 1.12, 0.01);
  root.add(plate);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.32), goldMat);
  crest.position.set(0, 1.15, 0.01);
  root.add(crest);

  // Head & Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0);
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), ironMat);
  headGroup.add(helmet);

  const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.04), skinMat);
  faceMesh.position.set(0, -0.02, 0.18);
  headGroup.add(faceMesh);

  // Guard Mustache & Plume
  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x140a04 }));
  mustache.position.set(0, -0.04, 0.2);
  headGroup.add(mustache);

  const plume = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.36), crimsonMat);
  plume.position.set(0, 0.28, -0.02);
  headGroup.add(plume);
  root.add(headGroup);

  // Legs & Boots
  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.2);
  const leftLeg = new THREE.Mesh(legGeo, crimsonMat);
  leftLeg.position.set(-0.13, 0.36, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, crimsonMat);
  rightLeg.position.set(0.13, 0.36, 0);
  root.add(rightLeg);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.24, 0.24), bootMat);
  leftBoot.position.set(-0.13, 0.12, 0.02);
  root.add(leftBoot);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.24, 0.24), bootMat);
  rightBoot.position.set(0.13, 0.12, 0.02);
  root.add(rightBoot);

  // Shield
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.68, 0.42), ironMat);
  const shieldBoss = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.16), goldMat);
  shield.add(shieldBoss);
  shield.position.set(-0.35, 1.05, 0.1);
  root.add(shield);

  // Spear Pivot & Spear
  const spearPivot = new THREE.Group();
  spearPivot.position.set(0.32, 1.25, 0.15);

  const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6), woodMat);
  const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 4), ironMat);
  spearHead.position.y = 1.35;
  spearShaft.add(spearHead);
  spearShaft.castShadow = true;
  spearPivot.add(spearShaft);
  root.add(spearPivot);

  // Shadow
  const shadowGeo = new THREE.CircleGeometry(0.55, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
  shadow.position.y = 0.02;
  root.add(shadow);

  // State
  const postPos = new THREE.Vector3(postX, postY, postZ);
  const currentPos = postPos.clone();
  const targetPos = postPos.clone();
  let currentAngle = postAngle;
  let targetAngle = postAngle;
  let guardState: GuardNPC['state'] = 'guarding';
  let walkAnimTimer = 0;

  const guardObj: GuardNPC = {
    id,
    name,
    root,
    postPos,
    postAngle,
    currentPos,
    currentAngle,
    targetPos,
    targetAngle,
    state: guardState,
    spearPivot,
    headGroup,
    leftLeg,
    rightLeg,
    torso,
    kneel: () => {
      guardState = 'kneeling';
      guardObj.state = 'kneeling';
    },
    stand: () => {
      guardState = 'guarding';
      guardObj.state = 'guarding';
    },
    salute: () => {
      guardState = 'saluting';
      guardObj.state = 'saluting';
    },
    returnToPost: () => {
      targetPos.copy(postPos);
      targetAngle = postAngle;
      guardState = 'returning';
      guardObj.state = 'returning';
    },
    update: (delta: number, sultanPos?: THREE.Vector3) => {
      walkAnimTimer += delta * 6;

      // Handle States
      if (guardState === 'kneeling') {
        // Deep reverence bow / kneel
        torso.position.y = THREE.MathUtils.damp(torso.position.y, 0.65, 12, delta);
        torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 0.65, 12, delta);
        headGroup.position.y = THREE.MathUtils.damp(headGroup.position.y, 1.05, 12, delta);
        headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, 0.75, 12, delta);
        leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, -0.85, 12, delta);
        rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, -0.85, 12, delta);
        spearPivot.rotation.x = THREE.MathUtils.damp(spearPivot.rotation.x, 0.45, 12, delta);
      } else if (guardState === 'walking' || guardState === 'returning') {
        // Move towards target
        const dx = targetPos.x - currentPos.x;
        const dz = targetPos.z - currentPos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.1) {
          const moveSpeed = 2.2;
          const step = Math.min(dist, moveSpeed * delta);
          currentPos.x += (dx / dist) * step;
          currentPos.z += (dz / dist) * step;

          targetAngle = Math.atan2(dx, dz);
          const swing = Math.sin(walkAnimTimer) * 0.65;
          leftLeg.rotation.x = -swing;
          rightLeg.rotation.x = swing;
          spearPivot.rotation.x = Math.sin(walkAnimTimer) * 0.2;
        } else {
          currentPos.copy(targetPos);
          targetAngle = postAngle;
          if (guardState === 'returning') {
            guardState = 'guarding';
            guardObj.state = 'guarding';
          }
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
        }

        torso.position.y = 1.08;
        torso.rotation.x = 0;
        headGroup.position.y = 1.62;
        headGroup.rotation.x = 0;
      } else {
        // Guarding / Standing / Saluting
        torso.position.y = 1.08 + Math.sin(walkAnimTimer * 0.3) * 0.008;
        torso.rotation.x = 0;
        headGroup.position.y = 1.62 + Math.sin(walkAnimTimer * 0.3) * 0.008;
        leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, delta);
        rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, delta);

        if (guardState === 'saluting') {
          spearPivot.rotation.x = THREE.MathUtils.damp(spearPivot.rotation.x, -0.45, 8, delta);
          spearPivot.position.z = THREE.MathUtils.damp(spearPivot.position.z, 0.3, 8, delta);
          if (sultanPos) {
            // Turn head towards King
            const toKingX = sultanPos.x - currentPos.x;
            const toKingZ = sultanPos.z - currentPos.z;
            const angleToKing = Math.atan2(toKingX, toKingZ) - currentAngle;
            headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, Math.max(-0.6, Math.min(0.6, angleToKing)), 8, delta);
          }
        } else {
          spearPivot.rotation.x = THREE.MathUtils.damp(spearPivot.rotation.x, 0, 6, delta);
          spearPivot.position.z = THREE.MathUtils.damp(spearPivot.position.z, 0.15, 6, delta);
          headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0, 6, delta);
          headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, 0, 6, delta);
        }
      }

      // Smooth angle interpolation
      let diff = targetAngle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      currentAngle += diff * Math.min(1, 8 * delta);

      root.position.copy(currentPos);
      root.rotation.y = currentAngle;
    },
  };

  lodManager.register({
    id,
    root,
    getPosition: () => currentPos,
    setTier: (tier) => {
      // At far tier, disable weapon/accessories casting shadow
      if (tier === 'far') {
        spearShaft.castShadow = false;
        torso.castShadow = false;
      } else {
        spearShaft.castShadow = true;
        torso.castShadow = true;
      }
    },
    isImportant: true, // Palace guards never disappear!
  });

  return guardObj;
}

export function buildGrandPalace(scene: THREE.Scene): PalaceSystem {
  const palaceGroup = new THREE.Group();
  palaceGroup.name = 'GrandPalace_Achour10';

  // Textures and Materials
  const wallTexture = createPalaceWallTexture();
  const floorTexture = createPalaceFloorTexture();
  const woodTexture = createWoodDoorTexture();

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.85,
    metalness: 0.1,
  });

  const darkWallMat = new THREE.MeshStandardMaterial({
    color: 0x3d3a36,
    roughness: 0.9,
    metalness: 0.15,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.7,
    metalness: 0.1,
  });

  const carpetMat = new THREE.MeshStandardMaterial({
    color: 0x8a101b,
    roughness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a528,
    metalness: 0.85,
    roughness: 0.25,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x24282c,
    metalness: 0.9,
    roughness: 0.4,
  });

  const columnMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcce,
    roughness: 0.6,
  });

  const doorWoodMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.65,
    metalness: 0.15,
  });

  const WALL_H = 6.8;

  // -----------------------------------------------------------------
  // 1. PALACE FLOOR & FOUNDATION
  // -----------------------------------------------------------------
  const floorGeo = new THREE.BoxGeometry(40, 0.24, 34);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, 0.12, 31);
  floorMesh.receiveShadow = true;
  palaceGroup.add(floorMesh);

  // Grand Royal Red Carpet Runner
  const carpetGeo = new THREE.BoxGeometry(3.6, 0.04, 25);
  const carpetMesh = new THREE.Mesh(carpetGeo, carpetMat);
  carpetMesh.position.set(0, 0.26, 26.5);
  carpetMesh.receiveShadow = true;
  palaceGroup.add(carpetMesh);

  // Carpet Gold Borders
  const carpetBorderL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 25), goldMat);
  carpetBorderL.position.set(-1.85, 0.26, 26.5);
  palaceGroup.add(carpetBorderL);

  const carpetBorderR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 25), goldMat);
  carpetBorderR.position.set(1.85, 0.26, 26.5);
  palaceGroup.add(carpetBorderR);

  // -----------------------------------------------------------------
  // 0. READY-MADE IMPORTED 3D CASTLE (قصر وقلعة المملكة العاشورية الحقيقية)
  // -----------------------------------------------------------------
  const castleGroup = new THREE.Group();
  castleGroup.name = 'ReadyMadeCastle_Achour10';
  palaceGroup.add(castleGroup);

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    '/models/castle.glb',
    (gltf) => {
      const castleScene = gltf.scene;

      // Center the castle around (0, 0, 0)
      castleScene.position.set(2.04, 0, 2.71);

      // Monumental fortress proportions
      const CASTLE_SCALE = 3.2;
      castleGroup.scale.set(CASTLE_SCALE, CASTLE_SCALE, CASTLE_SCALE);
      castleGroup.position.set(0, 0.12, 31.0);

      // Apply high-fidelity PBR architectural materials
      castleScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const matName = (mesh.material as THREE.Material)?.name || '';
          if (matName.includes('stone') || matName.includes('Stone')) {
            mesh.material = new THREE.MeshStandardMaterial({
              map: wallTexture,
              roughness: 0.85,
              metalness: 0.08,
              color: 0xdecbb5, // Rich Algerian limestone/sandstone
            });
          } else if (matName.includes('roof')) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0x8b1e22, // Royal Algerian terracotta crimson
              roughness: 0.55,
              metalness: 0.1,
            });
          } else if (matName.includes('wood')) {
            mesh.material = new THREE.MeshStandardMaterial({
              map: woodTexture,
              roughness: 0.7,
              metalness: 0.15,
              color: 0x4a3525,
            });
          } else if (matName.includes('glass')) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0x223344,
              roughness: 0.25,
              metalness: 0.6,
              transparent: true,
              opacity: 0.75,
            });
          }
        }
      });

      castleGroup.add(castleScene);

      // Add Grand Royal Banners with golden crescent to high towers
      [
        [-11.5, 14.8, 14.5],
        [11.5, 14.8, 14.5],
        [-11.5, 14.8, 47.0],
        [11.5, 14.8, 47.0],
      ].forEach(([bx, by, bz]) => {
        const banner = createRoyalBanner(0x8a101b);
        banner.position.set(bx, by, bz);
        palaceGroup.add(banner);
      });
    },
    undefined,
    (error) => {
      console.warn('Failed to load /models/castle.glb:', error);
    }
  );

  // -----------------------------------------------------------------
  // 2. OUTER WALLS (REGISTERED AS ROCK-SOLID COLLIDERS!)
  // -----------------------------------------------------------------
  // Outer Back Wall (Z = 48)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, WALL_H, 1.2), wallMat);
  backWall.position.set(0, WALL_H / 2 + 0.2, 48);
  backWall.visible = false; // Visually replaced by the magnificent ready-made 3D Castle!
  palaceGroup.add(backWall);

  collisionSystem.registerBox({
    id: 'palace_back_wall',
    minX: -20,
    maxX: 20,
    minZ: 47.4,
    maxZ: 48.6,
    minY: 0,
    maxY: WALL_H + 8,
    isActive: true,
  });

  // Outer Left Wall (X = -20)
  const leftOuterWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, WALL_H, 34), wallMat);
  leftOuterWall.position.set(-20, WALL_H / 2 + 0.2, 31);
  leftOuterWall.visible = false;
  palaceGroup.add(leftOuterWall);

  collisionSystem.registerBox({
    id: 'palace_left_wall',
    minX: -20.6,
    maxX: -19.4,
    minZ: 14,
    maxZ: 48,
    minY: 0,
    maxY: WALL_H + 8,
    isActive: true,
  });

  // Outer Right Wall (X = 20)
  const rightOuterWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, WALL_H, 34), wallMat);
  rightOuterWall.position.set(20, WALL_H / 2 + 0.2, 31);
  rightOuterWall.visible = false;
  palaceGroup.add(rightOuterWall);

  collisionSystem.registerBox({
    id: 'palace_right_wall',
    minX: 19.4,
    maxX: 20.6,
    minZ: 14,
    maxZ: 48,
    minY: 0,
    maxY: WALL_H + 8,
    isActive: true,
  });

  // Front Wall Sections (with central opening X: -3 to +3 for Entrance Gates)
  const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(17, WALL_H, 1.2), wallMat);
  frontWallL.position.set(-11.5, WALL_H / 2 + 0.2, 14);
  frontWallL.visible = false;
  palaceGroup.add(frontWallL);

  collisionSystem.registerBox({
    id: 'palace_front_wall_left',
    minX: -20,
    maxX: -3.0,
    minZ: 13.4,
    maxZ: 14.6,
    minY: 0,
    maxY: WALL_H + 8,
    isActive: true,
  });

  const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(17, WALL_H, 1.2), wallMat);
  frontWallR.position.set(11.5, WALL_H / 2 + 0.2, 14);
  frontWallR.visible = false;
  palaceGroup.add(frontWallR);

  collisionSystem.registerBox({
    id: 'palace_front_wall_right',
    minX: 3.0,
    maxX: 20,
    minZ: 13.4,
    maxZ: 14.6,
    minY: 0,
    maxY: WALL_H + 8,
    isActive: true,
  });

  // Register Castle 4 Corner Towers as solid cylindrical colliders
  collisionSystem.registerCylinder({
    id: 'castle_tower_front_left',
    x: -11.5,
    z: 14.5,
    radius: 2.8,
    minY: 0,
    maxY: WALL_H + 10,
    isActive: true,
  });
  collisionSystem.registerCylinder({
    id: 'castle_tower_front_right',
    x: 11.5,
    z: 14.5,
    radius: 2.8,
    minY: 0,
    maxY: WALL_H + 10,
    isActive: true,
  });
  collisionSystem.registerCylinder({
    id: 'castle_tower_back_left',
    x: -11.5,
    z: 47.0,
    radius: 2.8,
    minY: 0,
    maxY: WALL_H + 10,
    isActive: true,
  });
  collisionSystem.registerCylinder({
    id: 'castle_tower_back_right',
    x: 11.5,
    z: 47.0,
    radius: 2.8,
    minY: 0,
    maxY: WALL_H + 10,
    isActive: true,
  });

  // Archway lintel above entrance (opening height 4.2m)
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(6.2, WALL_H - 4.2, 1.2), wallMat);
  archLintel.position.set(0, 4.2 + (WALL_H - 4.2) / 2 + 0.2, 14);
  archLintel.visible = false;
  palaceGroup.add(archLintel);

  const archMolding = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 1.35), goldMat);
  archMolding.position.set(0, 4.3, 14);
  archMolding.visible = false;
  palaceGroup.add(archMolding);

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.18), goldMat);
  plaque.position.set(0, 5.0, 13.35);
  plaque.visible = false;
  palaceGroup.add(plaque);

  // -----------------------------------------------------------------
  // 3. INTERNAL PARTITION WALLS (Rooms & Royal Prison)
  // -----------------------------------------------------------------
  // Left Wing Partition at X = -7
  // Section 1: Z: 14 to 20
  const leftWingWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_H, 6.0), wallMat);
  leftWingWall1.position.set(-7, WALL_H / 2 + 0.2, 17);
  palaceGroup.add(leftWingWall1);

  collisionSystem.registerBox({
    id: 'left_wing_wall_1',
    minX: -7.4,
    maxX: -6.6,
    minZ: 14.0,
    maxZ: 20.0,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Section 2: Z: 24 to 38
  const leftWingWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_H, 14.0), wallMat);
  leftWingWall2.position.set(-7, WALL_H / 2 + 0.2, 31);
  palaceGroup.add(leftWingWall2);

  collisionSystem.registerBox({
    id: 'left_wing_wall_2',
    minX: -7.4,
    maxX: -6.6,
    minZ: 24.0,
    maxZ: 38.0,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Section 3: Z: 42 to 48
  const leftWingWall3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_H, 6.0), wallMat);
  leftWingWall3.position.set(-7, WALL_H / 2 + 0.2, 45);
  palaceGroup.add(leftWingWall3);

  collisionSystem.registerBox({
    id: 'left_wing_wall_3',
    minX: -7.4,
    maxX: -6.6,
    minZ: 42.0,
    maxZ: 48.0,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Left Room Divider at Z = 31
  const roomDivider = new THREE.Mesh(new THREE.BoxGeometry(12.4, WALL_H, 0.8), wallMat);
  roomDivider.position.set(-13.2, WALL_H / 2 + 0.2, 31);
  palaceGroup.add(roomDivider);

  collisionSystem.registerBox({
    id: 'left_room_divider',
    minX: -19.4,
    maxX: -7.0,
    minZ: 30.6,
    maxZ: 31.4,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Right Wing Dungeon Partition at X = 7
  // Section 1: Z: 14 to 24
  const dungeonWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_H, 10.0), darkWallMat);
  dungeonWall1.position.set(7, WALL_H / 2 + 0.2, 19);
  palaceGroup.add(dungeonWall1);

  collisionSystem.registerBox({
    id: 'dungeon_wall_1',
    minX: 6.6,
    maxX: 7.4,
    minZ: 14.0,
    maxZ: 24.0,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Section 2: Z: 28 to 48 (Dungeon main corridor wall)
  const dungeonWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_H, 20.0), darkWallMat);
  dungeonWall2.position.set(7, WALL_H / 2 + 0.2, 38);
  palaceGroup.add(dungeonWall2);

  collisionSystem.registerBox({
    id: 'dungeon_wall_2',
    minX: 6.6,
    maxX: 7.4,
    minZ: 28.0,
    maxZ: 48.0,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Prison Cells Divider at Z = 32
  const prisonDivider = new THREE.Mesh(new THREE.BoxGeometry(12.4, WALL_H, 0.8), darkWallMat);
  prisonDivider.position.set(13.2, WALL_H / 2 + 0.2, 32);
  palaceGroup.add(prisonDivider);

  collisionSystem.registerBox({
    id: 'prison_divider',
    minX: 7.0,
    maxX: 19.4,
    minZ: 31.6,
    maxZ: 32.4,
    minY: 0,
    maxY: WALL_H,
    isActive: true,
  });

  // Prison Cell 1 Iron Bars Front (Z = 25.0)
  for (let bx = 12.2; bx <= 18.5; bx += 0.55) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 6), ironMat);
    bar.position.set(bx, 2.2, 25.0);
    palaceGroup.add(bar);
  }
  collisionSystem.registerBox({
    id: 'prison_cell1_bars',
    minX: 12.2,
    maxX: 19.2,
    minZ: 24.8,
    maxZ: 25.2,
    minY: 0,
    maxY: 4.2,
    isActive: true,
  });

  // Prison Cell 2 Iron Bars Front (Z = 37.0)
  for (let bx = 12.2; bx <= 18.5; bx += 0.55) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 6), ironMat);
    bar.position.set(bx, 2.2, 37.0);
    palaceGroup.add(bar);
  }
  collisionSystem.registerBox({
    id: 'prison_cell2_bars',
    minX: 12.2,
    maxX: 19.2,
    minZ: 36.8,
    maxZ: 37.2,
    minY: 0,
    maxY: 4.2,
    isActive: true,
  });

  // -----------------------------------------------------------------
  // 4. AISLE GRAND COLUMNS (REGISTERED IN COLLISION SYSTEM!)
  // -----------------------------------------------------------------
  const columnPositions = [
    [-4.5, 20], [4.5, 20],
    [-4.5, 26], [4.5, 26],
    [-4.5, 32], [4.5, 32],
    [-4.5, 38], [4.5, 38],
  ];

  columnPositions.forEach(([cx, cz], idx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, WALL_H, 10), columnMat);
    col.position.set(cx, WALL_H / 2 + 0.2, cz);
    col.castShadow = true;
    palaceGroup.add(col);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), goldMat);
    cap.position.set(cx, WALL_H + 0.05, cz);
    palaceGroup.add(cap);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), goldMat);
    base.position.set(cx, 0.3, cz);
    palaceGroup.add(base);

    // Register solid column collider
    collisionSystem.registerCylinder({
      id: `column_${idx}`,
      x: cx,
      z: cz,
      radius: 0.5,
      minY: 0,
      maxY: WALL_H,
      isActive: true,
    });
  });

  // -----------------------------------------------------------------
  // 5. INTERACTIVE DOORS SYSTEM (PALACE GATES, PRISON, ROOMS)
  // -----------------------------------------------------------------
  const doors: InteractiveDoor[] = [];

  // Helper to build a wooden door
  const createInteractiveDoor = (
    id: string,
    name: string,
    hingeX: number,
    hingeY: number,
    hingeZ: number,
    width: number,
    height: number,
    isIron: boolean = false,
    openAngle: number = -Math.PI * 0.48,
    closedAngle: number = 0,
    colliderBounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  ): InteractiveDoor => {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, hingeY, hingeZ);

    const mat = isIron ? ironMat : doorWoodMat;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.18), mat);
    slab.position.set(width / 2, height / 2, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    pivot.add(slab);

    // Iron bands or bars
    if (!isIron) {
      [-height * 0.3, 0, height * 0.3].forEach((offsetY) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.16, 0.22), ironMat);
        band.position.set(width / 2, height / 2 + offsetY, 0);
        pivot.add(band);
      });
      // Ring handle
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), goldMat);
      ring.position.set(width - 0.3, height / 2, 0.12);
      pivot.add(ring);
    } else {
      // Iron cell door rivets & bars
      const lockBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.22), goldMat);
      lockBox.position.set(width - 0.25, height / 2, 0);
      pivot.add(lockBox);
    }

    palaceGroup.add(pivot);

    // Register door collision (Solid when closed!)
    collisionSystem.registerBox({
      id: `door_${id}`,
      minX: colliderBounds.minX,
      maxX: colliderBounds.maxX,
      minZ: colliderBounds.minZ,
      maxZ: colliderBounds.maxZ,
      minY: hingeY,
      maxY: hingeY + height,
      isActive: true,
    });

    const doorObj: InteractiveDoor = {
      id,
      name,
      pivot,
      isOpen: false,
      openAngle,
      closedAngle,
      colliderId: `door_${id}`,
      colliderBounds,
      toggle: () => {
        if (doorObj.isOpen) doorObj.close();
        else doorObj.open();
      },
      open: () => {
        doorObj.isOpen = true;
        collisionSystem.setColliderActive(doorObj.colliderId, false); // Door unblocked!
        soundManager.playGateOpen();
      },
      close: () => {
        doorObj.isOpen = false;
        collisionSystem.setColliderActive(doorObj.colliderId, true); // Solid obstacle!
      },
    };

    doors.push(doorObj);
    return doorObj;
  };

  // Door 1: Palace Main Left Gate
  const mainGateLeft = createInteractiveDoor(
    'main_gate_left',
    'بوابة القصر الرئيسية (يسار)',
    -2.95, 0.2, 14.0,
    2.95, 4.15,
    false,
    -Math.PI * 0.48, 0,
    { minX: -2.95, maxX: 0.0, minZ: 13.8, maxZ: 14.2 }
  );

  // Door 2: Palace Main Right Gate (Pivots opposite)
  const mainGateRight = createInteractiveDoor(
    'main_gate_right',
    'بوابة القصر الرئيسية (يمين)',
    2.95, 0.2, 14.0,
    -2.95, 4.15,
    false,
    Math.PI * 0.48, 0,
    { minX: 0.0, maxX: 2.95, minZ: 13.8, maxZ: 14.2 }
  );

  // Door 3: Prison Corridor Entrance Gate (at X = 7.0, Z = 26.0)
  const prisonMainGate = createInteractiveDoor(
    'prison_main_gate',
    'بوابة سجن المملكة العاشورية',
    7.0, 0.2, 24.1,
    3.8, 3.8,
    true,
    Math.PI * 0.45, 0,
    { minX: 6.7, maxX: 7.3, minZ: 24.0, maxZ: 28.0 }
  );
  prisonMainGate.pivot.rotation.y = Math.PI / 2; // Aligned with X = 7 wall!
  prisonMainGate.closedAngle = Math.PI / 2;
  prisonMainGate.openAngle = Math.PI / 2 + Math.PI * 0.45;

  // Door 4: Prison Cell 1 Door (at Z = 25.0, X = 8.5 to 11.5)
  const prisonCell1Door = createInteractiveDoor(
    'prison_cell_1',
    'باب زنزانة السجن رقم 1',
    8.5, 0.2, 25.0,
    3.0, 3.8,
    true,
    -Math.PI * 0.45, 0,
    { minX: 8.5, maxX: 12.0, minZ: 24.8, maxZ: 25.2 }
  );

  // Door 5: Prison Cell 2 Door (at Z = 37.0, X = 8.5 to 11.5)
  const prisonCell2Door = createInteractiveDoor(
    'prison_cell_2',
    'باب زنزانة السجن رقم 2',
    8.5, 0.2, 37.0,
    3.0, 3.8,
    true,
    -Math.PI * 0.45, 0,
    { minX: 8.5, maxX: 12.0, minZ: 36.8, maxZ: 37.2 }
  );

  // Door 6: Royal Chamber Room 1 Door (at X = -7.0, Z = 22.0)
  const room1Door = createInteractiveDoor(
    'room_1',
    'باب الجناح الملكي رقم 1',
    -7.0, 0.2, 20.1,
    3.8, 3.8,
    false,
    -Math.PI * 0.45, 0,
    { minX: -7.3, maxX: -6.7, minZ: 20.0, maxZ: 24.0 }
  );
  room1Door.pivot.rotation.y = Math.PI / 2;
  room1Door.closedAngle = Math.PI / 2;
  room1Door.openAngle = Math.PI / 2 - Math.PI * 0.45;

  // Door 7: Royal Chamber Room 2 Door (at X = -7.0, Z = 40.0)
  const room2Door = createInteractiveDoor(
    'room_2',
    'باب ديوان المملكة رقم 2',
    -7.0, 0.2, 38.1,
    3.8, 3.8,
    false,
    -Math.PI * 0.45, 0,
    { minX: -7.3, maxX: -6.7, minZ: 38.0, maxZ: 42.0 }
  );
  room2Door.pivot.rotation.y = Math.PI / 2;
  room2Door.closedAngle = Math.PI / 2;
  room2Door.openAngle = Math.PI / 2 - Math.PI * 0.45;

  // -----------------------------------------------------------------
  // 6. THE ROYAL THRONE (عرش السلطان عاشور العاشر) - CORRECTED ORIENTATION!
  // Facing the Entrance (-Z)!
  // -----------------------------------------------------------------
  const throneGroup = new THREE.Group();
  throneGroup.position.set(0, 0, 42.5);

  // Tier 1 Dais Platform (Y = 0.35)
  const dais1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 5.2), wallMat);
  dais1.position.set(0, 0.175, 0);
  dais1.receiveShadow = true;
  throneGroup.add(dais1);

  // Tier 2 Dais Platform (Y = 0.65)
  const dais2 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, 4.2), carpetMat);
  dais2.position.set(0, 0.5, 0.2);
  dais2.receiveShadow = true;
  throneGroup.add(dais2);

  // Tier 3 Dais Platform (Y = 0.95)
  const dais3 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 3.2), goldMat);
  dais3.position.set(0, 0.8, 0.4);
  dais3.receiveShadow = true;
  throneGroup.add(dais3);

  // --- THE THRONE CHAIR FACING TOWARD ENTRANCE (-Z) ---
  const throneChair = new THREE.Group();
  throneChair.position.set(0, 0.95, 0.4);

  // Seat Cushion facing towards -Z
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 1.1), carpetMat);
  seat.position.set(0, 0.55, 0);
  throneChair.add(seat);

  // Golden Seat Base Frame
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.2), goldMat);
  seatBase.position.set(0, 0.225, 0);
  seatBase.castShadow = true;
  throneChair.add(seatBase);

  // Golden Armrests on Left and Right
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 1.2), goldMat);
  armL.position.set(-0.72, 0.7, 0);
  throneChair.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 1.2), goldMat);
  armR.position.set(0.72, 0.7, 0);
  throneChair.add(armR);

  // Golden Lion Heads on Front Armrest Tips (facing -Z)
  [-0.72, 0.72].forEach((lx) => {
    const lionHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), goldMat);
    lionHead.position.set(lx, 0.9, -0.6);
    throneChair.add(lionHead);
  });

  // Tall Royal Crown Backrest positioned at REAR (+Z, against rear wall!)
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.3, 0.24), goldMat);
  backrest.position.set(0, 1.65, 0.55);
  backrest.castShadow = true;
  throneChair.add(backrest);

  // Velvet Backrest Cushion facing -Z towards the room
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.12), carpetMat);
  cushion.position.set(0, 1.55, 0.48);
  throneChair.add(cushion);

  // Royal Crown Star Crest on Throne Top
  const star = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.12), goldMat);
  star.position.set(0, 2.9, 0.55);
  throneChair.add(star);

  const starRuby = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xcc1122, roughness: 0.2, metalness: 0.6 })
  );
  starRuby.position.set(0, 2.9, 0.53);
  throneChair.add(starRuby);

  throneGroup.add(throneChair);
  palaceGroup.add(throneGroup);

  // Throne Dais solid collider (preventing walking through chair backrest)
  collisionSystem.registerBox({
    id: 'throne_backrest_solid',
    minX: -1.0,
    maxX: 1.0,
    minZ: 42.8,
    maxZ: 43.8,
    minY: 0,
    maxY: 3.5,
    isActive: true,
  });

  // Flanking Braziers
  [-3.2, 3.2].forEach((brazierX, bi) => {
    const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8), goldMat);
    bBase.position.set(brazierX, 0.4, 42.5);
    palaceGroup.add(bBase);

    const bBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.35, 8), goldMat);
    bBowl.position.set(brazierX, 0.95, 42.5);
    palaceGroup.add(bBowl);

    const embers = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5511 }));
    embers.position.set(brazierX, 1.05, 42.5);
    palaceGroup.add(embers);

    collisionSystem.registerCylinder({
      id: `throne_brazier_${bi}`,
      x: brazierX,
      z: 42.5,
      radius: 0.55,
      minY: 0,
      maxY: 1.5,
      isActive: true,
    });
  });

  // -----------------------------------------------------------------
  // 7. ROOFTOP & OBSERVATION TERRACE (ROOF_Y = 7.0)
  // -----------------------------------------------------------------
  const ROOF_Y = 7.0;
  const roofGeo = new THREE.BoxGeometry(38, 0.35, 32);
  const roofMesh = new THREE.Mesh(roofGeo, floorMat);
  roofMesh.position.set(0, ROOF_Y, 31);
  roofMesh.receiveShadow = true;
  roofMesh.visible = false; // The real 3D Castle has authentic pitched roofs & towers!
  palaceGroup.add(roofMesh);

  // Roof Balustrades/Parapets (Registered in Collision system)
  const BATTLEMENT_H = 1.2;
  const frontParapet = new THREE.Mesh(new THREE.BoxGeometry(38, BATTLEMENT_H, 0.6), wallMat);
  frontParapet.position.set(0, ROOF_Y + BATTLEMENT_H / 2, 15.2);
  frontParapet.visible = false;
  palaceGroup.add(frontParapet);

  collisionSystem.registerBox({
    id: 'roof_front_parapet',
    minX: -19, maxX: 19, minZ: 14.8, maxZ: 15.6, minY: ROOF_Y, maxY: ROOF_Y + BATTLEMENT_H, isActive: true,
  });

  const backParapet = new THREE.Mesh(new THREE.BoxGeometry(38, BATTLEMENT_H, 0.6), wallMat);
  backParapet.position.set(0, ROOF_Y + BATTLEMENT_H / 2, 46.8);
  backParapet.visible = false;
  palaceGroup.add(backParapet);

  collisionSystem.registerBox({
    id: 'roof_back_parapet',
    minX: -19, maxX: 19, minZ: 46.4, maxZ: 47.2, minY: ROOF_Y, maxY: ROOF_Y + BATTLEMENT_H, isActive: true,
  });

  // Grand Staircase (ascending from Z: 20 to 32 at X: -5.6)
  const stairSteps = 16;
  const stairHeight = 6.8;
  for (let s = 0; s < stairSteps; s++) {
    const t = s / stairSteps;
    const sz = 20 + t * 12;
    const sy = 0.2 + t * stairHeight;
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, (stairHeight / stairSteps) + 0.1, 0.8), wallMat);
    stepMesh.position.set(-5.6, sy, sz);
    stepMesh.receiveShadow = true;
    palaceGroup.add(stepMesh);
  }

  // -----------------------------------------------------------------
  // 8. DEDICATED STATIONED PALACE GUARDS (2 PER DOOR!)
  // -----------------------------------------------------------------
  const guards: GuardNPC[] = [];

  // A) 2 Main Gate Guards (Autonomous Entryway Sentry AI)
  const mainGateGuardL = createPalaceGuardNPC('gate_guard_left', 'حارس البوابة الرئيسي (يسار)', -3.8, 0.04, 13.2, Math.PI);
  mainGateGuardL.doorToOpen = mainGateLeft;
  palaceGroup.add(mainGateGuardL.root);
  guards.push(mainGateGuardL);

  const mainGateGuardR = createPalaceGuardNPC('gate_guard_right', 'حارس البوابة الرئيسي (يمين)', 3.8, 0.04, 13.2, Math.PI);
  mainGateGuardR.doorToOpen = mainGateRight;
  palaceGroup.add(mainGateGuardR.root);
  guards.push(mainGateGuardR);

  // B) 2 Prison Entrance Gate Guards (at X = 6.0, Z = 24.5 & 27.5)
  const prisonGateGuard1 = createPalaceGuardNPC('prison_gate_g1', 'حارس مدخل السجن 1', 5.8, 0.12, 24.5, Math.PI / 2);
  prisonGateGuard1.doorToOpen = prisonMainGate;
  palaceGroup.add(prisonGateGuard1.root);
  guards.push(prisonGateGuard1);

  const prisonGateGuard2 = createPalaceGuardNPC('prison_gate_g2', 'حارس مدخل السجن 2', 5.8, 0.12, 27.5, Math.PI / 2);
  palaceGroup.add(prisonGateGuard2.root);
  guards.push(prisonGateGuard2);

  // C) 2 Prison Cell 1 Guards (at Z = 25.0, X = 8.8 & 11.2)
  const cell1Guard1 = createPalaceGuardNPC('cell1_g1', 'حارس زنزانة 1 (أ)', 8.8, 0.12, 24.2, 0);
  cell1Guard1.doorToOpen = prisonCell1Door;
  palaceGroup.add(cell1Guard1.root);
  guards.push(cell1Guard1);

  const cell1Guard2 = createPalaceGuardNPC('cell1_g2', 'حارس زنزانة 1 (ب)', 11.2, 0.12, 24.2, 0);
  palaceGroup.add(cell1Guard2.root);
  guards.push(cell1Guard2);

  // D) 2 Prison Cell 2 Guards (at Z = 37.0, X = 8.8 & 11.2)
  const cell2Guard1 = createPalaceGuardNPC('cell2_g1', 'حارس زنزانة 2 (أ)', 8.8, 0.12, 36.2, 0);
  cell2Guard1.doorToOpen = prisonCell2Door;
  palaceGroup.add(cell2Guard1.root);
  guards.push(cell2Guard1);

  const cell2Guard2 = createPalaceGuardNPC('cell2_g2', 'حارس زنزانة 2 (ب)', 11.2, 0.12, 36.2, 0);
  palaceGroup.add(cell2Guard2.root);
  guards.push(cell2Guard2);

  // E) 2 Room 1 Guards (Left Wing Royal Chamber)
  const room1Guard1 = createPalaceGuardNPC('room1_g1', 'حارس الجناح الملكي 1 (أ)', -5.8, 0.12, 20.5, -Math.PI / 2);
  room1Guard1.doorToOpen = room1Door;
  palaceGroup.add(room1Guard1.root);
  guards.push(room1Guard1);

  const room1Guard2 = createPalaceGuardNPC('room1_g2', 'حارس الجناح الملكي 1 (ب)', -5.8, 0.12, 23.5, -Math.PI / 2);
  palaceGroup.add(room1Guard2.root);
  guards.push(room1Guard2);

  // F) 2 Room 2 Guards (Left Wing Royal Council Chamber)
  const room2Guard1 = createPalaceGuardNPC('room2_g1', 'حارس ديوان المملكة 2 (أ)', -5.8, 0.12, 38.5, -Math.PI / 2);
  room2Guard1.doorToOpen = room2Door;
  palaceGroup.add(room2Guard1.root);
  guards.push(room2Guard1);

  const room2Guard2 = createPalaceGuardNPC('room2_g2', 'حارس ديوان المملكة 2 (ب)', -5.8, 0.12, 41.5, -Math.PI / 2);
  palaceGroup.add(room2Guard2.root);
  guards.push(room2Guard2);

  // Add palace to scene
  scene.add(palaceGroup);

  // -----------------------------------------------------------------
  // 9. PALACE WALKABLE SURFACE ELEVATION
  // -----------------------------------------------------------------
  const getPalaceHeight = (x: number, z: number, currentY: number = 0): number | null => {
    if (x < -20 || x > 20 || z < 13.6 || z > 48) {
      return null;
    }

    // A) Upper Observation Terrace
    if (currentY >= 4.5) {
      if (x >= -19 && x <= 19 && z >= 15 && z <= 47) {
        return ROOF_Y + 0.18;
      }
    }

    // B) Grand Staircase
    if (x >= -7.0 && x <= -4.2 && z >= 20 && z <= 32.5) {
      const t = Math.max(0, Math.min(1, (z - 20) / 12));
      return 0.12 + t * (ROOF_Y - 0.12);
    }

    // C) Throne Dais Elevated Platforms
    if (x >= -3.5 && x <= 3.5 && z >= 39.5 && z <= 44.5) {
      if (z >= 42) return 0.95; // Top tier
      if (z >= 40.5) return 0.65; // Middle tier
      return 0.35; // Bottom tier
    }

    // D) Ground floor inside Palace
    return 0.12;
  };

  const isNearThrone = (sultanPos?: THREE.Vector3): boolean => {
    if (!sultanPos) return false;
    // Sultan standing in front of the throne dais facing it
    return Math.abs(sultanPos.x) <= 2.8 && sultanPos.z >= 39.0 && sultanPos.z <= 43.5;
  };

  // -----------------------------------------------------------------
  // 10. AUTONOMOUS GATE SENTRIES AI STATE MACHINE
  // -----------------------------------------------------------------
  type GateAiPhase = 'GUARDING' | 'APPROACHING_DOORS' | 'HOLDING_OPEN' | 'CLOSING_DOORS' | 'RETURNING';
  let gateAiPhase: GateAiPhase = 'GUARDING';
  let waitKingTimer = 0;

  const update = (delta: number, sultanPos?: THREE.Vector3) => {
    // 1. Smooth door angles interpolation
    doors.forEach((door) => {
      const targetAngle = door.isOpen ? door.openAngle : door.closedAngle;
      door.pivot.rotation.y = THREE.MathUtils.damp(door.pivot.rotation.y, targetAngle, 4.0, delta);
    });

    // 2. Autonomous Main Gate Guards AI (Ultra-Responsive & Wide Range):
    // Detect Sultan approaching gate from courtyard (Z: 0..14) or inside palace (Z: 14..26)
    const distToGate = sultanPos ? Math.hypot(sultanPos.x, sultanPos.z - 14.0) : 999;
    const isSultanNearGate = sultanPos
      ? (distToGate < 13.5 || (Math.abs(sultanPos.x) < 8.5 && sultanPos.z >= 1.0 && sultanPos.z <= 26.0))
      : false;
    const isSultanFarAway = distToGate > 16.0;

    if (isSultanNearGate) {
      // Instantly open the grand gates and order guards forward to salute
      if (!mainGateLeft.isOpen) {
        mainGateLeft.open();
        mainGateRight.open();
      }
      // Step towards the doors to hold and salute
      mainGateGuardL.targetPos.set(-2.0, 0.04, 13.8);
      mainGateGuardL.salute();
      mainGateGuardR.targetPos.set(2.0, 0.04, 13.8);
      mainGateGuardR.salute();
      gateAiPhase = 'HOLDING_OPEN';
    } else if (isSultanFarAway && gateAiPhase === 'HOLDING_OPEN') {
      // Close doors and return to stations when King departs far away
      mainGateLeft.close();
      mainGateRight.close();
      mainGateGuardL.returnToPost();
      mainGateGuardR.returnToPost();
      gateAiPhase = 'GUARDING';
    }

    // 3. Proximity greetings for Prison and Room Guards:
    // When Sultan is within 3.5m of any door, guards at that door salute!
    guards.forEach((guard) => {
      guard.update(delta, sultanPos);

      // Auto-salute if Sultan is nearby and guard is at post
      if (guard.state === 'guarding' && sultanPos) {
        const d = Math.hypot(guard.currentPos.x - sultanPos.x, guard.currentPos.z - sultanPos.z);
        if (d < 3.2) {
          guard.salute();
        }
      } else if (guard.state === 'saluting' && sultanPos) {
        const d = Math.hypot(guard.currentPos.x - sultanPos.x, guard.currentPos.z - sultanPos.z);
        if (d >= 4.0) {
          guard.stand();
        }
      }
    });
  };

  const openAllDoors = () => {
    doors.forEach((d) => d.open());
  };

  const closeAllDoors = () => {
    doors.forEach((d) => d.close());
  };

  const kneelAllPalaceGuards = () => {
    guards.forEach((g) => g.kneel());
  };

  const standAllPalaceGuards = () => {
    guards.forEach((g) => g.stand());
  };

  const returnAllPalaceGuardsToPosts = () => {
    guards.forEach((g) => g.returnToPost());
  };

  return {
    group: palaceGroup,
    getHeight: getPalaceHeight,
    update,
    isNearThrone,
    isNearGate: (sultanPos?: THREE.Vector3) =>
      Boolean(sultanPos && Math.hypot(sultanPos.x, sultanPos.z - 14.0) < 8.5),
    toggleGate: () => {
      mainGateLeft.toggle();
      mainGateRight.toggle();
    },
    openAllDoors,
    closeAllDoors,
    kneelAllPalaceGuards,
    standAllPalaceGuards,
    returnAllPalaceGuardsToPosts,
    getDoors: () => doors,
    getGuards: () => guards,
  };
}
