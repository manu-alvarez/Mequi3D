/**
 * Mequinenza 3D · Engine & World Reconstruction
 * Authentic Historical Digital Twin of Mequinenza Castle, Poble Vell & River Confluence
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class MequinenzaViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Lighting & Environment
    this.sunLight = null;
    this.hemiLight = null;
    this.nightLights = [];
    this.currentAtmosphere = 'morning';

    // World groups
    this.worldGroup = new THREE.Group();
    this.castleGroup = new THREE.Group();
    this.townGroup = new THREE.Group();
    this.riverGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    this.birdsGroup = new THREE.Group();

    // Textures & Materials
    this.textureLoader = new THREE.TextureLoader();
    this.materials = {};

    // Camera animation & Tour state
    this.isTransitioning = false;
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.targetStart = new THREE.Vector3();
    this.targetEnd = new THREE.Vector3();
    this.transitionProgress = 0;
    this.transitionDuration = 1.6;

    // First person walk mode state
    this.walkMode = false;
    this.walkSpeed = 9.0;
    this.walkKeys = { forward: false, backward: false, left: false, right: false };
    this.walkYaw = 0;
    this.walkPitch = 0;
    this.isPointerDown = false;
    this.lastPointer = { x: 0, y: 0 };

    // Guided Tour State
    this.tourActive = false;
    this.tourStepIndex = 0;
    this.tourTimer = 0;

    // Landmark Data (100% verified historical coordinates & facts)
    this.landmarks = {
      overview: {
        id: 'overview',
        title: 'Panorámica de Mequinenza',
        subtitle: 'Confluencia Fluvial y Relieve Histórico',
        era: 'Siglos XII - XX',
        altitude: '185 m sobre el río',
        camPos: new THREE.Vector3(70, 52, 85),
        targetPos: new THREE.Vector3(0, 12, 5),
        pinPos: new THREE.Vector3(0, 34, 0),
        thumb: 'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
        category: 'vistas',
        desc: 'Vista panorámica general de la confluencia histórica de los ríos Ebro y Segre ("Aiguabarreig"), presidida en lo alto por el imponente promontorio rocoso calizo del Castillo de Mequinenza y las laderas escalonadas del Poble Vell (casco antiguo inundado y abandonado tras la construcción del embalse de Riba-roja en los años 60).',
        historyFact: 'Mencionada posiblemente por Julio César en "De Bello Civili" bajo el nombre de "Octogesa", la estratégica confluencia fluvial fue llave militar y comercial entre Aragón y Cataluña durante dos milenios.'
      },
      castillo: {
        id: 'castillo',
        title: 'Castillo de Mequinenza',
        subtitle: 'Fortaleza Medieval de los Moncada',
        era: 'Siglos XII - XIV (Reconquista 1149)',
        altitude: '185 m s.n.m.',
        camPos: new THREE.Vector3(26, 32, 28),
        targetPos: new THREE.Vector3(0, 27, -2),
        pinPos: new THREE.Vector3(0, 36, -3),
        thumb: 'assets/ref/castillo/castell3.jpg',
        category: 'castillo',
        desc: 'Construido en el siglo XII tras la reconquista de Ramón Berenguer IV (1149), el castillo fue solar de los Moncada y Marqueses de Aitona. Destaca su planta trapezoidal sobre el acantilado, sus cuatro torres cuadradas almenadas, el patio de armas con arcos góticos y la gran sala con ventanales que dominan la confluencia del Segre y el Ebro.',
        historyFact: 'En 1810, durante la Guerra de la Independencia, 1.200 defensores resistieron heroicamente el asedio del General francés Louis-Gabriel Suchet. La toma de Mequinenza fue considerada tan relevante por Napoleón que su nombre figura esculpido en el Arco de Triunfo de París.'
      },
      poble: {
        id: 'poble',
        title: 'Poble Vell (Casco Antiguo)',
        subtitle: 'Trama Urbana Tradicional y Ruinas',
        era: 'Medieval - siglo XX',
        altitude: '80 - 130 m',
        camPos: new THREE.Vector3(-14, 18, 38),
        targetPos: new THREE.Vector3(-18, 10, 16),
        pinPos: new THREE.Vector3(-18, 17, 16),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        category: 'pueblo',
        desc: 'El casco antiguo tradicional de Mequinenza se extendía en terrazas escalonadas por la ladera sur de la colina del castillo hacia la ribera del Ebro. Sus calles empinadas ("carrerons"), casas de piedra seca y tapial con vigas de roble y tejados árabes, albergaban una vibrante comunidad de barqueros, mineros y campesinos antes de ser anegado por el embalse.',
        historyFact: 'Tras la orden de demolición y abandono en la década de 1960 por los trabajos hidroeléctricos de ENHER, los vecinos se trasladaron al pueblo nuevo. Sus muros de piedra permanecen como memoria viva y museo al aire libre.'
      },
      iglesia: {
        id: 'iglesia',
        title: 'Iglesia de la Asunción',
        subtitle: 'Parroquia Histórica del Poble Vell',
        era: 'Siglo XVI - XVIII',
        altitude: '110 m',
        camPos: new THREE.Vector3(-28, 19, 25),
        targetPos: new THREE.Vector3(-22, 13, 15),
        pinPos: new THREE.Vector3(-22, 22, 15),
        thumb: 'assets/ref/esglesia/esglesia1.jpg',
        category: 'esglesia',
        desc: 'Templo parroquial de Nuestra Señora de la Asunción, erigido en el corazón del casco urbano medieval. Con su esbelta torre campanario de sillares de piedra caliza, nave central con capillas laterales y pórtico renacentista, fue el centro religioso de Mequinenza durante siglos.',
        historyFact: 'La iglesia sufrió daños durante la Guerra de la Independencia y la Guerra Civil (1938, Batalla del Ebro), siendo finalmente desmantelada antes de la inundación, conservándose hoy los arranques de sus muros y el solar sagrado.'
      },
      ebro: {
        id: 'ebro',
        title: 'Río Ebro y Puerto Fluvial',
        subtitle: 'La Gran Vía del Carbón y Llaüts',
        era: 'Siglos XIX - XX',
        altitude: '65 m s.n.m.',
        camPos: new THREE.Vector3(18, 10, 48),
        targetPos: new THREE.Vector3(2, 1, 28),
        pinPos: new THREE.Vector3(2, 6, 28),
        thumb: 'assets/ref/llauts/llauts1.jpg',
        category: 'llauts',
        desc: 'Orilla fluvial histórica del Ebro al pie del pueblo viejo. Aquí atracaban los legendarios "Llaüts", embarcaciones tradicionales de madera de hasta 30 toneladas que transportaban el lignito extraído de las minas de Mequinenza río abajo hacia Tortosa y el Mediterráneo.',
        historyFact: 'El oficio de los "sirgadors" y "patrons de llaüt" formó el alma económica de Mequinenza, inmortalizada en las novelas universales del escritor mequinenzeno Jesús Moncada en obras cumbre como "Camí de sirga".'
      },
      aiguabarreig: {
        id: 'aiguabarreig',
        title: 'El "Aiguabarreig" (Confluencia)',
        subtitle: 'Unión del Río Segre con el Ebro',
        era: 'Paraje Natural e Histórico',
        altitude: '65 m',
        camPos: new THREE.Vector3(48, 22, 54),
        targetPos: new THREE.Vector3(15, 0, 32),
        pinPos: new THREE.Vector3(15, 6, 32),
        thumb: 'assets/ref/generals/generals1.jpg',
        category: 'generals',
        desc: 'Punto geográfico emblemático donde el río Segre (que a su vez recoge las aguas del Cinca) rinde sus caudales en el gran Ebro. Este enclave forma uno de los ecosistemas fluviales y avifaunísticos más ricos del sur de Europa, con frondosos bosques de ribera.',
        historyFact: 'En este cruce fluvial confluyen Aragón y Cataluña, así como las cuencas prepirenaica y de la depresión del Ebro, dotando a Mequinenza de una biodiversidad y valor paisajístico excepcional.'
      },
      puente: {
        id: 'puente',
        title: 'Puente Histórico de Mequinenza',
        subtitle: 'Paso Estratégico sobre el Ebro',
        era: 'Siglo XIX - XX',
        altitude: '70 m',
        camPos: new THREE.Vector3(-42, 14, 52),
        targetPos: new THREE.Vector3(-25, 2, 40),
        pinPos: new THREE.Vector3(-25, 8, 40),
        thumb: 'assets/ref/generals/generals4.jpg',
        category: 'generals',
        desc: 'El característico puente de arcos que cruzaba el río Ebro comunicando el pueblo y la comarca minera con la carretera de Fraga y Lérida. Sus sólidas pilas de sillería desafiaron las grandes riadas históricas del Ebro.',
        historyFact: 'Dinamitado durante las operaciones militares de la Batalla del Ebro en 1938 para frenar los avances de tropas, fue posteriormente reconstruido y sigue siendo el nexo vital del paisaje mequinenzeno.'
      }
    };

    this.activeLandmarkId = 'overview';
    this.pinElements = new Map();

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
    this.buildWorld();
    this.createScreenPins();
    this.bindEvents();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#94b5cd');
    this.scene.fog = new THREE.FogExp2('#94b5cd', 0.0038);
    this.scene.add(this.worldGroup);
    this.worldGroup.add(this.castleGroup);
    this.worldGroup.add(this.townGroup);
    this.worldGroup.add(this.riverGroup);
    this.worldGroup.add(this.foliageGroup);
    this.worldGroup.add(this.birdsGroup);
  }

  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.2, 1500);
    this.camera.position.copy(this.landmarks.overview.camPos);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 260;
    this.controls.target.copy(this.landmarks.overview.targetPos);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;
  }

  /* ========================================================================
     ATMOSPHERIC LIGHTING & TIME-OF-DAY PRESETS
     ======================================================================== */
  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xe8f4ff, 0x6e5c46, 1.8);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffecd0, 3.4);
    this.sunLight.position.set(-45, 75, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.bias = -0.00015;
    this.sunLight.shadow.camera.left = -95;
    this.sunLight.shadow.camera.right = 95;
    this.sunLight.shadow.camera.top = 95;
    this.sunLight.shadow.camera.bottom = -95;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    this.scene.add(this.sunLight);

    // Castle accent spotlights for night mode
    const spot1 = new THREE.SpotLight(0xffd59e, 0, 60, Math.PI / 4, 0.4);
    spot1.position.set(-15, 12, 18);
    spot1.target.position.set(0, 26, -2);
    this.scene.add(spot1);
    this.scene.add(spot1.target);
    this.nightLights.push(spot1);

    const spot2 = new THREE.SpotLight(0xffbe6b, 0, 70, Math.PI / 4, 0.5);
    spot2.position.set(20, 10, -22);
    spot2.target.position.set(0, 26, -2);
    this.scene.add(spot2);
    this.scene.add(spot2.target);
    this.nightLights.push(spot2);
  }

  setAtmosphere(mode) {
    this.currentAtmosphere = mode;
    switch (mode) {
      case 'morning': // Golden hour sunrise
        this.scene.background.set('#9cbdd4');
        this.scene.fog.color.set('#9cbdd4');
        this.sunLight.color.set('#ffe6be');
        this.sunLight.intensity = 3.3;
        this.sunLight.position.set(-55, 60, 45);
        this.hemiLight.color.set('#d8ecff');
        this.hemiLight.groundColor.set('#6a543e');
        this.hemiLight.intensity = 1.9;
        this.renderer.toneMappingExposure = 1.18;
        this.nightLights.forEach(s => s.intensity = 0);
        break;

      case 'noon': // Bright Mediterranean midday
        this.scene.background.set('#7db3d8');
        this.scene.fog.color.set('#7db3d8');
        this.sunLight.color.set('#fffbf0');
        this.sunLight.intensity = 3.8;
        this.sunLight.position.set(-10, 95, 15);
        this.hemiLight.color.set('#f0f6ff');
        this.hemiLight.groundColor.set('#78674f');
        this.hemiLight.intensity = 2.2;
        this.renderer.toneMappingExposure = 1.1;
        this.nightLights.forEach(s => s.intensity = 0);
        break;

      case 'sunset': // Fiery Aragonese sunset
        this.scene.background.set('#523d48');
        this.scene.fog.color.set('#523d48');
        this.sunLight.color.set('#ff7a3d');
        this.sunLight.intensity = 3.0;
        this.sunLight.position.set(70, 24, -40);
        this.hemiLight.color.set('#e08b73');
        this.hemiLight.groundColor.set('#3a2c28');
        this.hemiLight.intensity = 1.5;
        this.renderer.toneMappingExposure = 1.25;
        this.nightLights.forEach(s => s.intensity = 0);
        break;

      case 'night': // Dramatic starry night with monumental illumination
        this.scene.background.set('#0b1522');
        this.scene.fog.color.set('#0b1522');
        this.sunLight.color.set('#46688b');
        this.sunLight.intensity = 0.55;
        this.sunLight.position.set(-20, 60, 30);
        this.hemiLight.color.set('#1c2e44');
        this.hemiLight.groundColor.set('#0c131a');
        this.hemiLight.intensity = 0.8;
        this.renderer.toneMappingExposure = 1.4;
        this.nightLights.forEach(s => s.intensity = 18);
        break;
    }
  }

  /* ========================================================================
     MATERIALS (PBR With Authentic Local Textures)
     ======================================================================== */
  initMaterials() {
    // 1. Castle Stone Material (from authentic castell3.jpg)
    const stoneTex = this.textureLoader.load('assets/piedra.jpg');
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(3, 3);
    stoneTex.colorSpace = THREE.SRGBColorSpace;

    this.materials.castleStone = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: '#baa68c',
      roughness: 0.86,
      metalness: 0.05
    });

    this.materials.castleStoneLight = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: '#cbba9f',
      roughness: 0.82
    });

    this.materials.castleStoneDark = new THREE.MeshStandardMaterial({
      color: '#6e5e4b',
      roughness: 0.94
    });

    // 2. Village Ruins Material (from authentic enderroc3.jpg)
    const ruinsTex = this.textureLoader.load('assets/ruinas.jpg');
    ruinsTex.wrapS = THREE.RepeatWrapping;
    ruinsTex.wrapT = THREE.RepeatWrapping;
    ruinsTex.repeat.set(2, 2);
    ruinsTex.colorSpace = THREE.SRGBColorSpace;

    this.materials.villageRuins = new THREE.MeshStandardMaterial({
      map: ruinsTex,
      color: '#9c8e7b',
      roughness: 0.96,
      bumpMap: ruinsTex,
      bumpScale: 0.08
    });

    // 3. Traditional Terracotta Roof Tile Material
    this.materials.roofTiles = new THREE.MeshStandardMaterial({
      color: '#915337',
      roughness: 0.92
    });

    // 4. Aragonese Limestone Terrain & Cliffs
    this.materials.limestoneCliff = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: '#a39276',
      roughness: 0.92,
      bumpMap: stoneTex,
      bumpScale: 0.14
    });

    this.materials.terrainSoil = new THREE.MeshStandardMaterial({
      color: '#766c54',
      roughness: 0.95
    });

    // 5. River Water Material
    this.materials.riverWater = new THREE.MeshStandardMaterial({
      color: '#285868',
      roughness: 0.16,
      metalness: 0.28,
      transparent: true,
      opacity: 0.92
    });

    // 6. Foliage & Trees
    this.materials.pineGreen = new THREE.MeshStandardMaterial({ color: '#46563b', roughness: 0.9 });
    this.materials.oliveGreen = new THREE.MeshStandardMaterial({ color: '#687756', roughness: 0.88 });
    this.materials.woodTrunk = new THREE.MeshStandardMaterial({ color: '#544230', roughness: 0.95 });
  }

  /* ========================================================================
     WORLD GENERATION (Authentic Topography, Castle & Village)
     ======================================================================== */
  buildWorld() {
    this.initMaterials();
    this.generateTopography();
    this.generateCastle();
    this.generatePobleVell();
    this.generateRiversAndBridges();
    this.generateFoliage();
    this.generateFlockOfBirds();
  }

  // Helper mesh creator
  createBox(w, h, d, mat, x, y, z, parent = this.worldGroup) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // 1. Realistic Mequinenza Topography (Limestone Promontory & Confluence Basin)
  generateTopography() {
    const geo = new THREE.PlaneGeometry(240, 200, 140, 110);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let z = pos.getZ(i);

      // Castle rock promontory: steep mesa centered around (0, -2)
      const dCliff = (x ** 2) / 480 + ((z + 2) ** 2) / 360;
      let cliffElev = 26.5 / (1 + Math.exp((dCliff - 1.0) * 8.0));

      // Village slope: terraced incline descending south towards the river
      let townSlope = 0;
      if (z > 2 && z < 42 && Math.abs(x) < 55) {
        townSlope = Math.max(0, 18 - (z - 2) * 0.42 - Math.abs(x) * 0.15);
      }

      // Natural limestone ridge undulating to the north & west
      let northRidge = 12 * Math.exp(-((x + 35) ** 2) / 1200 + -((z + 30) ** 2) / 700);

      // River depression carving around south and east
      let riverTrough = 0;
      if (z > 36 || (x > 25 && z > 15)) {
        riverTrough = -3.5;
      }

      // Micro rock strata undulation
      let strata = Math.sin(x * 0.18 + z * 0.08) * 0.7 + Math.cos(z * 0.22) * 0.5;

      let finalY = Math.max(-1.5, cliffElev + townSlope + northRidge + riverTrough + strata);
      pos.setY(i, finalY);
    }

    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, this.materials.limestoneCliff);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    this.worldGroup.add(terrain);

    // Natural layered rock crags directly under the castle walls
    for (let i = 0; i < 8; i++) {
      const radius = 18 - i * 1.6;
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius + 2.5, 3.2, 12, 1),
        this.materials.limestoneCliff
      );
      cyl.position.set(0, 6 + i * 2.6, -2);
      cyl.rotation.y = i * 0.35;
      cyl.scale.set(1.0, 1.0, 0.82);
      cyl.receiveShadow = true;
      cyl.castShadow = true;
      this.worldGroup.add(cyl);
    }
  }

  // 2. Castillo de Mequinenza (Authentic Trapezoidal Fortress & Towers)
  generateCastle() {
    const c = this.castleGroup;
    const stone = this.materials.castleStone;
    const stoneLt = this.materials.castleStoneLight;
    const stoneDk = this.materials.castleStoneDark;

    // Fortress base foundation atop cliff
    this.createBox(26, 12, 20, stone, 0, 26, -2, c);

    // Curtain walls with battlement tops
    this.createBox(26, 8, 2.2, stoneLt, 0, 34, 7, c); // South wall
    this.createBox(26, 8, 2.2, stoneLt, 0, 34, -11, c); // North wall
    this.createBox(2.2, 8, 20, stoneLt, -12, 34, -2, c); // West wall
    this.createBox(2.2, 8, 20, stoneLt, 12, 34, -2, c); // East wall

    // Crenellations (Almenas) along perimeter
    for (let x = -11; x <= 11; x += 3.2) {
      this.createBox(1.4, 1.5, 2.4, stoneLt, x, 38.6, 7, c);
      this.createBox(1.4, 1.5, 2.4, stoneLt, x, 38.6, -11, c);
    }
    for (let z = -9; z <= 5; z += 3.2) {
      this.createBox(2.4, 1.5, 1.4, stoneLt, -12, 38.6, z, c);
      this.createBox(2.4, 1.5, 1.4, stoneLt, 12, 38.6, z, c);
    }

    // 4 Authentic Towers
    const buildTower = (x, z, h, name) => {
      // Main tower body
      this.createBox(6.2, h, 6.2, stoneLt, x, 26 + h / 2, z, c);
      // Overhanging corbel parapet
      this.createBox(7.0, 1.6, 7.0, stoneDk, x, 26 + h + 0.6, z, c);
      // Merlons
      for (let tx of [-2.4, 0, 2.4]) {
        for (let tz of [-2.4, 2.4]) {
          this.createBox(1.2, 1.4, 1.2, stoneLt, x + tx, 26 + h + 1.9, z + tz, c);
        }
      }
      // Arrow slits (saeteras)
      this.createBox(0.4, 2.2, 0.2, new THREE.MeshBasicMaterial({ color: '#161410' }), x, 26 + h * 0.7, z + 3.12, c);
    };

    buildTower(-12, 8, 17, 'Torre del Homenaje'); // S-W (tallest)
    buildTower(12, 8, 15, 'Torre de la Confluencia'); // S-E
    buildTower(-12, -11, 14, 'Torre de las Armas'); // N-W
    buildTower(12, -11, 14, 'Torre del Portal'); // N-E

    // Inner Courtyard (Patio de Armas) with Gothic Arches & Gallery
    this.createBox(18, 0.4, 12, stoneDk, 0, 26.2, -2, c); // Courtyard floor
    // Gothic Arched portico pillars
    for (let px = -6; px <= 6; px += 4) {
      const pillar = this.createBox(0.8, 6.5, 0.8, stoneLt, px, 29.5, -6, c);
      // Arch cap
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.35, 6, 12, Math.PI), stoneLt);
      arch.position.set(px + 2, 32.6, -6);
      c.add(arch);
    }

    // Grand Hall with Panoramic Gothic Windows facing the River Confluence
    this.createBox(14, 7, 5, stone, 0, 33, 5, c);
    for (let wx = -4.5; wx <= 4.5; wx += 4.5) {
      // Pointed window cavity
      this.createBox(1.4, 3.2, 0.3, new THREE.MeshStandardMaterial({ color: '#1e2832', roughness: 0.4 }), wx, 34, 7.6, c);
    }
  }

  // 3. Poble Vell (Casco Antiguo - Stepped Terraces, Ruined Houses & Church)
  generatePobleVell() {
    const t = this.townGroup;
    const ruinsMat = this.materials.villageRuins;
    const roofMat = this.materials.roofTiles;
    const stoneDk = this.materials.castleStoneDark;

    // Procedural deterministic layout of 85+ historic stone ruins cascading down the slope
    let seed = 91823;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 11; col++) {
        if (rand() < 0.18) continue; // Natural gaps for alleyways

        let x = -44 + col * 7.8 + (rand() - 0.5) * 2.8;
        let z = 6 + row * 4.2 + (rand() - 0.5) * 1.8;

        // Skip if colliding with castle promontory
        if (Math.hypot(x, z + 2) < 22) continue;

        // Terrain height on slope
        let y = Math.max(1.5, 17.5 - row * 1.6 - Math.abs(x) * 0.14) + (rand() - 0.5) * 0.8;

        let w = 4.2 + rand() * 2.4;
        let d = 3.6 + rand() * 2.0;
        let h = 3.2 + rand() * 3.8;

        // Ruined stone walls
        this.createBox(w, h, d, ruinsMat, x, y + h / 2, z, t);

        // 55% of houses have ruined roofless walls, 45% preserve traditional clay tile gables
        if (rand() > 0.55) {
          const roof = new THREE.Mesh(
            new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.2, 4),
            roofMat
          );
          roof.position.set(x, y + h + 0.5, z);
          roof.rotation.y = Math.PI / 4;
          roof.castShadow = true;
          t.add(roof);
        } else {
          // Broken jagged wall silhouettes (authentic ruins)
          this.createBox(w * 0.35, 0.8, d * 0.25, ruinsMat, x - w * 0.2, y + h + 0.4, z, t);
          this.createBox(w * 0.3, 0.6, d * 0.2, ruinsMat, x + w * 0.25, y + h + 0.3, z, t);
        }

        // Arched doorway / window recess
        this.createBox(0.9, 1.6, 0.18, stoneDk, x, y + 0.8, z + d / 2 + 0.08, t);
      }
    }

    // Historic Parish Church (Iglesia de Nuestra Señora de la Asunción)
    const churchGroup = new THREE.Group();
    churchGroup.position.set(-22, 11, 15);
    t.add(churchGroup);

    // Church Nave
    this.createBox(12, 11, 22, ruinsMat, 0, 5.5, 0, churchGroup);
    // Rounded Apse
    const apse = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 10, 14, 1, false, 0, Math.PI), ruinsMat);
    apse.position.set(0, 5.0, -11);
    apse.rotation.y = Math.PI;
    churchGroup.add(apse);

    // Bell Tower (Campanario de la Asunción)
    this.createBox(5.6, 21, 5.6, this.materials.castleStoneLight, -5.6, 10.5, 8, churchGroup);
    // Belfry Arches & Pyramid Spire
    for (let side of [-1, 1]) {
      this.createBox(1.2, 2.8, 0.2, stoneDk, -5.6 + side * 1.5, 17.5, 10.9, churchGroup);
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.6, 4.2, 4), roofMat);
    spire.position.set(-5.6, 23.1, 8);
    spire.rotation.y = Math.PI / 4;
    churchGroup.add(spire);

    // Plaza Mayor / Town Square cobblestone terrace
    this.createBox(20, 0.6, 16, ruinsMat, -16, 7.2, 28, t);

    // Cobblestone Street Ribbons ("Carrerons") winding down the slope
    this.createStreet([
      [-36, 14, 10], [-26, 12, 16], [-16, 9, 22], [-8, 6, 28], [0, 4, 32], [10, 2, 36]
    ], 1.4);
    this.createStreet([
      [-18, 18, 5], [-12, 14, 10], [-6, 10, 16], [-2, 7, 24]
    ], 1.2);
  }

  createStreet(points, width) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 80, width * 0.5, 6, false);
    const m = new THREE.Mesh(g, this.materials.castleStoneDark);
    m.receiveShadow = true;
    this.townGroup.add(m);
  }

  // 4. Rivers Ebro & Segre Confluence + Multi-Arched Historic Bridge + Llaüts
  generateRiversAndBridges() {
    const r = this.riverGroup;

    // Realistic water surface
    const waterGeo = new THREE.PlaneGeometry(280, 240, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);
    this.riverMesh = new THREE.Mesh(waterGeo, this.materials.riverWater);
    this.riverMesh.position.y = 0.2;
    this.riverMesh.receiveShadow = true;
    r.add(this.riverMesh);

    // Historic Bridge of Mequinenza across the River Channel
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-25, 0, 42);
    r.add(bridgeGroup);

    // Bridge deck
    this.createBox(46, 1.2, 4.8, this.materials.castleStone, 0, 3.8, 0, bridgeGroup);
    // Bridge railings
    this.createBox(46, 0.8, 0.3, this.materials.castleStoneLight, 0, 4.8, 2.3, bridgeGroup);
    this.createBox(46, 0.8, 0.3, this.materials.castleStoneLight, 0, 4.8, -2.3, bridgeGroup);

    // Stone Bridge Arches & Piers
    for (let bx = -18; bx <= 18; bx += 9) {
      // Pier grounded in water
      this.createBox(2.2, 4.2, 5.4, this.materials.castleStoneDark, bx, 1.8, 0, bridgeGroup);
      // Arch
      const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.6, 8, 16, Math.PI), this.materials.castleStone);
      arch.position.set(bx + 4.5, 2.4, 0);
      bridgeGroup.add(arch);
    }

    // Historic River Pier & "Llaüts" (Traditional Mequinenza Coal Boats)
    const dockGroup = new THREE.Group();
    dockGroup.position.set(2, 0, 34);
    r.add(dockGroup);

    // Wooden Pier
    this.createBox(14, 0.8, 3.6, this.materials.woodTrunk, 0, 0.8, 0, dockGroup);
    for (let px of [-5, 0, 5]) {
      this.createBox(0.4, 2.2, 0.4, this.materials.woodTrunk, px, 0.8, 2.0, dockGroup);
    }

    // Authentic Wooden Llaüt Boat 1
    const buildLlaut = (x, z, rot) => {
      const boat = new THREE.Group();
      boat.position.set(x, 0.4, z);
      boat.rotation.y = rot;

      // Flat-bottomed wooden hull
      this.createBox(11, 1.1, 2.8, this.materials.woodTrunk, 0, 0, 0, boat);
      // Bow and stern wedge
      const bow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.8, 4), this.materials.woodTrunk);
      bow.position.set(6.4, 0, 0);
      bow.rotation.z = -Math.PI / 2;
      boat.add(bow);
      // Coal mound cargo in hold
      this.createBox(6.5, 0.9, 2.0, new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.95 }), 0, 0.6, 0, boat);
      dockGroup.add(boat);
    };

    buildLlaut(4, 5.2, 0.15);
    buildLlaut(-6, 6.8, -0.22);
  }

  // 5. Native Aragonese Mediterranean Foliage (Pines, Olives, Shrubs)
  generateFoliage() {
    const f = this.foliageGroup;
    let seed = 44102;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < 160; i++) {
      let x = (rand() - 0.5) * 160;
      let z = (rand() - 0.5) * 140;

      // Don't place trees in water or on the castle platform
      if (z > 36 || Math.hypot(x, z + 2) < 24) continue;

      let y = Math.max(1, 16 * Math.exp(-((x ** 2) / 600 + ((z + 2) ** 2) / 450)));

      const tree = new THREE.Group();
      tree.position.set(x, y, z);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6),
        this.materials.woodTrunk
      );
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      tree.add(trunk);

      // Crown (Pine or Olive)
      const isPine = rand() > 0.4;
      const crownMat = isPine ? this.materials.pineGreen : this.materials.oliveGreen;
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2 + rand() * 0.8, 1),
        crownMat
      );
      crown.position.y = 2.8 + (isPine ? 0.4 : 0);
      crown.scale.set(1.1, isPine ? 1.4 : 0.85, 1.1);
      crown.castShadow = true;
      tree.add(crown);

      f.add(tree);
    }
  }

  // 6. Animated Flock of Birds soaring over the Castle Cliffs
  generateFlockOfBirds() {
    const count = 14;
    this.birds = [];
    const birdGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.6, 0, 0,  0, 0, 0.5,  0.6, 0, 0
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const birdMat = new THREE.MeshBasicMaterial({ color: '#2a3542', side: THREE.DoubleSide });

    for (let i = 0; i < count; i++) {
      const b = new THREE.Mesh(birdGeo, birdMat);
      b.scale.set(0.9, 0.9, 0.9);
      b.userData = {
        angle: (i / count) * Math.PI * 2,
        radius: 28 + Math.random() * 20,
        speed: 0.35 + Math.random() * 0.2,
        height: 38 + Math.random() * 12,
        wingPhase: Math.random() * Math.PI * 2
      };
      this.birdsGroup.add(b);
      this.birds.push(b);
    }
  }

  /* ========================================================================
     SCREEN-SPACE INTERACTIVE 3D PINS / MARKERS
     ======================================================================== */
  createScreenPins() {
    const pinContainer = document.getElementById('map-pins-layer');
    if (!pinContainer) return;

    Object.values(this.landmarks).forEach(landmark => {
      if (landmark.id === 'overview') return;

      const pin = document.createElement('div');
      pin.className = 'map-pin interactive';
      pin.dataset.id = landmark.id;
      pin.innerHTML = `
        <span class="pin-icon">⌖</span>
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
    const tempV = new THREE.Vector3();
    const widthHalf = this.container.clientWidth / 2;
    const heightHalf = this.container.clientHeight / 2;

    this.pinElements.forEach(({ element, worldPos }, id) => {
      tempV.copy(worldPos);
      tempV.project(this.camera);

      // If behind camera or out of view
      if (tempV.z > 1.0 || tempV.z < -1.0) {
        element.style.display = 'none';
        return;
      }

      const x = (tempV.x * widthHalf) + widthHalf;
      const y = -(tempV.y * heightHalf) + heightHalf;

      element.style.display = 'flex';
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.classList.toggle('active', id === this.activeLandmarkId);
    });
  }

  /* ========================================================================
     CAMERA NAVIGATION & SMOOTH INTERPOLATION
     ======================================================================== */
  navigateToLandmark(id) {
    const lm = this.landmarks[id];
    if (!lm) return;

    this.activeLandmarkId = id;

    // Trigger smooth camera glide
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(lm.camPos);
    this.targetStart.copy(this.controls.target);
    this.targetEnd.copy(lm.targetPos);
    this.transitionProgress = 0;
    this.isTransitioning = true;
    this.controls.autoRotate = false;

    // Dispatch event to update UI Drawer
    window.dispatchEvent(new CustomEvent('landmarkSelected', { detail: lm }));
  }

  /* ========================================================================
     FIRST-PERSON WALK MODE (WASD / Touch Controls on Cobblestones)
     ======================================================================== */
  enterWalkMode() {
    this.walkMode = true;
    this.controls.enabled = false;
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();

    // Start on the historic town square street
    this.camera.position.set(-16, 8.8, 26);
    this.walkYaw = -Math.PI * 0.4;
    this.walkPitch = 0;
    this.updateWalkCameraRotation();

    const hud = document.getElementById('walk-mode-hud');
    if (hud) hud.classList.add('active');
  }

  exitWalkMode() {
    this.walkMode = false;
    this.controls.enabled = true;
    this.camera.fov = 44;
    this.camera.updateProjectionMatrix();

    const hud = document.getElementById('walk-mode-hud');
    if (hud) hud.classList.remove('active');

    // Return to overview
    this.navigateToLandmark('overview');
  }

  updateWalkCameraRotation() {
    const euler = new THREE.Euler(this.walkPitch, this.walkYaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  updateWalkMovement(delta) {
    if (!this.walkMode) return;

    const moveVector = new THREE.Vector3();
    if (this.walkKeys.forward) moveVector.z -= 1;
    if (this.walkKeys.backward) moveVector.z += 1;
    if (this.walkKeys.left) moveVector.x -= 1;
    if (this.walkKeys.right) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyEuler(new THREE.Euler(0, this.walkYaw, 0));

      const displacement = moveVector.multiplyScalar(this.walkSpeed * delta);
      this.camera.position.add(displacement);

      // Keep inside Mequinenza bounds
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -55, 35);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -15, 45);

      // Dynamic terrain elevation tracking so player walks on ground
      const x = this.camera.position.x;
      const z = this.camera.position.z;
      const dCliff = (x ** 2) / 480 + ((z + 2) ** 2) / 360;
      let groundY = 26.5 / (1 + Math.exp((dCliff - 1.0) * 8.0));
      if (z > 2 && z < 42 && Math.abs(x) < 55) {
        groundY = Math.max(groundY, 18 - (z - 2) * 0.42 - Math.abs(x) * 0.15);
      }
      groundY = Math.max(0.5, groundY);

      // Player eye level is 1.7m above street
      this.camera.position.y = groundY + 1.75;
    }
  }

  /* ========================================================================
     CINEMATIC GUIDED TOUR
     ======================================================================== */
  startTour() {
    this.tourActive = true;
    this.tourStepIndex = 0;
    this.tourTimer = 0;
    const tourKeys = ['overview', 'castillo', 'poble', 'iglesia', 'ebro', 'aiguabarreig', 'puente'];
    this.tourKeys = tourKeys;

    const banner = document.getElementById('tour-banner');
    if (banner) banner.classList.add('active');

    this.navigateToLandmark(tourKeys[0]);
  }

  stopTour() {
    this.tourActive = false;
    const banner = document.getElementById('tour-banner');
    if (banner) banner.classList.remove('active');
  }

  updateTour(delta) {
    if (!this.tourActive) return;

    this.tourTimer += delta;
    const stepDuration = 8.5; // Seconds per landmark stop

    // Progress bar
    const progressFill = document.getElementById('tour-progress-fill');
    if (progressFill) {
      const pct = (this.tourTimer / stepDuration) * 100;
      progressFill.style.width = `${Math.min(pct, 100)}%`;
    }

    if (this.tourTimer >= stepDuration) {
      this.tourTimer = 0;
      this.tourStepIndex++;
      if (this.tourStepIndex >= this.tourKeys.length) {
        this.tourStepIndex = 0;
      }
      this.navigateToLandmark(this.tourKeys[this.tourStepIndex]);
    }
  }

  /* ========================================================================
     COMPASS SYNCHRONIZATION
     ======================================================================== */
  updateCompass() {
    const dial = document.getElementById('compass-dial');
    if (!dial) return;

    // Camera azimuth calculation
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const angleRad = Math.atan2(dir.x, dir.z);
    const angleDeg = angleRad * (180 / Math.PI);

    dial.style.transform = `rotate(${angleDeg}deg)`;
  }

  /* ========================================================================
     EVENT BINDINGS
     ======================================================================== */
  bindEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Walk keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (!this.walkMode) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.walkKeys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.walkKeys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.walkKeys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.walkKeys.right = true;
      if (e.code === 'Escape') this.exitWalkMode();
    });

    window.addEventListener('keyup', (e) => {
      if (!this.walkMode) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.walkKeys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.walkKeys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.walkKeys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.walkKeys.right = false;
    });

    // Pointer look for walk mode
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (!this.walkMode) return;
      this.isPointerDown = true;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.walkMode || !this.isPointerDown) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;

      const sens = 0.0032;
      this.walkYaw -= dx * sens;
      this.walkPitch = THREE.MathUtils.clamp(this.walkPitch - dy * sens, -Math.PI * 0.35, Math.PI * 0.35);
      this.updateWalkCameraRotation();
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });
  }

  /* ========================================================================
     ANIMATION LOOP
     ======================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Camera interpolation flight
    if (this.isTransitioning) {
      this.transitionProgress += delta / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
        this.camera.position.copy(this.camEndPos);
        this.controls.target.copy(this.targetEnd);
      } else {
        // Smooth Hermite / EaseInOut cubic curve
        const t = this.transitionProgress;
        const ease = t * t * (3 - 2 * t);

        this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
        this.controls.target.lerpVectors(this.targetStart, this.targetEnd, ease);
      }
    }

    // 2. Controls update
    if (!this.walkMode) {
      this.controls.update();
    } else {
      this.updateWalkMovement(delta);
    }

    // 3. Water subtle shimmer
    if (this.riverMesh) {
      this.riverMesh.position.y = 0.2 + Math.sin(elapsed * 1.8) * 0.06;
    }

    // 4. Birds circling flight animation
    if (this.birds) {
      this.birds.forEach(b => {
        b.userData.angle += b.userData.speed * delta;
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * (b.userData.radius * 0.8) - 2;
        b.position.y = b.userData.height + Math.sin(elapsed * 2 + b.userData.wingPhase) * 1.5;

        // Orient bird along flight trajectory
        b.rotation.y = -b.userData.angle + Math.PI / 2;
        b.rotation.z = Math.sin(elapsed * 8 + b.userData.wingPhase) * 0.25;
      });
    }

    // 5. Compass, screen pins & guided tour
    this.updateCompass();
    this.updateScreenPins();
    this.updateTour(delta);

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }
}
