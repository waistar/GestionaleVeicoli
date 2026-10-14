import * as THREE from 'three';
import { BikeCategory } from '@/lib/supabase/types';

/**
 * MotorcycleCategoryKits
 * Dynamically modifies the 3D model geometry and adds authentic category-specific
 * hardware (Adventure Expedition Beak & Panniers, Motocross Race Plate & Crossbar Pad,
 * Enduro Trail Light & Lens, Sport Downforce Wings) so every bike category has an
 * unmistakable, anatomically correct identity while stripping manufacturer track decals.
 */

export function applyCategoryKit(
  bikeGroup: THREE.Group,
  model: THREE.Group,
  category: BikeCategory,
  primaryColor: string,
  accentColor: string
): THREE.Group {
  // Strip track racing decals only if model is sport_motorcycle
  if (category === 'sport') {
    const bmwAndTrackDecals = [
      'bmw_logo',
      'bmw_logo_chrome',
      'decal_red',
      'decal_red_red',
      'dacal_white_logo',
      'decal_blue_logo',
      'decal_blue',
      'decal_black',
      'frame_logo',
      'logo_engine',
      'arrow',
      'axis_arrow',
    ];

    bmwAndTrackDecals.forEach((name) => {
      const obj = model.getObjectByName(name);
      if (obj) obj.visible = false;
    });
  }

  // Create an accessory group anchored to bikeGroup
  const kitGroup = new THREE.Group();
  kitGroup.name = `CategoryKit_${category}`;
  bikeGroup.add(kitGroup);

  // Common high-fidelity PBR materials
  const pColor = new THREE.Color(primaryColor);
  const effectiveAccent = accentColor && accentColor !== '#18181b' ? accentColor : '#25262c';
  const aColor = new THREE.Color(effectiveAccent);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: pColor,
    metalness: 0.38,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.95,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: aColor,
    metalness: 0.55,
    roughness: 0.22,
    envMapIntensity: 1.25,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x18191e,
    metalness: 0.70,
    roughness: 0.35,
    envMapIntensity: 1.15,
  });

  const aluMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.92,
    roughness: 0.22,
    envMapIntensity: 1.60,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0f9ff,
    transmission: 0.94,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.52,
    reflectivity: 0.9,
  });

  // ==========================================
  // 1. ADVENTURE / MAXI-ENDURO (BMW GS, Ténéré, Africa Twin)
  // ==========================================
  if (category === 'adventure') {
    // A. Tall Rally Touring Windscreen (Directly above the stone-guard headlight)
    const rallyScreenGeo = new THREE.PlaneGeometry(0.24, 0.38, 4, 4);
    const rallyScreen = new THREE.Mesh(rallyScreenGeo, glassMat);
    rallyScreen.position.set(0.72, 0.62, 0);
    rallyScreen.rotation.set(0, Math.PI / 2, 0.22);
    rallyScreen.name = 'Cupolino Touring Rally Alto';
    kitGroup.add(rallyScreen);

    // B. Heavy-Duty Tubular Engine Crash Bars (Left & Right flanking the twin engine)
    const cageGeoL = new THREE.TorusGeometry(0.22, 0.016, 12, 24, Math.PI * 1.3);
    const leftCrashBar = new THREE.Mesh(cageGeoL, aluMat);
    leftCrashBar.position.set(0.12, -0.05, -0.30);
    leftCrashBar.rotation.set(0.35, 0.15, 0);
    leftCrashBar.castShadow = true;
    leftCrashBar.name = 'Barre Paramotore Tubolari Sinistre';
    kitGroup.add(leftCrashBar);

    const rightCrashBar = new THREE.Mesh(cageGeoL, aluMat);
    rightCrashBar.position.set(0.12, -0.05, 0.30);
    rightCrashBar.rotation.set(-0.35, -0.15, 0);
    rightCrashBar.castShadow = true;
    rightCrashBar.name = 'Barre Paramotore Tubolari Destre';
    kitGroup.add(rightCrashBar);

    // C. Dual Expedition Aluminum Panniers (Side Luggage Hard Cases)
    const caseGeo = new THREE.BoxGeometry(0.44, 0.34, 0.22);

    const leftCase = new THREE.Mesh(caseGeo, aluMat);
    leftCase.position.set(-0.72, 0.14, -0.42);
    leftCase.castShadow = true;
    leftCase.name = 'Valigia Laterale Alluminio Expedition (SX)';
    kitGroup.add(leftCase);

    const rightCase = new THREE.Mesh(caseGeo, aluMat);
    rightCase.position.set(-0.72, 0.14, 0.42);
    rightCase.castShadow = true;
    rightCase.name = 'Valigia Laterale Alluminio Expedition (DX)';
    kitGroup.add(rightCase);

    // Black reinforced corner bumpers & luggage lid latches
    const bumperGeo = new THREE.BoxGeometry(0.45, 0.04, 0.23);
    const leftBumper = new THREE.Mesh(bumperGeo, darkMat);
    leftBumper.position.set(-0.72, 0.30, -0.42);
    kitGroup.add(leftBumper);

    const rightBumper = new THREE.Mesh(bumperGeo, darkMat);
    rightBumper.position.set(-0.72, 0.30, 0.42);
    kitGroup.add(rightBumper);

    // Red rear reflectors on panniers
    const reflectorGeo = new THREE.PlaneGeometry(0.04, 0.12);
    const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const leftReflector = new THREE.Mesh(reflectorGeo, reflectorMat);
    leftReflector.position.set(-0.95, 0.14, -0.42);
    leftReflector.rotation.y = -Math.PI / 2;
    kitGroup.add(leftReflector);

    const rightReflector = new THREE.Mesh(reflectorGeo, reflectorMat);
    rightReflector.position.set(-0.95, 0.14, 0.42);
    rightReflector.rotation.y = -Math.PI / 2;
    kitGroup.add(rightReflector);

    // D. Adventure Handguards
    const guardGeo = new THREE.BoxGeometry(0.07, 0.09, 0.15);
    const leftGuard = new THREE.Mesh(guardGeo, darkMat);
    leftGuard.position.set(0.48, 0.68, -0.38);
    leftGuard.rotation.y = 0.25;
    leftGuard.name = 'Paramano Adventure Sinistro';
    kitGroup.add(leftGuard);

    const rightGuard = new THREE.Mesh(guardGeo, darkMat);
    rightGuard.position.set(0.48, 0.68, 0.38);
    rightGuard.rotation.y = -0.25;
    rightGuard.name = 'Paramano Adventure Destro';
    kitGroup.add(rightGuard);
  }

  // ==========================================
  // 2. ENDURO / DUAL-SPORT (dirtbike.glb trail equipment)
  // ==========================================
  else if (category === 'enduro') {
    // Street-legal Enduro Front Headlight & Mask
    const lightMaskGeo = new THREE.BoxGeometry(0.08, 0.16, 0.16);
    const lightMask = new THREE.Mesh(lightMaskGeo, bodyMat);
    lightMask.position.set(0.82, 0.38, 0);
    lightMask.rotation.z = -0.20;
    lightMask.name = 'Mascherina Faro Enduro Stradale';
    kitGroup.add(lightMask);

    const lightLensGeo = new THREE.PlaneGeometry(0.10, 0.10);
    const lightLensMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const lightLens = new THREE.Mesh(lightLensGeo, lightLensMat);
    lightLens.position.set(0.87, 0.38, 0);
    lightLens.rotation.y = Math.PI / 2;
    lightLens.name = 'Faro Anteriore Enduro Omologato';
    kitGroup.add(lightLens);

    // Red Tail Light Reflector on high mudguard
    const tailLightGeo = new THREE.BoxGeometry(0.04, 0.06, 0.10);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailLight = new THREE.Mesh(tailLightGeo, tailMat);
    tailLight.position.set(-0.85, 0.42, 0);
    tailLight.name = 'Fanalino Posteriore LED Enduro';
    kitGroup.add(tailLight);
  }

  // ==========================================
  // 3. CROSS / MOTOCROSS (dirtbike.glb race equipment)
  // ==========================================
  else if (category === 'cross') {
    // A. Competition Front Race Number Plate (Pure track, no lights)
    const plateGeo = new THREE.BoxGeometry(0.02, 0.20, 0.18);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    const racePlate = new THREE.Mesh(plateGeo, plateMat);
    racePlate.position.set(0.82, 0.40, 0);
    racePlate.rotation.z = -0.22;
    racePlate.name = 'Tabella Portanumero Gara Motocross';
    kitGroup.add(racePlate);

    // B. Handlebar Safety Foam Pad (Paracolpi manubrio da gara)
    const padGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.24, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: pColor,
      roughness: 0.65,
      metalness: 0.1,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(0.56, 0.52, 0);
    pad.name = 'Paracolpi Manubrio Gara Motocross';
    kitGroup.add(pad);
  }

  // ==========================================
  // 4. SPORT / SUPERSPORT (Universal GP Racer)
  // ==========================================
  else if (category === 'sport') {
    // Add sleek aerodynamic downforce winglets
    const wingGeo = new THREE.BoxGeometry(0.14, 0.02, 0.24);

    const leftWing = new THREE.Mesh(wingGeo, accentMat);
    leftWing.position.set(0.72, 0.22, -0.24);
    leftWing.rotation.set(-0.15, 0.3, -0.15);
    leftWing.castShadow = true;
    leftWing.name = 'Aletta Aerodinamica Downforce (SX)';
    kitGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, accentMat);
    rightWing.position.set(0.72, 0.22, 0.24);
    rightWing.rotation.set(0.15, -0.3, -0.15);
    rightWing.castShadow = true;
    rightWing.name = 'Aletta Aerodinamica Downforce (DX)';
    kitGroup.add(rightWing);
  }

  return kitGroup;
}
