import * as THREE from 'three';
import { soundManager } from '../utils/audio';

export interface Waypoint {
  x: number;
  z: number;
  name: string;
  category: 'landmark' | 'custom';
}

export const PRESET_LANDMARKS: Waypoint[] = [
  { name: 'مربض الحصان الملكي 🐎', x: 8.5, z: 6.0, category: 'landmark' },
  { name: 'بوابة القصر الرئيسية 🚪', x: 0, z: 14.0, category: 'landmark' },
  { name: 'العرش الملكي 👑', x: 0, z: 42.5, category: 'landmark' },
  { name: 'سجن المملكة العاشورية 🔒', x: 10.0, z: 26.0, category: 'landmark' },
  { name: 'الجناح الملكي 🏛️', x: -12.0, z: 22.0, category: 'landmark' },
  { name: 'ديوان المملكة 📜', x: -12.0, z: 40.0, category: 'landmark' },
  { name: 'حدائق المملكة العاشورية 🌳', x: 22.0, z: -15.0, category: 'landmark' },
  { name: 'برج المراقبة الملكي 🏰', x: -18.5, z: 46.5, category: 'landmark' },
];

class GpsSystem {
  private scene: THREE.Scene | null = null;
  public currentTarget: Waypoint | null = null;

  // 3D Visuals
  private beaconGroup: THREE.Group = new THREE.Group();
  private beaconBeam: THREE.Mesh | null = null;
  private beaconRings: THREE.Mesh[] = [];
  private pathLine: THREE.Line | null = null;
  private lineGeometry: THREE.BufferGeometry | null = null;
  private animTimer = 0;

  public init(scene: THREE.Scene) {
    this.scene = scene;
    this.createBeacon();
    this.createPathLine();
    scene.add(this.beaconGroup);
    this.beaconGroup.visible = false;
  }

  private createBeacon() {
    this.beaconGroup.name = 'gps_beacon';

    // 1. Vertical glowing pillar of light
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.45, 18, 12, 1, true);
    beamGeo.translate(0, 9, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.beaconBeam = new THREE.Mesh(beamGeo, beamMat);
    this.beaconGroup.add(this.beaconBeam);

    // 2. Concentric ground pulsing rings
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.RingGeometry(0.4 + r * 0.4, 0.55 + r * 0.4, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.05 + r * 0.01;
      this.beaconRings.push(ring);
      this.beaconGroup.add(ring);
    }

    // 3. Floating 3D golden diamond icon at top of beacon
    const diamondGeo = new THREE.OctahedronGeometry(0.55, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xca8a04,
      emissiveIntensity: 0.6,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 3.2;
    this.beaconGroup.add(diamond);
  }

  private createPathLine() {
    if (!this.scene) return;
    const maxPoints = 50;
    const positions = new Float32Array(maxPoints * 3);
    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      scale: 1,
      dashSize: 1.2,
      gapSize: 0.6,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      opacity: 0.85,
    });

    this.pathLine = new THREE.Line(this.lineGeometry, lineMat);
    this.pathLine.computeLineDistances();
    this.pathLine.visible = false;
    this.scene.add(this.pathLine);
  }

  public setDestination(x: number, z: number, name: string = 'وجهة محددة') {
    this.currentTarget = {
      x,
      z,
      name,
      category: 'custom',
    };
    if (this.beaconGroup) {
      this.beaconGroup.position.set(x, 0.1, z);
      this.beaconGroup.visible = true;
    }
    if (this.pathLine) {
      this.pathLine.visible = true;
    }
    soundManager.playClick();
  }

  public clearDestination() {
    this.currentTarget = null;
    if (this.beaconGroup) this.beaconGroup.visible = false;
    if (this.pathLine) this.pathLine.visible = false;
  }

  public update(playerPos: THREE.Vector3, getHeight: (x: number, z: number) => number): {
    active: boolean;
    distance: number;
    targetName: string;
    hasArrived: boolean;
  } {
    if (!this.currentTarget) {
      return { active: false, distance: 0, targetName: '', hasArrived: false };
    }

    this.animTimer += 0.035;

    // Pulse beacon rings
    this.beaconRings.forEach((ring, idx) => {
      const s = 1.0 + Math.sin(this.animTimer * 3 + idx * 1.2) * 0.35;
      ring.scale.set(s, s, s);
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.2, 0.9 - s * 0.4);
    });

    const groundY = getHeight(this.currentTarget.x, this.currentTarget.z);
    this.beaconGroup.position.y = groundY;

    // Calculate distance
    const dx = this.currentTarget.x - playerPos.x;
    const dz = this.currentTarget.z - playerPos.z;
    const distance = Math.hypot(dx, dz);

    // Arrived at destination
    if (distance < 2.8) {
      soundManager.playStoryChime(0);
      const name = this.currentTarget.name;
      this.clearDestination();
      return { active: false, distance: 0, targetName: name, hasArrived: true };
    }

    // Update 3D path ribbon line
    if (this.lineGeometry && this.pathLine) {
      const posAttr = this.lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const count = 30;

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const px = THREE.MathUtils.lerp(playerPos.x, this.currentTarget.x, t);
        const pz = THREE.MathUtils.lerp(playerPos.z, this.currentTarget.z, t);
        const py = getHeight(px, pz) + 0.18 + Math.sin(t * Math.PI) * 0.4;

        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
      this.pathLine.computeLineDistances();
    }

    return {
      active: true,
      distance: Math.round(distance),
      targetName: this.currentTarget.name,
      hasArrived: false,
    };
  }

  public dispose() {
    if (this.scene) {
      if (this.beaconGroup) this.scene.remove(this.beaconGroup);
      if (this.pathLine) this.scene.remove(this.pathLine);
    }
  }
}

export const gpsSystem = new GpsSystem();
