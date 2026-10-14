'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Bike, BikeCategory } from '@/lib/supabase/types';
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  Camera,
} from 'lucide-react';

interface Motorcycle3DViewerProps {
  bike: Partial<Bike>;
  className?: string;
  height?: number | string;
  interactive?: boolean;
  autoRotateDefault?: boolean;
  showControls?: boolean;
  onPartClick?: (partName: string) => void;
}

export function Motorcycle3DViewer({
  bike,
  className = '',
  height = 340,
  interactive = true,
  autoRotateDefault = true,
  showControls = true,
  onPartClick,
}: Motorcycle3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isAutoRotating, setIsAutoRotating] = useState(autoRotateDefault);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCameraView, setActiveCameraView] = useState<'threeQuarter' | 'side' | 'front' | 'cockpit'>('threeQuarter');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bikeGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Interaction state
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const rotationAngle = useRef({ x: 0.35, y: -0.75 }); // Initial 3/4 view
  const cameraDistance = useRef(5.2);
  const touchStartDistance = useRef<number | null>(null);

  const category = (bike.category || 'naked') as BikeCategory;
  const primaryColor = bike.primary_color || '#0284c7';
  const accentColor = bike.accent_color || '#18181b';
  const imageUrl = bike.image_url || null;

  // Camera preset handler
  const setCameraPreset = useCallback((view: 'threeQuarter' | 'side' | 'front' | 'cockpit') => {
    setActiveCameraView(view);
    setIsAutoRotating(false);

    switch (view) {
      case 'threeQuarter':
        rotationAngle.current = { x: 0.35, y: -0.75 };
        cameraDistance.current = 5.2;
        break;
      case 'side':
        rotationAngle.current = { x: 0.05, y: -Math.PI / 2 };
        cameraDistance.current = 4.8;
        break;
      case 'front':
        rotationAngle.current = { x: 0.15, y: 0 };
        cameraDistance.current = 4.6;
        break;
      case 'cockpit':
        rotationAngle.current = { x: 0.7, y: Math.PI * 0.95 };
        cameraDistance.current = 3.6;
        break;
    }
  }, []);

  const resetCamera = useCallback(() => {
    setCameraPreset('threeQuarter');
    setIsAutoRotating(true);
    setSelectedPart(null);
  }, [setCameraPreset]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 300);
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 1.8, 5.2);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight || 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 4. Lighting setup (Studio Garage)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(4, 7, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-5, 4, -3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(primaryColor).getHex(), 3.0, 12);
    rimLight.position.set(0, 0.5, -3.5);
    scene.add(rimLight);

    // 5. Turntable Pedestal Floor
    const turntableGroup = new THREE.Group();

    // Metallic disk
    const discGeo = new THREE.CylinderGeometry(2.3, 2.4, 0.08, 48);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      metalness: 0.85,
      roughness: 0.25,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.96;
    turntableGroup.add(disc);

    // Glowing LED Ring
    const ringGeo = new THREE.RingGeometry(2.28, 2.34, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColor),
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.915;
    turntableGroup.add(ring);

    // Soft Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x09090b,
      transparent: true,
      opacity: 0.15,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.91;
    turntableGroup.add(shadow);

    scene.add(turntableGroup);

    // 6. Build 3D Motorbike Model
    const bikeGroup = new THREE.Group();
    bikeGroupRef.current = bikeGroup;

    // Palette & Materials
    const pColor = new THREE.Color(primaryColor);
    const aColor = new THREE.Color(accentColor);

    const bodyPaintMat = new THREE.MeshStandardMaterial({
      color: pColor,
      metalness: 0.65,
      roughness: 0.2,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: aColor,
      metalness: 0.8,
      roughness: 0.35,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      metalness: 0.95,
      roughness: 0.1,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.05,
    });

    const darkEngineMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.85,
      roughness: 0.4,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    const emissiveHeadlightMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
    });

    const emissiveTailMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
    });

    // Height & category adjustments
    let forkAngle = 0.38; // Default rake
    let forkLength = 1.35;
    let groundOffset = 0;

    const isDirtBike = category === 'cross' || category === 'enduro';

    if (category === 'adventure') {
      forkLength = 1.55;
      groundOffset = 0.15;
    } else if (isDirtBike) {
      forkLength = 1.60;
      forkAngle = 0.35;
      groundOffset = 0.20;
    } else if (category === 'cruiser') {
      forkAngle = 0.52; // Raked out
      forkLength = 1.45;
      groundOffset = -0.08;
    }

    // --- REAR WHEEL ---
    const rearWheelGroup = new THREE.Group();
    rearWheelGroup.name = 'Ruota & Trasmissione';
    rearWheelGroup.position.set(-1.1, -0.45 + groundOffset, 0);

    const rearTireGeo = new THREE.TorusGeometry(0.48, isDirtBike ? 0.16 : 0.15, 16, 32);
    const rearTire = new THREE.Mesh(rearTireGeo, rubberMat);
    rearWheelGroup.add(rearTire);

    const rearRimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.2, 16);
    rearRimGeo.rotateX(Math.PI / 2);
    const rearRim = new THREE.Mesh(rearRimGeo, frameMat);
    rearWheelGroup.add(rearRim);

    // Rear sprocket & disc
    const rearDiscGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 16);
    rearDiscGeo.rotateX(Math.PI / 2);
    const rearDisc = new THREE.Mesh(rearDiscGeo, chromeMat);
    rearWheelGroup.add(rearDisc);

    bikeGroup.add(rearWheelGroup);

    // --- FRONT WHEEL ---
    const frontWheelGroup = new THREE.Group();
    frontWheelGroup.name = 'Ruota & Freni Anteriori';
    const frontWheelX = category === 'cruiser' ? 1.35 : (isDirtBike ? 1.20 : 1.15);
    frontWheelGroup.position.set(frontWheelX, -0.45 + groundOffset, 0);

    const frontTireGeo = new THREE.TorusGeometry(isDirtBike ? 0.51 : 0.48, isDirtBike ? 0.11 : 0.13, 16, 32);
    const frontTire = new THREE.Mesh(frontTireGeo, rubberMat);
    frontWheelGroup.add(frontTire);

    const frontRimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.18, 16);
    frontRimGeo.rotateX(Math.PI / 2);
    const frontRim = new THREE.Mesh(frontRimGeo, frameMat);
    frontWheelGroup.add(frontRim);

    // Dual brake discs front
    const frontDiscLeft = new THREE.Mesh(rearDiscGeo, chromeMat);
    frontDiscLeft.position.z = 0.08;
    frontWheelGroup.add(frontDiscLeft);

    const frontDiscRight = new THREE.Mesh(rearDiscGeo, chromeMat);
    frontDiscRight.position.z = -0.08;
    frontWheelGroup.add(frontDiscRight);

    bikeGroup.add(frontWheelGroup);

    // --- SWINGARM (Forcellone) ---
    const swingarmGeo = new THREE.BoxGeometry(0.9, 0.1, 0.22);
    const swingarm = new THREE.Mesh(swingarmGeo, frameMat);
    swingarm.position.set(-0.6, -0.38 + groundOffset, 0);
    swingarm.rotation.z = -0.12;
    bikeGroup.add(swingarm);

    // Rear mono-shock spring
    const shockGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 12);
    const shockMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.position.set(-0.45, -0.15 + groundOffset, 0);
    shock.rotation.z = 0.45;
    bikeGroup.add(shock);

    // --- ENGINE BLOCK (Motore) ---
    const engineGroup = new THREE.Group();
    engineGroup.name = 'Motore & Scarico';
    engineGroup.position.set(-0.05, -0.28 + groundOffset, 0);

    const crankcaseGeo = new THREE.BoxGeometry(0.65, 0.45, 0.38);
    const crankcase = new THREE.Mesh(crankcaseGeo, darkEngineMat);
    engineGroup.add(crankcase);

    // Cylinder heads
    const cylinderGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12);
    const cyl1 = new THREE.Mesh(cylinderGeo, darkEngineMat);
    cyl1.position.set(0.1, 0.28, 0);
    cyl1.rotation.z = -0.25;
    engineGroup.add(cyl1);

    // Exhaust headers & pipe
    const headerGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.6, 12);
    const header = new THREE.Mesh(headerGeo, chromeMat);
    header.position.set(0.22, 0.1, 0.14);
    header.rotation.z = 0.55;
    engineGroup.add(header);

    // Exhaust muffler (silencer)
    const mufflerGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.75, 16);
    mufflerGeo.rotateZ(Math.PI / 2);
    const muffler = new THREE.Mesh(mufflerGeo, chromeMat);
    const mufflerY = isDirtBike ? 0.22 : -0.1;
    const mufflerZ = isDirtBike ? 0.20 : 0.26;
    muffler.position.set(-0.7, mufflerY, mufflerZ);
    muffler.rotation.y = 0.08;
    muffler.rotation.z = isDirtBike ? 0.10 : 0.25;
    engineGroup.add(muffler);

    // Carbon tip
    const tipGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.12, 16);
    tipGeo.rotateZ(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, frameMat);
    tip.position.set(-1.08, mufflerY + 0.10, mufflerZ);
    tip.rotation.z = isDirtBike ? 0.10 : 0.25;
    engineGroup.add(tip);

    bikeGroup.add(engineGroup);

    // --- MAIN FRAME / CHASSIS ---
    const frameGroup = new THREE.Group();
    frameGroup.name = 'Telaio';

    const beam1Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.95, 12);
    const beam1 = new THREE.Mesh(beam1Geo, frameMat);
    beam1.position.set(0.35, 0.22 + groundOffset, 0);
    beam1.rotation.z = 0.8;
    frameGroup.add(beam1);

    const subframeGeo = new THREE.BoxGeometry(0.8, 0.08, 0.2);
    const subframe = new THREE.Mesh(subframeGeo, frameMat);
    subframe.position.set(-0.6, 0.28 + groundOffset, 0);
    subframe.rotation.z = 0.22;
    frameGroup.add(subframe);

    bikeGroup.add(frameGroup);

    // --- FUEL TANK & BODYWORK (Serbatoio & Livrea) ---
    const bodyworkGroup = new THREE.Group();
    bodyworkGroup.name = 'Serbatoio & Livrea';

    let tankGeo: THREE.BufferGeometry;
    if (category === 'sport') {
      tankGeo = new THREE.BoxGeometry(0.85, 0.42, 0.48);
    } else if (category === 'cruiser') {
      tankGeo = new THREE.ConeGeometry(0.28, 0.9, 16);
      tankGeo.rotateZ(Math.PI / 2);
    } else if (isDirtBike) {
      tankGeo = new THREE.BoxGeometry(0.58, 0.30, 0.28);
    } else {
      tankGeo = new THREE.BoxGeometry(0.75, 0.38, 0.42);
    }

    const tank = new THREE.Mesh(tankGeo, bodyPaintMat);
    tank.position.set(0.18, 0.35 + groundOffset, 0);
    tank.rotation.z = -0.15;
    bodyworkGroup.add(tank);

    // Profile photo badge on the tank / fairing if uploaded
    if (imageUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const badgeGeo = new THREE.PlaneGeometry(0.32, 0.2);
          const badgeMat = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true,
          });

          // Left badge
          const badgeLeft = new THREE.Mesh(badgeGeo, badgeMat);
          badgeLeft.position.set(0.2, 0.38 + groundOffset, 0.22);
          badgeLeft.rotation.y = 0.05;
          bodyworkGroup.add(badgeLeft);

          // Right badge
          const badgeRight = new THREE.Mesh(badgeGeo, badgeMat);
          badgeRight.position.set(0.2, 0.38 + groundOffset, -0.22);
          badgeRight.rotation.y = Math.PI - 0.05;
          bodyworkGroup.add(badgeRight);
        },
        undefined,
        (err) => console.warn('Texture load warning:', err)
      );
    }

    // Category specific bodywork:
    if (category === 'sport') {
      // Full sports fairing
      const fairingGeo = new THREE.BoxGeometry(0.65, 0.65, 0.44);
      const fairing = new THREE.Mesh(fairingGeo, bodyPaintMat);
      fairing.position.set(0.6, 0.15 + groundOffset, 0);
      fairing.rotation.z = -0.3;
      bodyworkGroup.add(fairing);

      // Windscreen
      const screenGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.35, 16, 1, true, 0, Math.PI);
      const screen = new THREE.Mesh(screenGeo, glassMat);
      screen.position.set(0.75, 0.65 + groundOffset, 0);
      screen.rotation.z = -0.55;
      screen.rotation.y = -Math.PI / 2;
      bodyworkGroup.add(screen);
    } else if (category === 'adventure') {
      // Touring windscreen
      const screenGeo = new THREE.PlaneGeometry(0.28, 0.45);
      const screen = new THREE.Mesh(screenGeo, glassMat);
      screen.position.set(0.8, 0.78 + groundOffset, 0);
      screen.rotation.y = Math.PI / 2;
      screen.rotation.z = -0.2;
      bodyworkGroup.add(screen);

      // Beak / Front fender
      const beakGeo = new THREE.ConeGeometry(0.12, 0.45, 12);
      beakGeo.rotateZ(-Math.PI / 2);
      const beak = new THREE.Mesh(beakGeo, bodyPaintMat);
      beak.position.set(0.95, 0.25 + groundOffset, 0);
      bodyworkGroup.add(beak);
    } else if (isDirtBike) {
      // High off-road front mudguard (Parafango alto da fuoristrada)
      const highFenderGeo = new THREE.ConeGeometry(0.11, 0.68, 12);
      highFenderGeo.rotateZ(-Math.PI / 2);
      const highFender = new THREE.Mesh(highFenderGeo, bodyPaintMat);
      highFender.position.set(frontWheelX - 0.20, 0.32 + groundOffset, 0);
      highFender.rotation.z = -0.15;
      bodyworkGroup.add(highFender);

      // Radiator side shrouds (convogliatori serbatoio)
      const shroudGeo = new THREE.BoxGeometry(0.36, 0.26, 0.04);
      const shroudLeft = new THREE.Mesh(shroudGeo, bodyPaintMat);
      shroudLeft.position.set(0.38, 0.28 + groundOffset, 0.16);
      shroudLeft.rotation.y = 0.22;
      shroudLeft.rotation.z = -0.22;
      bodyworkGroup.add(shroudLeft);

      const shroudRight = new THREE.Mesh(shroudGeo, bodyPaintMat);
      shroudRight.position.set(0.38, 0.28 + groundOffset, -0.16);
      shroudRight.rotation.y = -0.22;
      shroudRight.rotation.z = -0.22;
      bodyworkGroup.add(shroudRight);
    } else if (category === 'scooter') {
      // Step-through front apron
      const apronGeo = new THREE.BoxGeometry(0.3, 0.75, 0.46);
      const apron = new THREE.Mesh(apronGeo, bodyPaintMat);
      apron.position.set(0.65, 0.1 + groundOffset, 0);
      apron.rotation.z = -0.35;
      bodyworkGroup.add(apron);
    }

    // Seat
    let seatGeo: THREE.BufferGeometry;
    let seatY = 0.36 + groundOffset;
    let seatX = -0.35;
    let seatRotZ = 0.12;

    if (isDirtBike) {
      seatGeo = new THREE.BoxGeometry(0.85, 0.09, 0.22);
      seatX = -0.18;
      seatY = 0.35 + groundOffset;
      seatRotZ = 0.04;
    } else {
      seatGeo = new THREE.BoxGeometry(0.65, 0.12, 0.3);
    }

    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(seatX, seatY, 0);
    seat.rotation.z = seatRotZ;
    bodyworkGroup.add(seat);

    // Tail cowl
    const tailGeo = isDirtBike
      ? new THREE.ConeGeometry(0.11, 0.68, 12)
      : new THREE.ConeGeometry(0.16, 0.55, 16);
    tailGeo.rotateZ(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyPaintMat);
    tail.position.set(-0.85, 0.44 + groundOffset, 0);
    tail.rotation.z = isDirtBike ? 0.26 : 0.2;
    bodyworkGroup.add(tail);

    // Tail light (Enduro has it, Motocross cross bike does not)
    if (category !== 'cross') {
      const tailLightGeo = new THREE.BoxGeometry(0.04, 0.08, 0.14);
      const tailLight = new THREE.Mesh(tailLightGeo, emissiveTailMat);
      tailLight.position.set(-1.12, 0.48 + groundOffset, 0);
      bodyworkGroup.add(tailLight);
    }

    bikeGroup.add(bodyworkGroup);

    // --- FRONT FORKS & COCKPIT ---
    const forkGroup = new THREE.Group();
    forkGroup.name = 'Sospensioni & Cockpit';

    const forkStanchionGeo = new THREE.CylinderGeometry(0.035, 0.035, forkLength, 16);
    const forkMat = new THREE.MeshStandardMaterial({
      color: (category === 'adventure' || isDirtBike) ? 0xd97706 : 0x71717a,
      metalness: 0.9,
      roughness: 0.15,
    });

    const forkLeft = new THREE.Mesh(forkStanchionGeo, forkMat);
    forkLeft.position.set(frontWheelX - 0.22, 0.15 + groundOffset, 0.12);
    forkLeft.rotation.z = -forkAngle;
    forkGroup.add(forkLeft);

    const forkRight = new THREE.Mesh(forkStanchionGeo, forkMat);
    forkRight.position.set(frontWheelX - 0.22, 0.15 + groundOffset, -0.12);
    forkRight.rotation.z = -forkAngle;
    forkGroup.add(forkRight);

    // Triple clamp
    const clampGeo = new THREE.BoxGeometry(0.1, 0.06, 0.34);
    const clamp = new THREE.Mesh(clampGeo, frameMat);
    clamp.position.set(frontWheelX - 0.42, 0.65 + groundOffset, 0);
    clamp.rotation.z = -forkAngle;
    forkGroup.add(clamp);

    // Handlebar
    const barGeo = new THREE.CylinderGeometry(0.022, 0.022, isDirtBike ? 0.82 : 0.72, 12);
    barGeo.rotateX(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, frameMat);
    bar.position.set(frontWheelX - 0.42, 0.72 + groundOffset, 0);
    forkGroup.add(bar);

    if (isDirtBike) {
      // Protective crossbar pad
      const padGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.28, 12);
      padGeo.rotateX(Math.PI / 2);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(frontWheelX - 0.42, 0.77 + groundOffset, 0);
      forkGroup.add(pad);
    }

    // TFT Dashboard screen
    const dashGeo = new THREE.BoxGeometry(0.08, 0.06, 0.12);
    const dash = new THREE.Mesh(dashGeo, emissiveHeadlightMat);
    dash.position.set(frontWheelX - 0.44, 0.76 + groundOffset, 0);
    dash.rotation.z = 0.35;
    forkGroup.add(dash);

    // Front Light or Race Number Plate
    if (category === 'cross') {
      // Front race number plate (Tabella portanumero frontale cross)
      const plateGeo = new THREE.BoxGeometry(0.03, 0.28, 0.25);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.3 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(frontWheelX - 0.24, 0.58 + groundOffset, 0);
      plate.rotation.z = -forkAngle;
      forkGroup.add(plate);
    } else {
      // Headlight projector
      const headlightGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const headlight = new THREE.Mesh(headlightGeo, emissiveHeadlightMat);
      headlight.position.set(frontWheelX - 0.22, 0.55 + groundOffset, 0);
      forkGroup.add(headlight);
    }

    bikeGroup.add(forkGroup);

    // Center bike group
    bikeGroup.position.set(0, -0.05, 0);
    scene.add(bikeGroup);

    // 7. Raycaster for click / tap inspection
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      if (!canvas || !camera) return;
      const rect = canvas.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(bikeGroup.children, true);

      if (intersects.length > 0) {
        // Find parent group with meaningful name
        let target: THREE.Object3D | null = intersects[0].object;
        let foundName = target.name;
        while (target && target.parent && target !== bikeGroup) {
          if (target.name) {
            foundName = target.name;
            break;
          }
          target = target.parent;
        }

        const partName = foundName || 'Dettaglio Moto';
        setSelectedPart(partName);
        if (onPartClick) onPartClick(partName);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // 8. Animation & Render Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Handle auto-rotation
      if (isAutoRotating && !isDragging.current) {
        rotationAngle.current.y += delta * 0.45;
      }

      // Apply inertia damping
      if (!isDragging.current) {
        rotationAngle.current.y += rotationVelocity.current.y;
        rotationAngle.current.x += rotationVelocity.current.x;

        rotationVelocity.current.y *= 0.92;
        rotationVelocity.current.x *= 0.92;
      }

      // Clamp vertical pitch (prevent flipping)
      rotationAngle.current.x = Math.max(-0.25, Math.min(0.85, rotationAngle.current.x));

      // Calculate camera position around center based on angles and distance
      const dist = cameraDistance.current;
      const rotY = rotationAngle.current.y;
      const rotX = rotationAngle.current.x;

      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX) + 0.35;
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);

      camera.lookAt(0, 0.25, 0);

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      scene.clear();
    };
  }, [category, primaryColor, accentColor, imageUrl, isAutoRotating, onPartClick]);

  // Touch and Mouse Gesture Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!interactive) return;
    isDragging.current = true;
    previousPointerPosition.current = { x: clientX, y: clientY };
    rotationVelocity.current = { x: 0, y: 0 };
    setIsAutoRotating(false);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!interactive || !isDragging.current) return;

    const deltaX = clientX - previousPointerPosition.current.x;
    const deltaY = clientY - previousPointerPosition.current.y;

    rotationVelocity.current = {
      x: deltaY * 0.005,
      y: -deltaX * 0.005,
    };

    rotationAngle.current.y += rotationVelocity.current.y;
    rotationAngle.current.x += rotationVelocity.current.x;

    previousPointerPosition.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    cameraDistance.current = Math.max(2.8, Math.min(8.5, cameraDistance.current + e.deltaY * 0.003));
  };

  // Touch gestures (Single finger rotation + Pinch to zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && touchStartDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const diff = touchStartDistance.current - currentDist;

      cameraDistance.current = Math.max(2.8, Math.min(8.5, cameraDistance.current + diff * 0.01));
      touchStartDistance.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistance.current = null;
    handlePointerUp();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50/90 via-white to-white border border-zinc-200 shadow-xl select-none group ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      } ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />

      {/* Top Overlay Badge & Header Info */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200/90 shadow-sm pointer-events-auto">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-zinc-200 shadow-inner"
            style={{ backgroundColor: primaryColor }}
            title={`Colore carrozzeria: ${primaryColor}`}
          />
          <span className="text-xs font-bold text-zinc-900 tracking-tight">
            {bike.name || 'Anteprima veicolo'}
          </span>
        </div>

        {/* 3D Interactive Badge */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-200 text-[11px] text-zinc-600 font-medium pointer-events-auto">
          <Sparkles className="w-3 h-3 text-orange-700 animate-pulse" />
          <span className="hidden sm:inline">3D 360° Studio</span>
        </div>
      </div>

      {/* Selected Component Inspection Chip */}
      {selectedPart && (
        <div className="absolute top-14 left-3 bg-orange-50/70 backdrop-blur-md border border-orange-500/40 text-orange-700 text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Info className="w-3.5 h-3.5 text-orange-700" />
          <span className="font-semibold">{selectedPart}</span>
          <button
            onClick={() => setSelectedPart(null)}
            className="text-orange-700 hover:text-zinc-900 ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hint touch bar */}
      <div className="absolute bottom-3 left-3 pointer-events-none text-[10px] text-zinc-600 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-200/80 hidden sm:flex items-center gap-1.5">
        <Layers className="w-3 h-3 text-orange-700" />
        <span>Trascina per ruotare • Clicca sui componenti</span>
      </div>

      {/* Bottom Floating Control Toolbar */}
      {showControls && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/85 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200/90 shadow-xl">
          {/* Camera Presets Menu */}
          <div className="hidden sm:flex items-center gap-1 border-r border-zinc-200 pr-1.5 mr-0.5">
            <button
              onClick={() => setCameraPreset('threeQuarter')}
              title="Vista 3/4"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCameraView === 'threeQuarter'
                  ? 'bg-orange-500/20 text-orange-700 border border-orange-500/30'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              title="Vista Laterale"
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCameraView === 'side'
                  ? 'bg-orange-500/20 text-orange-700 border border-orange-500/30'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              Lato
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              title="Vista Frontale"
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCameraView === 'front'
                  ? 'bg-orange-500/20 text-orange-700 border border-orange-500/30'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              Fronte
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isAutoRotating
                ? 'bg-orange-600/30 text-orange-700 border border-orange-500/30'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title={isAutoRotating ? 'Metti in pausa rotazione' : 'Avvia rotazione showroom'}
            aria-label="Toggle rotazione"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom In */}
          <button
            onClick={() => {
              cameraDistance.current = Math.max(2.8, cameraDistance.current - 0.6);
            }}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Ingrandisci"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              cameraDistance.current = Math.min(8.5, cameraDistance.current + 0.6);
            }}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Riduci"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Reimposta vista"
            aria-label="Reset vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title={isFullscreen ? 'Riduci' : 'Schermo intero'}
            aria-label="Toggle schermo intero"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
