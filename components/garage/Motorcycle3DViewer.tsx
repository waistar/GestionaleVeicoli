'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { applyCategoryKit } from './MotorcycleCategoryKits';
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
  Loader2,
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

  const [isLoadingModel, setIsLoadingModel] = useState(true);
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

  // Interaction state - Calibrated camera distance for heroic presence
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const rotationAngle = useRef({ x: 0.18, y: 0.72 }); // Hero front 3/4 showroom view
  const cameraDistance = useRef(2.70);
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
        rotationAngle.current = { x: 0.18, y: 0.72 };
        cameraDistance.current = 2.70;
        break;
      case 'side':
        rotationAngle.current = { x: 0.04, y: 0 };
        cameraDistance.current = 2.85;
        break;
      case 'front':
        rotationAngle.current = { x: 0.08, y: Math.PI / 2 };
        cameraDistance.current = 2.45;
        break;
      case 'cockpit':
        rotationAngle.current = { x: 0.32, y: -Math.PI / 2 };
        cameraDistance.current = 2.20;
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

    setIsLoadingModel(true);

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup - FOV 35 for cinematic perspective compression
    const aspect = container.clientWidth / (container.clientHeight || 300);
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 1.2, 2.70);

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
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Studio Environment Lighting (HDR RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;

    // Supplementary Studio Showroom Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key light (Crisp warm highlights on tank & bodywork)
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.8);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Front fill light (illuminates front wheel, forks, brake calipers)
    const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.6);
    frontFillLight.position.set(5, 1.5, 0);
    scene.add(frontFillLight);

    // Cool rim light for silhouette separation
    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.8);
    rimLight.position.set(-4, 3.5, -4);
    scene.add(rimLight);

    // Ground bounce light
    const groundBounce = new THREE.DirectionalLight(0x71717a, 0.5);
    groundBounce.position.set(0, -3, 0);
    scene.add(groundBounce);

    // Colored showroom accent point light matching primary color
    const pColor = new THREE.Color(primaryColor);
    const accentLight = new THREE.PointLight(pColor.getHex(), 2.8, 14);
    accentLight.position.set(0, 1.2, -3.5);
    scene.add(accentLight);

    // 5. Turntable Pedestal Floor (Enlarged to 2.85m radius so tires rest safely on stage)
    const turntableGroup = new THREE.Group();

    // Metallic brushed disk
    const discGeo = new THREE.CylinderGeometry(2.75, 2.85, 0.08, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.0,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.96;
    disc.receiveShadow = true;
    turntableGroup.add(disc);

    // Glowing LED Ring matching primary color
    const ringGeo = new THREE.RingGeometry(2.70, 2.76, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: pColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.915;
    turntableGroup.add(ring);

    // Soft Ambient Occlusion ground drop shadow under tires
    const shadowGeo = new THREE.PlaneGeometry(3.8, 2.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020204,
      transparent: true,
      opacity: 0.85,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.91;
    turntableGroup.add(shadow);

    scene.add(turntableGroup);

    // Root Group
    const bikeGroup = new THREE.Group();
    bikeGroupRef.current = bikeGroup;
    scene.add(bikeGroup);

    // 6. GLTF 3D REALISTIC MODEL LOADING
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Select dedicated realistic GLB model based on category
    function getGlbModelPath(cat: BikeCategory): string {
      switch (cat) {
        case 'naked':
          return '/models/naked_streetfighter.glb';
        case 'cross':
        case 'enduro':
          return '/models/dirtbike.glb';
        case 'scooter':
          return '/models/maxi_scooter.glb';
        case 'cruiser':
          return '/models/caferacer.glb';
        case 'adventure':
          return '/models/adventure_bike.glb';
        case 'sport':
        default:
          return '/models/sport_motorcycle.glb';
      }
    }

    const glbModelPath = getGlbModelPath(category);
    let isDisposed = false;

    gltfLoader.load(
      glbModelPath,
      (gltf) => {
        if (isDisposed) return;

        const model = gltf.scene;

        // Auto-center and normalize orientation
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());

        // Align along X-axis facing forward (+X)
        if (category === 'cross' || category === 'enduro') {
          // dirtbike.glb has length along Z, front at +Z. Rotating +90 deg around Y aligns front to +X
          model.rotation.y = Math.PI / 2;
        } else if (category === 'cruiser') {
          if (initialSize.z > initialSize.x) {
            model.rotation.y = Math.PI / 2;
          }
        } else if (initialSize.z > initialSize.x) {
          model.rotation.y = Math.PI / 2;
        }

        // Heroic scale calibrated per vehicle type
        const recheckRotBox = new THREE.Box3().setFromObject(model);
        const recheckSize = recheckRotBox.getSize(new THREE.Vector3());
        const lengthDim = Math.max(recheckSize.x, recheckSize.z);

        let targetLength = 3.25;
        if (category === 'scooter') targetLength = 2.95;
        else if (category === 'cross' || category === 'enduro') targetLength = 3.05;
        else if (category === 'cruiser') targetLength = 3.15;
        else if (category === 'naked') targetLength = 3.20;

        const scale = targetLength / lengthDim;
        model.scale.setScalar(scale);

        // Position tires directly on the showroom turntable (-0.91)
        const finalBox = new THREE.Box3().setFromObject(model);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());

        model.position.x = -finalCenter.x;
        model.position.y = -finalBox.min.y - 0.91;
        model.position.z = -finalCenter.z;

        // Category-specific hardware kits
        applyCategoryKit(bikeGroup, model, category, primaryColor, accentColor);

        // Precision material calibration tailored to each model's native materials
        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const originalMat = mesh.material as THREE.Material;
            const matName = originalMat?.name?.toLowerCase() || '';
            const meshName = mesh.name.toLowerCase();

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // --- 1. NAKED / ROADSTER (naked_streetfighter.glb) ---
            if (category === 'naked') {
              if (
                matName.includes('carpaint') ||
                matName.includes('streetfighter') ||
                meshName.includes('object_4') ||
                meshName.includes('object_19')
              ) {
                const pMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                pMat.map = null; // Clear baked-in red texture decal so primaryColor reflects cleanly
                pMat.color = new THREE.Color(primaryColor);
                pMat.metalness = 0.45;
                pMat.roughness = 0.16;
                pMat.envMapIntensity = 1.45;
                pMat.needsUpdate = true;
                mesh.material = pMat;
                mesh.name = 'Carrozzeria Streetfighter (Livrea Principale)';
              } else if (
                matName.includes('add') ||
                matName.includes('mat.8') ||
                matName.includes('mat.9') ||
                meshName.includes('object_5')
              ) {
                const aMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#25262c';
                aMat.color = new THREE.Color(effectiveAccent);
                aMat.metalness = 0.50;
                aMat.roughness = 0.22;
                mesh.material = aMat;
                mesh.name = 'Dettagli & Finiture Naked';
              } else if (matName.includes('engine')) {
                mesh.name = 'Motore V4 Meccanico a Vista';
              } else if (matName.includes('tire') || matName.includes('tyre')) {
                mesh.name = 'Pneumatici Sportivi ad Alto Grip';
              } else if (matName.includes('brake') || matName.includes('disk')) {
                mesh.name = 'Impianto Frenante Brembo Radiale';
              } else if (matName.includes('exhaust')) {
                mesh.name = 'Scarico Sportivo Naked';
              }
            }

            // --- 2. ENDURO & CROSS (dirtbike.glb) ---
            else if (category === 'cross' || category === 'enduro') {
              if (matName.includes('material.001') || matName.includes('material.004')) {
                const pMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                pMat.color = new THREE.Color(primaryColor);
                pMat.metalness = 0.18;
                pMat.roughness = 0.32;
                pMat.envMapIntensity = 1.25;
                mesh.material = pMat;
                mesh.name = category === 'cross' ? 'Plastiche & Serbatoio Cross' : 'Plastiche & Serbatoio Enduro';
              } else if (matName.includes('secdry')) {
                const aMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent =
                  accentColor && accentColor !== '#18181b'
                    ? accentColor
                    : category === 'cross'
                    ? '#ffffff'
                    : '#18181b';
                aMat.color = new THREE.Color(effectiveAccent);
                aMat.metalness = 0.10;
                aMat.roughness = 0.40;
                mesh.material = aMat;
                mesh.name = category === 'cross' ? 'Tabella Portanumero Gara (Bianco)' : 'Inserti & Grafiche Enduro';
              } else if (matName.includes('tyre')) {
                mesh.name = 'Pneumatici Tassellati da Fuoristrada';
              } else if (matName.includes('metal')) {
                mesh.name = 'Telaio & Cerchi a Raggi Rinforzati';
              } else if (matName.includes('exh') || matName.includes('material.003')) {
                mesh.name = 'Espansione & Scarico Racing Fuoristrada';
              }
            }

            // --- 3. MAXI SCOOTER / URBAN (maxi_scooter.glb) ---
            else if (category === 'scooter') {
              if (
                matName.includes('black graphite molded paint') ||
                meshName.includes('trapezoid') ||
                meshName.includes('cover') ||
                meshName.includes('sill')
              ) {
                const pMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                pMat.color = new THREE.Color(primaryColor);
                pMat.metalness = 0.38;
                pMat.roughness = 0.20;
                pMat.envMapIntensity = 1.35;
                mesh.material = pMat;
                mesh.name = 'Scudo & Carrozzeria Maxi-Scooter';
              } else if (
                matName.includes('red painted accents') ||
                meshName.includes('shock_collar') ||
                meshName.includes('terminus')
              ) {
                const aMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#e11d48';
                aMat.color = new THREE.Color(effectiveAccent);
                aMat.metalness = 0.45;
                aMat.roughness = 0.22;
                mesh.material = aMat;
                mesh.name = 'Profili & Dettagli Sportivi Scooter';
              } else if (matName.includes('footmat') || matName.includes('footwell') || matName.includes('tread')) {
                mesh.name = 'Pedana Sagomata Antiscivolo';
              } else if (matName.includes('upholstery') || matName.includes('saddle')) {
                mesh.name = 'Sella Comfort Bi-Posto Scooter';
              } else if (matName.includes('polycarbonate') || matName.includes('window') || matName.includes('lens')) {
                mesh.name = 'Cupolino & Gruppo Ottico LED';
              } else if (matName.includes('aluminium')) {
                mesh.name = 'Leva Freni & Componenti Meccanici';
              }
            }

            // --- 4. CAFE RACER / CRUISER (caferacer.glb) ---
            else if (category === 'cruiser') {
              if (matName.includes('purple')) {
                const cMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                cMat.color = new THREE.Color(primaryColor);
                cMat.metalness = 0.35;
                cMat.roughness = 0.14;
                cMat.envMapIntensity = 1.45;
                mesh.material = cMat;
                mesh.name = 'Serbatoio a Goccia & Codone Custom';
              } else if (matName.includes('car paint - black solid')) {
                const fMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#18191e';
                fMat.color = new THREE.Color(effectiveAccent);
                fMat.envMapIntensity = 1.15;
                mesh.material = fMat;
                mesh.name = 'Telaio Tubolare Custom';
              } else if (matName.includes('chrome')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 2.4;
                }
                mesh.name = 'Motore & Terminali di Scarico Cromati';
              } else if (matName.includes('leather')) {
                mesh.name = 'Sella Artigianale in Pelle';
              } else if (matName.includes('rubber')) {
                mesh.name = 'Pneumatici Tradizionali Vintage';
              } else if (matName.includes('glass')) {
                mesh.name = 'Faro Tondo Tradizionale';
              }
            }

            // --- 5. ADVENTURE / DUAL-SPORT & RALLY (adventure_bike.glb) ---
            else if (category === 'adventure') {
              if (matName.includes('benzobak_white_dark') || meshName.includes('benzobak_white_dark')) {
                const pMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                pMat.color = new THREE.Color(primaryColor);
                pMat.metalness = 0.38;
                pMat.roughness = 0.18;
                pMat.envMapIntensity = 1.45;
                mesh.material = pMat;
                mesh.name = 'Serbatoio Adventure Rally (Livrea Principale)';
              } else if (matName.includes('benzobak_white1') || meshName.includes('benzobak_white1')) {
                const wMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                wMat.color = new THREE.Color(0xf1f5f9);
                wMat.metalness = 0.25;
                wMat.roughness = 0.25;
                wMat.envMapIntensity = 1.30;
                mesh.material = wMat;
                mesh.name = 'Grafiche & Inserti Bicolore Serbatoio';
              } else if (matName.includes('sidenie') || matName.includes('kozha')) {
                const aMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#3a2618';
                aMat.color = new THREE.Color(effectiveAccent);
                aMat.metalness = 0.05;
                aMat.roughness = 0.65;
                aMat.envMapIntensity = 1.15;
                mesh.material = aMat;
                mesh.name = 'Sella Touring Adventure in Pelle';
              } else if (matName.includes('protector') || matName.includes('rezina')) {
                mesh.name = 'Pneumatici Tassellati Adventure On/Off-Road';
              } else if (matName.includes('fara') || matName.includes('fonarreshotka')) {
                mesh.name = 'Faro Anteriore con Griglia Parasassi Rally';
              } else if (matName.includes('black_rama') || matName.includes('krepeg')) {
                mesh.name = 'Telaio Tubolare a Traliccio Rinforzato';
              } else if (matName.includes('glyshitel')) {
                mesh.name = 'Terminale di Scarico Rialzato Dakar Rally';
              } else if (matName.includes('radiator')) {
                mesh.name = 'Radiatore Maggiorato Adventure';
              } else if (matName.includes('ryl_vilka') || matName.includes('vilka')) {
                mesh.name = 'Manubrio Largo & Forcelle Telescopiche a Lunga Escursione';
              } else if (matName.includes('speedometr') || matName.includes('tahometr')) {
                mesh.name = 'Cockpit & Strumentazione Digitale da Viaggio';
              } else if (matName.includes('tormoz') || matName.includes('disk')) {
                mesh.name = 'Dischi Freno Forati per Fango e Asfalto';
              } else if (matName.includes('dvigatel')) {
                mesh.name = 'Motore Bicilindrico Adventure Raffreddato a Liquido';
              } else if (matName.includes('stopsignal') || matName.includes('prozrach')) {
                mesh.name = 'Indicatori LED & Fanale Posteriore Sigillato';
              }
            }

            // --- 6. SPORT / SUPERSPORT (sport_motorcycle.glb) ---
            else {
              if (matName.includes('carpaint.001')) {
                const pMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                pMat.color = new THREE.Color(primaryColor);
                pMat.metalness = 0.38;
                pMat.roughness = 0.15;
                pMat.envMapIntensity = 1.45;
                mesh.material = pMat;
                mesh.name = 'Carrozzeria & Serbatoio (Livrea Principale)';
              } else if (matName.includes('carpaint_second')) {
                const sMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#25262c';
                sMat.color = new THREE.Color(effectiveAccent);
                sMat.metalness = 0.42;
                sMat.roughness = 0.20;
                sMat.envMapIntensity = 1.25;
                mesh.material = sMat;
                mesh.name = 'Inserti Carenatura & Dettagli Livrea';
              } else if (matName.includes('rim_second')) {
                const rMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                rMat.color = new THREE.Color(0x222328);
                rMat.metalness = 0.82;
                rMat.roughness = 0.28;
                mesh.material = rMat;
                mesh.name = 'Cerchi in Lega Metallizzata';
              } else if (mesh.name?.includes('decal_rim') || (matName.includes('red') && mesh.name?.includes('rim'))) {
                const decMat = (mesh.material as THREE.MeshStandardMaterial).clone();
                decMat.color = new THREE.Color(primaryColor);
                decMat.metalness = 0.40;
                decMat.roughness = 0.20;
                mesh.material = decMat;
                mesh.name = 'Filetto Sportivo Cerchi';
              } else if (matName.includes('chrome')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 2.2;
                  (mesh.material as any).roughness = 0.05;
                  (mesh.material as any).metalness = 0.98;
                }
                mesh.name = 'Scarico Cromato & Specchietti';
              } else if (matName.includes('gold')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 1.6;
                  (mesh.material as any).roughness = 0.18;
                  (mesh.material as any).metalness = 0.92;
                }
                mesh.name = 'Forcelle Steli Rovesciati Gold';
              } else if (matName.includes('brakedisk')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 1.7;
                  (mesh.material as any).roughness = 0.12;
                  (mesh.material as any).metalness = 0.95;
                }
                mesh.name = 'Dischi Freno Forati ad Alte Prestazioni';
              } else if (matName.includes('mattemetal')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 1.35;
                }
                mesh.name = 'Alluminio Meccanico Spazzolato';
              } else if (matName.includes('black')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 1.05;
                }
                mesh.name = 'Motore & Telaio Nero Satinato';
              } else if (matName.includes('glass')) {
                if ('envMapIntensity' in (mesh.material as any)) {
                  (mesh.material as any).envMapIntensity = 1.6;
                }
                mesh.name = 'Gruppo Ottico & Cupolino';
              } else if (matName.includes('tire')) {
                mesh.name = 'Pneumatici Sportivi ad Alto Grip';
              }
            }
          }
        });

        // Add model to scene
        bikeGroup.add(model);
        setIsLoadingModel(false);
      },
      undefined,
      (err) => {
        console.warn('GLB load error, check network or asset path:', err);
        if (!isDisposed) {
          setIsLoadingModel(false);
        }
      }
    );

    // 8. Raycaster for click / tap inspection
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
        let target: THREE.Object3D | null = intersects[0].object;
        let foundName = target.name;
        while (target && target.parent && target !== bikeGroup) {
          if (target.name && !target.name.startsWith('Mesh') && !target.name.startsWith('Object')) {
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

    // 9. Animation & Render Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Auto-rotation in showroom mode
      if (isAutoRotating && !isDragging.current) {
        rotationAngle.current.y += delta * 0.42;
      }

      // Inertia physics damping
      if (!isDragging.current) {
        rotationAngle.current.y += rotationVelocity.current.y;
        rotationAngle.current.x += rotationVelocity.current.x;

        rotationVelocity.current.y *= 0.92;
        rotationVelocity.current.x *= 0.92;
      }

      // Pitch clamping
      rotationAngle.current.x = Math.max(-0.25, Math.min(0.85, rotationAngle.current.x));

      // Spherical camera positioning
      const dist = cameraDistance.current;
      const rotY = rotationAngle.current.y;
      const rotX = rotationAngle.current.x;

      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX) + 0.35;
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);

      camera.lookAt(0, 0.22, 0);

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // 10. Responsive Resize Observer
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

    // Cleanup WebGL resources
    return () => {
      isDisposed = true;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleCanvasClick);
      pmremGenerator.dispose();
      renderer.dispose();
      dracoLoader.dispose();
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
    cameraDistance.current = Math.max(2.4, Math.min(7.5, cameraDistance.current + e.deltaY * 0.003));
  };

  // Pinch-to-zoom on mobile touch screens
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

      cameraDistance.current = Math.max(2.4, Math.min(7.5, cameraDistance.current + diff * 0.01));
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
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 shadow-xl select-none group ${
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

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-20 pointer-events-none transition-opacity duration-300">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          <span className="text-xs font-semibold text-zinc-300 tracking-tight">
            Rendering Modello 3D Realistico...
          </span>
        </div>
      )}

      {/* Top Overlay Badge & Header Info */}
      <div className="absolute top-2.5 xs:top-3 left-2.5 xs:left-3 right-2.5 xs:right-3 flex items-center justify-between gap-1.5 xs:gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 xs:gap-2 bg-zinc-950/85 backdrop-blur-md px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-xl border border-zinc-800/90 shadow-md pointer-events-auto max-w-[70%] sm:max-w-none min-w-0">
          <div
            className="w-3 h-3 xs:w-3.5 xs:h-3.5 rounded-full ring-2 ring-zinc-800 shadow-inner shrink-0"
            style={{ backgroundColor: primaryColor }}
            title={`Colore livrea: ${primaryColor}`}
          />
          <span className="text-[11px] xs:text-xs font-bold text-zinc-100 tracking-tight truncate">
            {bike.name || 'Modello 3D Moto'}
          </span>
          <span className="text-[9px] xs:text-[10px] uppercase font-mono px-1.5 xs:px-2 py-0.5 rounded-md bg-zinc-800/90 text-orange-400 font-bold border border-zinc-700/80 shrink-0">
            {category}
          </span>
        </div>

        {/* 3D Interactive Badge */}
        <div className="flex items-center gap-1 xs:gap-1.5 bg-zinc-950/85 backdrop-blur-md px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-xl border border-zinc-800 text-[10px] xs:text-[11px] text-zinc-300 font-semibold pointer-events-auto shadow-md shrink-0">
          <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-orange-400 animate-pulse shrink-0" />
          <span className="hidden sm:inline">3D Studio Showroom</span>
          <span className="sm:hidden font-mono">3D</span>
        </div>
      </div>

      {/* Selected Component Inspection Chip */}
      {selectedPart && (
        <div className="absolute top-12 xs:top-14 left-2.5 xs:left-3 max-w-[calc(100%-1.5rem)] bg-zinc-950/90 backdrop-blur-md border border-orange-500/50 text-orange-300 text-xs px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 z-10">
          <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="font-semibold text-zinc-100 truncate">{selectedPart}</span>
          <button
            onClick={() => setSelectedPart(null)}
            className="text-orange-400 hover:text-white ml-1 text-xs font-bold px-1 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hint touch bar */}
      <div className="absolute bottom-3 left-3 pointer-events-none text-[10px] text-zinc-400 bg-zinc-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800/80 hidden sm:flex items-center gap-2 z-10">
        <Layers className="w-3.5 h-3.5 text-orange-400" />
        <span>Trascina per ruotare 360° • Clicca sui componenti</span>
      </div>

      {/* Bottom Floating Control Toolbar */}
      {showControls && (
        <div className="absolute bottom-2.5 xs:bottom-3 right-2.5 xs:right-3 flex items-center gap-1 xs:gap-1.5 bg-zinc-950/90 backdrop-blur-md p-1 xs:p-1.5 rounded-2xl border border-zinc-800/90 shadow-2xl z-10 max-w-[calc(100%-1.25rem)] overflow-x-auto no-scrollbar">
          {/* Camera Presets Menu */}
          <div className="hidden sm:flex items-center gap-1 border-r border-zinc-800 pr-1.5 mr-0.5 shrink-0">
            <button
              onClick={() => setCameraPreset('threeQuarter')}
              title="Vista 3/4 Showroom"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCameraView === 'threeQuarter'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              title="Vista Profilo Laterale"
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCameraView === 'side'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              Lato
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              title="Vista Frontale"
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCameraView === 'front'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              Fronte
            </button>
            <button
              onClick={() => setCameraPreset('cockpit')}
              title="Vista Cockpit & Manubrio"
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCameraView === 'cockpit'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              Guida
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 xs:p-2 rounded-xl text-xs transition-all shrink-0 ${
              isAutoRotating
                ? 'bg-orange-600/30 text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isAutoRotating ? 'Pausa rotazione showroom' : 'Avvia rotazione 360°'}
            aria-label="Toggle rotazione"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom In */}
          <button
            onClick={() => {
              cameraDistance.current = Math.max(2.4, cameraDistance.current - 0.4);
            }}
            className="p-1.5 xs:p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            title="Ingrandisci zoom"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              cameraDistance.current = Math.min(7.5, cameraDistance.current + 0.4);
            }}
            className="p-1.5 xs:p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            title="Riduci zoom"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-1.5 xs:p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            title="Ripristina visuale 3/4"
            aria-label="Reset visuale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 xs:p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            title={isFullscreen ? 'Riduci finestra' : 'Visualizza a schermo intero'}
            aria-label="Toggle schermo intero"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
