/**
 * Mequinenza 3D · Visor Histórico Fotorrealista
 * Motor 3D WebGL con Three.js, controles orbitales, gemelo digital y vistas de calle
 */

import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';

export class MequinenzaViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Scene meshes
    this.panoSphere = null;
    this.panoMaterial = null;
    this.particleSystem = null;
    this.birdsGroup = new THREE.Group();

    // Textures cache
    this.textureLoader = new THREE.TextureLoader();
    this.panoTextures = {};

    // Mode state: 'aerial' (default digital twin) or 'street' (cobblestone ruins)
    this.currentMode = 'aerial';

    // Landmark Data (Mapeado exacto a la vista aérea fotorrealista)
    this.landmarks = {
      overview: {
        id: 'overview',
        title: 'Castillo y Casco Antiguo',
        subtitle: 'Mequinenza · Confluencia del Ebro y Segre',
        era: 'Siglos XII - XX',
        altitude: '148 m aprox.',
        panoKey: 'aerial',
        targetYaw: 0,
        targetPitch: 0.0,
        targetFov: 46,
        thumb: 'assets/ref/castillo/castell3.jpg',
        category: 'all',
        desc: 'Recreación fotorrealista integral del Castillo medieval de Mequinenza, las ruinas del Poble Vell escalonadas en la ladera y la confluencia de los ríos Ebro y Segre ("Aiguabarreig").',
        historyFact: 'Identificada por Julio César como "Octogesa" en su De Bello Civili, siendo enclave militar y comercial clave entre Aragón y Cataluña durante dos milenios.'
      },
      castillo: {
        id: 'castillo',
        title: 'Castillo de Mequinenza',
        subtitle: 'Fortaleza medieval de los Moncada',
        era: 'Siglo XII - XIII',
        altitude: '148 m aprox.',
        panoKey: 'aerial',
        targetYaw: 0.04,
        targetPitch: 0.16,
        targetFov: 32,
        pinPos: new THREE.Vector3(4, 16, -98.6),
        thumb: 'assets/ref/castillo/castell3.jpg',
        category: 'castillo',
        desc: 'Fortaleza medieval construida entre los siglos XII y XIII, de la que se conservan sus murallas, torres y el recinto principal. Desde lo alto del cerro, domina la confluencia del Ebro y el Segre.',
        historyFact: 'En 1810 resistió el asedio de las tropas napoleónicas del Mariscal Suchet; la hazaña quedó grabada con el nombre de Mequinenza en el Arco de Triunfo de París.'
      },
      poble: {
        id: 'poble',
        title: 'Casco antiguo',
        subtitle: 'Poble Vell · Ruinas y arquitectura tradicional',
        era: 'Medieval - siglo XX',
        altitude: '95 m aprox.',
        panoKey: 'aerial',
        targetYaw: -0.24,
        targetPitch: -0.08,
        targetFov: 33,
        pinPos: new THREE.Vector3(-24, -8, -96.7),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        category: 'pueblo',
        desc: 'Conjunto urbano escalonado de casas de piedra caliza, callejones empedrados y arcos tradicionales situado en la falda del monte, desalojado en los años 60 por la construcción del embalse de Riba-roja.',
        historyFact: 'Cuna del célebre novelista Jesús Moncada, quien inmortalizó su vida, barqueros y mineros en su obra cumbre "Camí de sirga".'
      },
      ebro: {
        id: 'ebro',
        title: 'Río Ebro',
        subtitle: 'Gran vía fluvial y ruta de los Llaüts',
        era: 'Vía fluvial milenaria',
        altitude: '65 m aprox.',
        panoKey: 'aerial',
        targetYaw: 0.48,
        targetPitch: 0.04,
        targetFov: 34,
        pinPos: new THREE.Vector3(46, 6, -88.6),
        thumb: 'assets/ref/llauts/llauts1.jpg',
        category: 'llauts',
        desc: 'Corredor fluvial navegable por donde transitaban los tradicionales "llaüts", embarcaciones de madera que transportaban el carbón de las minas mequinenzanas hacia Tortosa y el Mediterráneo.',
        historyFact: 'Los sirgadores remontaban los barcos a contracorriente con sogas desde las orillas del río en durísimas jornadas.'
      },
      segre: {
        id: 'segre',
        title: 'Río Segre',
        subtitle: 'Confluencia fluvial ("Aiguabarreig")',
        era: 'Paraje natural e histórico',
        altitude: '65 m aprox.',
        panoKey: 'aerial',
        targetYaw: 0.52,
        targetPitch: -0.18,
        targetFov: 34,
        pinPos: new THREE.Vector3(50, -18, -84.6),
        thumb: 'assets/ref/generals/generals1.jpg',
        category: 'generals',
        desc: 'Punto de unión donde el río Segre (tras recibir las aguas del Cinca) entrega su caudal al Ebro, formando una de las reservas fluviales y ecológicas más ricas de Europa.',
        historyFact: 'Límite histórico natural y paso de barcas estratégico, escenario clave en la Batalla del Ebro de 1938.'
      },
      poi: {
        id: 'poi',
        title: 'Puntos de interés',
        subtitle: 'Patrimonio histórico, minero y cultural',
        era: 'Siglos XII - XX',
        altitude: '65 - 185 m',
        panoKey: 'aerial',
        targetYaw: 0,
        targetPitch: 0.0,
        targetFov: 46,
        thumb: 'assets/ref/paneles/panel_castillo_historico.jpeg',
        category: 'all',
        desc: 'Colección de monumentos y vestigios singulares: Iglesia de la Asunción, las minas de lignito, los antiguos puentes y los paneles conmemorativos del Poble Vell.',
        historyFact: 'El museo histórico municipal atesora paneles y fotografías originales que documentan la vida del pueblo antes de la inundación.'
      }
    };

    this.activeLandmarkId = 'overview';
    this.activePanoKey = 'aerial';
    this.pinElements = new Map();

    // Atmosphere
    this.currentAtmosphere = 'morning';

    this.init();
  }

  /* ========================================================================
     INITIALIZATION
     ======================================================================== */
  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.loadPanoramas();
    this.createAtmosphereEffects();
    this.createScreenPins();
    this.bindEvents();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 0.1);
  }

  setupRenderer() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = -0.35; // Inverted for natural intuitive panorama look-around
    this.controls.minDistance = 0.01;
    this.controls.maxDistance = 1.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.25;

    // Constrain vertical polar angle so horizon feels solid
    this.controls.minPolarAngle = Math.PI * 0.28;
    this.controls.maxPolarAngle = Math.PI * 0.72;
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfff5ea, 1.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfae, 1.8);
    this.sunLight.position.set(10, 15, -10);
    this.scene.add(this.sunLight);
  }

  /* ========================================================================
     PANORAMIC ENVIRONMENT (Photorealistic Sphere Projection)
     ======================================================================== */
  loadPanoramas() {
    // 1. Aerial Digital Twin (Vista General Aérea)
    const texAerial = this.textureLoader.load('assets/mequinenza_aerea_panoramica.jpg');
    texAerial.colorSpace = THREE.SRGBColorSpace;
    texAerial.wrapS = THREE.ClampToEdgeWrapping;
    texAerial.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.aerial = texAerial;

    // 2. Street-Level Poble Vell Ruins & Cobblestones
    const texStreet = this.textureLoader.load('assets/poble_vell_fotorrealista.jpg');
    texStreet.colorSpace = THREE.SRGBColorSpace;
    texStreet.wrapS = THREE.ClampToEdgeWrapping;
    texStreet.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.street = texStreet;

    // Curved panoramic cylindrical sphere for immersive distortion-free visualization
    const sphereGeo = new THREE.SphereGeometry(100, 64, 40);
    sphereGeo.scale(-1, 1, 1); // Invert faces so texture is viewed from inside

    this.panoMaterial = new THREE.MeshBasicMaterial({
      map: texAerial,
      toneMapped: true
    });

    this.panoSphere = new THREE.Mesh(sphereGeo, this.panoMaterial);
    this.scene.add(this.panoSphere);
  }

  switchPanorama(panoKey) {
    if (this.panoTextures[panoKey] && this.panoMaterial) {
      this.activePanoKey = panoKey;
      this.panoMaterial.map = this.panoTextures[panoKey];
      this.panoMaterial.needsUpdate = true;
    }
  }

  /* ========================================================================
     ATMOSPHERIC EFFECTS (Particles, Sunbeams, Birds)
     ======================================================================== */
  createAtmosphereEffects() {
    // 1. Shimmering dust motes floating in golden sunlight
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 25;
      positions[i + 2] = -20 - Math.random() * 50;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffe8ba,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particleSystem);

    // 2. Birds soaring over the cliff
    this.scene.add(this.birdsGroup);
    const birdGeo = new THREE.BufferGeometry();
    const birdVerts = new Float32Array([
      -0.4, 0, 0,  0, 0, 0.4,  0.4, 0, 0
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(birdVerts, 3));
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a2430, side: THREE.DoubleSide });

    this.birds = [];
    for (let i = 0; i < 8; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat);
      bird.userData = {
        radius: 40 + Math.random() * 25,
        angle: (i / 8) * Math.PI * 2,
        height: 10 + Math.random() * 12,
        speed: 0.18 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2
      };
      this.birdsGroup.add(bird);
      this.birds.push(bird);
    }
  }

  /* ========================================================================
     ATMOSPHERE LIGHTING PRESETS
     ======================================================================== */
  setAtmosphere(mode) {
    this.currentAtmosphere = mode;
    switch (mode) {
      case 'morning': // Golden Hour
        this.renderer.toneMappingExposure = 1.15;
        this.ambientLight.color.set(0xfff3e0);
        this.sunLight.color.set(0xffdfae);
        this.sunLight.intensity = 1.8;
        if (this.particleSystem) this.particleSystem.material.color.set(0xffe8ba);
        break;

      case 'noon': // Crisp Mediterranean Daylight
        this.renderer.toneMappingExposure = 1.05;
        this.ambientLight.color.set(0xf0f7ff);
        this.sunLight.color.set(0xffffff);
        this.sunLight.intensity = 2.1;
        if (this.particleSystem) this.particleSystem.material.color.set(0xeaf4ff);
        break;

      case 'sunset': // Dramatic Crimson Twilight
        this.renderer.toneMappingExposure = 1.25;
        this.ambientLight.color.set(0xffa175);
        this.sunLight.color.set(0xff6a3d);
        this.sunLight.intensity = 1.9;
        if (this.particleSystem) this.particleSystem.material.color.set(0xffad7a);
        break;

      case 'night': // Monumental Starry Night
        this.renderer.toneMappingExposure = 0.85;
        this.ambientLight.color.set(0x354d68);
        this.sunLight.color.set(0x6b9cd1);
        this.sunLight.intensity = 0.7;
        if (this.particleSystem) this.particleSystem.material.color.set(0x8cb6e8);
        break;
    }
  }

  /* ========================================================================
     INTERACTIVE 3D SCREEN-SPACE PINS (Matching Design Mockup)
     ======================================================================== */
  createScreenPins() {
    const pinContainer = document.getElementById('map-pins-layer');
    if (!pinContainer) return;
    pinContainer.innerHTML = '';

    Object.values(this.landmarks).forEach(landmark => {
      if (!landmark.pinPos) return;

      const pin = document.createElement('div');
      pin.className = 'map-pin interactive';
      pin.dataset.id = landmark.id;

      // Icon matching mockup: Castle, House, Water
      let icon = '📍';
      if (landmark.id === 'castillo') icon = '🏰';
      else if (landmark.id === 'poble') icon = '🏠';
      else if (landmark.id === 'ebro' || landmark.id === 'segre') icon = '〰️';

      pin.innerHTML = `
        <span class="pin-icon">${icon}</span>
        <span class="pin-title">${landmark.title}</span>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateToLandmark(landmark.id);
      });

      pinContainer.appendChild(pin);
      this.pinElements.set(landmark.id, {
        element: pin,
        worldPos: landmark.pinPos
      });
    });
  }

  updateScreenPins() {
    if (this.currentMode === 'street') {
      // In street mode, pins are hidden
      this.pinElements.forEach(({ element }) => {
        element.style.display = 'none';
      });
      return;
    }

    const tempV = new THREE.Vector3();
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const widthHalf = w / 2;
    const heightHalf = h / 2;

    this.pinElements.forEach(({ element, worldPos }, id) => {
      tempV.copy(worldPos);
      tempV.project(this.camera);

      // In front of camera check
      if (tempV.z < -1.0 || tempV.z > 1.0) {
        element.style.display = 'none';
        return;
      }

      const x = (tempV.x * widthHalf) + widthHalf;
      const y = -(tempV.y * heightHalf) + heightHalf;

      // Screen boundary check
      if (x < 10 || x > w - 10 || y < 10 || y > h - 10) {
        element.style.display = 'none';
        return;
      }

      element.style.display = 'flex';
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.classList.toggle('active', id === this.activeLandmarkId);
    });
  }

  /* ========================================================================
     NAVIGATION & SMOOTH TRANSITIONS
     ======================================================================== */
  navigateToLandmark(id) {
    const lm = this.landmarks[id];
    if (!lm) return;

    this.activeLandmarkId = id;
    this.controls.autoRotate = false;

    // If we were in street mode and user clicks another landmark, return to aerial
    if (this.currentMode === 'street' && id !== 'poble') {
      this.exitStreetMode();
    }

    // Smoothly rotate camera to target yaw & pitch
    if (lm.targetYaw !== undefined && lm.targetPitch !== undefined) {
      const targetDir = new THREE.Vector3(
        Math.sin(lm.targetYaw) * Math.cos(lm.targetPitch),
        Math.sin(lm.targetPitch),
        -Math.cos(lm.targetYaw) * Math.cos(lm.targetPitch)
      ).normalize();

      this.controls.target.copy(targetDir);
      if (lm.targetFov) {
        this.camera.fov = lm.targetFov;
        this.camera.updateProjectionMatrix();
      }
    }

    // Dispatch event to synchronize Right Drawer UI
    window.dispatchEvent(new CustomEvent('landmarkSelected', { detail: lm }));
  }

  /* ========================================================================
     STREET-LEVEL MODE (Recreación fotorrealista calles Poble Vell)
     ======================================================================== */
  enterStreetMode() {
    this.currentMode = 'street';
    this.controls.autoRotate = false;
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    // Switch to street panorama
    this.switchPanorama('street');

    // Aim forward looking down the cobblestone alley towards the castle
    this.controls.target.set(0, 0.05, -1);
    this.controls.update();

    const badge = document.getElementById('street-view-badge');
    if (badge) badge.style.display = 'flex';

    const btnWalk = document.getElementById('btn-toggle-walk');
    if (btnWalk) btnWalk.classList.add('active');
  }

  exitStreetMode() {
    this.currentMode = 'aerial';
    this.camera.fov = 46;
    this.camera.updateProjectionMatrix();

    // Switch back to aerial digital twin
    this.switchPanorama('aerial');

    const badge = document.getElementById('street-view-badge');
    if (badge) badge.style.display = 'none';

    const btnWalk = document.getElementById('btn-toggle-walk');
    if (btnWalk) btnWalk.classList.remove('active');

    this.navigateToLandmark('overview');
  }

  toggleStreetMode() {
    if (this.currentMode === 'street') {
      this.exitStreetMode();
    } else {
      this.enterStreetMode();
    }
  }

  /* ========================================================================
     COMPASS SYNCHRONIZATION
     ======================================================================== */
  updateCompass() {
    const dial = document.getElementById('compass-dial');
    if (!dial) return;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const angleDeg = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
    dial.style.transform = `rotate(${angleDeg}deg)`;
  }

  /* ========================================================================
     EVENT BINDINGS
     ======================================================================== */
  bindEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  /* ========================================================================
     ANIMATION LOOP
     ======================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();

    // Floating sunbeam particles drift
    if (this.particleSystem) {
      const pos = this.particleSystem.geometry.attributes.position;
      for (let i = 1; i < pos.count * 3; i += 3) {
        pos.array[i] += Math.sin(elapsed + i) * 0.015;
      }
      pos.needsUpdate = true;
    }

    // Birds circling in the sky
    if (this.birds) {
      this.birds.forEach(b => {
        b.userData.angle += b.userData.speed * delta;
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * b.userData.radius - 20;
        b.position.y = b.userData.height + Math.sin(elapsed * 2 + b.userData.phase) * 1.2;
        b.rotation.y = -b.userData.angle + Math.PI / 2;
      });
    }

    this.updateCompass();
    this.updateScreenPins();

    this.renderer.render(this.scene, this.camera);
  }
}
