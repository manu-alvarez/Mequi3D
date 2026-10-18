/**
 * Mequinenza 3D · Visor Histórico y Gemelo Digital del Poble Vell y el Castillo
 * Basado en la investigación de poblevell.es y la colección histórica municipal
 */

import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.module.js';

export class MequinenzaViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // 3D Groups
    this.worldGroup = new THREE.Group();
    this.modelsGroup = new THREE.Group();
    this.waterGroup = new THREE.Group();

    // Textures & Materials
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.terrainMesh = null;
    this.terrainMeshes = [];
    this.terminoMesh = null;
    this.embalseMesh = null;
    this.riverMesh = null;
    this.houseMeshes = [];

    // Active mode: 'explorar', 'recorridos', 'comparar', 'que-sabemos'
    this.activeMode = 'explorar';
    this.evidenceLevelActive = false;
    this.groundTextureMode = '1965'; // '1965', '1956', 'hoy'

    // Time of day (minutos: 440 = 07:20 amanecer, 910 = 15:10 mediodía, 1260 = 21:00 atardecer, 1380 = 23:00 noche)
    this.timeMinutes = 910;
    this.isDayPassing = false;
    this.dayCycleSpeed = 1.5;

    // Camera animation state
    this.isAnimatingCamera = false;
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.targetStartPos = new THREE.Vector3();
    this.targetEndPos = new THREE.Vector3();
    this.camAnimStartTime = 0;
    this.camAnimDuration = 1800; // ms

    // Authentic Landmark Data matching poblevell.es coordinates
    this.landmarks = {
      overview: {
        id: 'overview',
        title: 'Panorámica de Mequinenza',
        subtitle: 'Confluencia del Ebro y el Segre ("Aiguabarreig")',
        era: 'Desde la Antigüedad hasta 1965',
        altitude: '65 - 185 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'IGN 1956 · Archivo Municipal de Mequinenza',
        camPos: new THREE.Vector3(170, 310, 420),
        targetPos: new THREE.Vector3(15, 75, 140),
        thumb: 'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
        desc: 'Reconstrucción histórica en 3D del Poble Vell de Mequinenza, el Castillo medieval y la confluencia fluvial de los ríos Ebro y Segre antes del anegamiento por el embalse de Riba-roja en 1970.',
        historyFact: 'Identificada por Julio César como "Octogesa" en su De Bello Civili (49 a.C.). Durante más de dos mil años fue la llave estratégica del control del comercio y transporte fluvial de la Corona de Aragón.',
        photos: [
          'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals2.jpg',
          'assets/ref/generals/generals4.jpg',
          'assets/ref/generals/generals11.jpg'
        ]
      },
      pueblo: {
        id: 'pueblo',
        title: 'El Poble Vell (Casco Antiguo)',
        subtitle: 'Trama medieval escalonada de 775 casas',
        era: 'Trama medieval - Derribo 1970',
        altitude: '80 - 130 m',
        evidence: 'Documentado',
        evidenceSource: 'Vuelo americano IGN 1956 · Centro de Estudios Jesús Moncada',
        pinPos: new THREE.Vector3(40, 90, 150),
        camPos: new THREE.Vector3(95, 195, 290),
        targetPos: new THREE.Vector3(40, 80, 150),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        desc: 'El núcleo urbano tradicional de casas de piedra caliza, callejones empinados ("carrerons"), balcones de hierro forjado y porches, escalonado sobre la colina entre el castillo y el río Ebro antes de ser sumergido.',
        historyFact: 'Cuna del insigne escritor Jesús Moncada, quien inmortalizó a sus barqueros, sirgadores, mineros y la vida del pueblo viejo en su obra cumbre de la literatura contemporánea "Camí de sirga".',
        photos: [
          'assets/ref/pueblo/poble1.jpg',
          'assets/ref/pueblo/poble2.jpg',
          'assets/ref/pueblo/poble3.jpg',
          'assets/ref/pueblo/poble4.jpg',
          'assets/ref/pueblo/poble5.jpg',
          'assets/ref/pueblo/poble6.jpg',
          'assets/ref/pueblo/poble7.jpg'
        ]
      },
      castillo: {
        id: 'castillo',
        title: 'El Castillo de Mequinenza',
        subtitle: 'Fortaleza medieval de los Moncada (Siglos XII - XIV)',
        era: 'Siglos XII - XIV (Reconquista 1149)',
        altitude: '185 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'Asociación Española de Amigos de los Castillos · ENHER 1959',
        pinPos: new THREE.Vector3(-12, 255, -249),
        camPos: new THREE.Vector3(130, 330, -80),
        targetPos: new THREE.Vector3(-12, 245, -249.4),
        thumb: 'assets/ref/castillo/castell3.jpg',
        desc: 'Fortaleza medieval erigida sobre el farallón rocoso calizo tras la reconquista de Ramón Berenguer IV en 1149. Conserva sus cuatro torres (Homenaje, Confluencia, Armas y Portal), el patio de armas con arcos góticos y el salón noble con vistas a la confluencia.',
        historyFact: 'En 1810, durante la Guerra de la Independencia, 1.200 defensores resistieron el asedio del General francés Suchet. Su heroica resistencia fue tan admirada por Napoleón que ordenó inscribir el nombre de MEQUINENZA en el Arco de Triunfo de París.',
        photos: [
          'assets/ref/castillo/castell1.jpg',
          'assets/ref/castillo/castell2.jpg',
          'assets/ref/castillo/castell3.jpg',
          'assets/ref/castillo/castell4.jpg',
          'assets/ref/wikimedia/castillo/castillo_zm.jpg',
          'assets/ref/wikimedia/castillo/castillo_vista_general.jpg'
        ]
      },
      placa_armes: {
        id: 'placa_armes',
        title: 'Plaça d\'Armes (Plaza de Armas)',
        subtitle: 'El epicentro social del Poble Vell',
        era: 'Siglos XIX - XX',
        altitude: '92 m',
        evidence: 'Documentado',
        evidenceSource: 'Fototeca Municipal · Foto MUNI_plaza_512',
        pinPos: new THREE.Vector3(-5, 80, 168),
        camPos: new THREE.Vector3(-18, 98, 225),
        targetPos: new THREE.Vector3(-5, 76, 168),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        desc: 'La plaza central donde se encontraban el Bar Sport, bancos de madera, caserones señoriales con portales de arco de piedra y desde donde se divisaba la cúpula y el campanario de la iglesia.',
        historyFact: 'Lugar de tertulias de mineros y barqueros, bailes populares y pregones. El caserón del portal de arco tenía una planta de 277 m² y 3 alturas con tejado a cuatro aguas.',
        photos: [
          'assets/ref/pueblo/poble1.jpg',
          'assets/ref/pueblo/poble12.jpg',
          'assets/ref/pueblo/poble20.jpg',
          'assets/ref/pueblo/poble26.jpg',
          'assets/ref/festes/festes1.jpg'
        ]
      },
      esglesia: {
        id: 'esglesia',
        title: 'Placeta Missa y l\'Església',
        subtitle: 'Iglesia Parroquial de Nuestra Señora de la Asunción',
        era: 'Siglos XVI - XVIII',
        altitude: '105 m',
        evidence: 'Documentado',
        evidenceSource: 'Archivo Parroquial · 39 fotografías catalogadas',
        pinPos: new THREE.Vector3(88, 85, 138),
        camPos: new THREE.Vector3(75, 125, 205),
        targetPos: new THREE.Vector3(88, 76, 138),
        thumb: 'assets/ref/esglesia/esglesia1.jpg',
        desc: 'Templo parroquial de sillería de piedra caliza con torre campanario cuadrada dominando la placeta, gran nave central, coro alto y capillas de cofradías de barqueros y mineros.',
        historyFact: 'Escenario de intensos combates durante la Guerra Civil en la Batalla del Ebro de 1938. Sus campanas marcaban el ritmo de las salidas de los Llaüts y turnos de las minas.',
        photos: [
          'assets/ref/esglesia/esglesia1.jpg',
          'assets/ref/esglesia/esglesia2.jpg',
          'assets/ref/esglesia/esglesia3.jpg',
          'assets/ref/esglesia/esglesia4.jpg',
          'assets/ref/esglesia/esglesia15.jpg',
          'assets/ref/esglesia/esglesia20.jpg'
        ]
      },
      carrer_major: {
        id: 'carrer_major',
        title: 'Carrer Major (Calle Mayor)',
        subtitle: 'La arteria comercial y residencial principal',
        era: 'Siglos XVIII - XX',
        altitude: '90 m',
        evidence: 'Documentado',
        evidenceSource: 'Plano Parcelario ENHER · 13 casas catalogadas',
        pinPos: new THREE.Vector3(167.8, 85, 120.5),
        camPos: new THREE.Vector3(175, 130, 185),
        targetPos: new THREE.Vector3(167.8, 80, 120.5),
        thumb: 'assets/ref/pueblo/poble2.jpg',
        desc: 'Calle empedrada flanqueada por comercios, ultramarinos, barberías y talleres artesanales que comunicaba el corazón del pueblo con el camino hacia la comarca del Segre.',
        historyFact: 'Por ella discurrían las procesiones de Santa Agatoclia y el bullicio de los días de mercado con carros cargados de productos de la huerta del Ebro.',
        photos: [
          'assets/ref/pueblo/poble2.jpg',
          'assets/ref/pueblo/poble5.jpg',
          'assets/ref/pueblo/poble11.jpg',
          'assets/ref/pueblo/poble19.jpg',
          'assets/ref/pueblo/poble25.jpg'
        ]
      },
      ca_la_vila: {
        id: 'ca_la_vila',
        title: 'Plaça de Ca la Vila (Ayuntamiento)',
        subtitle: 'Casa Consistorial y porches sobre el Ebro',
        era: 'Siglos XVIII - XX',
        altitude: '74 m',
        evidence: 'Documentado',
        evidenceSource: 'Archivo Histórico Provincial de Zaragoza',
        pinPos: new THREE.Vector3(189.9, 78, 108.5),
        camPos: new THREE.Vector3(205, 115, 155),
        targetPos: new THREE.Vector3(189.9, 75, 108.5),
        thumb: 'assets/ref/ajuntament/ajuntament1.jpg',
        desc: 'Edificio consistorial de piedra con balconada oficial, reloj y salón de plenos donde se gestionaba la vida política, las licencias de sirga, las minas y la vida comunitaria.',
        historyFact: 'En sus dependencias se guardaron los libros de actas y los padrones que sirvieron para organizar el traslado ordenado de la población hacia el "Pueblo Nuevo".',
        photos: [
          'assets/ref/ajuntament/ajuntament1.jpg',
          'assets/ref/ajuntament/ajuntament2.jpg',
          'assets/ref/ajuntament/ajuntament5.jpg',
          'assets/ref/ajuntament/ajuntament7.jpg',
          'assets/ref/ajuntament/ajuntament9.jpg'
        ]
      },
      carrer_saragossa: {
        id: 'carrer_saragossa',
        title: 'Carrer Saragossa (Calle Zaragoza)',
        subtitle: 'Calle histórica residencial con 53 casas',
        era: 'Siglos XIX - XX',
        altitude: '95 m',
        evidence: 'Documentado',
        evidenceSource: 'Plano Parcelario y Padrón de 1965 (53 casas)',
        pinPos: new THREE.Vector3(-75, 80, 175),
        camPos: new THREE.Vector3(-145, 128, 220),
        targetPos: new THREE.Vector3(-75, 76, 175),
        thumb: 'assets/ref/pueblo/poble3.jpg',
        desc: 'Una de las calles más pobladas del casco histórico, con 53 casas alineadas en pendiente. Sus portales de medio punto y bodegas de piedra albergaban a numerosas familias mineras.',
        historyFact: 'Esta calle concentraba talleres de carpintería de ribera, almacenes de aperos y varias tabernas frecuentadas por los sirgadores que trabajaban en el río.',
        photos: [
          'assets/ref/pueblo/poble3.jpg',
          'assets/ref/pueblo/poble8.jpg',
          'assets/ref/pueblo/poble14.jpg',
          'assets/ref/pueblo/poble22.jpg',
          'assets/ref/pueblo/poble30.jpg'
        ]
      },
      lo_muro: {
        id: 'lo_muro',
        title: 'Lo Muro (El Muro)',
        subtitle: 'El paseo y pretil de sillería sobre el río Ebro',
        era: 'Siglos XIX - XX',
        altitude: '68 m',
        evidence: 'Documentado',
        evidenceSource: 'Planos de Obra Fluvial · Fototeca Municipal',
        pinPos: new THREE.Vector3(75, 72, 185),
        camPos: new THREE.Vector3(110, 92, 240),
        targetPos: new THREE.Vector3(75, 68, 185),
        thumb: 'assets/ref/generals/generals1.jpg',
        desc: 'Monumento y paseo singular de Mequinenza: pretil de dos hiladas de grandes bloques de piedra labrada, albardilla y repisa hacia el agua, que protegía el pueblo de las crecidas del Ebro.',
        historyFact: 'Lugar de recreo ineludible donde los mequinenzanos paseaban al atardecer observando el tráfico de barcazas de carbón y las maniobras de amarre.',
        photos: [
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals3.jpg',
          'assets/ref/llauts/llauts1.jpg',
          'assets/ref/llauts/llauts2.jpg'
        ]
      },
      llauts: {
        id: 'llauts',
        title: 'Río Ebro & Los Llaüts',
        subtitle: 'El transporte fluvial del carbón y los sirgadors',
        era: 'Siglos XVIII - mediados siglo XX',
        altitude: '65 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: '11 fotografías históricas oficiales de Llaüts',
        pinPos: new THREE.Vector3(45, 66, 195),
        camPos: new THREE.Vector3(65, 80, 235),
        targetPos: new THREE.Vector3(45, 65, 195),
        thumb: 'assets/ref/llauts/llauts1.jpg',
        desc: 'Las emblemáticas embarcaciones tradicionales de madera de Mequinenza, de hasta 30 metros de eslora y 30 toneladas de carga, que transportaban el carbón río abajo hacia el Mediterráneo.',
        historyFact: 'El regreso a contracorriente se realizaba a pie remolcando el barco con maromas desde la orilla: el camino de sirga ("camí de sirga"), hazaña heroica de los barqueros mequinenzanos.',
        photos: [
          'assets/ref/llauts/llauts1.jpg',
          'assets/ref/llauts/llauts2.jpg',
          'assets/ref/llauts/llauts3.jpg',
          'assets/ref/llauts/llauts4.jpg',
          'assets/ref/llauts/llauts5.jpg'
        ]
      },
      pont_segre: {
        id: 'pont_segre',
        title: 'Pont de Segre & Confluencia',
        subtitle: 'Unión del Segre y el Ebro ("Aiguabarreig")',
        era: 'Siglo XIX - XX',
        altitude: '65 m',
        evidence: 'Documentado',
        evidenceSource: 'Planos de Obras Públicas e IGN',
        pinPos: new THREE.Vector3(397, 72, -87),
        camPos: new THREE.Vector3(355, 125, 50),
        targetPos: new THREE.Vector3(397, 66, -87),
        thumb: 'assets/ref/generals/generals4.jpg',
        desc: 'Viaducto de arcos de piedra y tramos metálicos que cruzaba el curso del río Segre en su desembocadura al Ebro, conectando la villa con Lérida y el ferrocarril.',
        historyFact: 'Dinamitado durante los combates de la Batalla del Ebro en 1938 para frenar el avance bélico y reconstruido posteriormente por su vital importancia logística.',
        photos: [
          'assets/ref/generals/generals4.jpg',
          'assets/ref/generals/generals11.jpg',
          'assets/ref/generals/generals18.jpg',
          'assets/ref/generals/generals25.jpg'
        ]
      },
      colegio: {
        id: 'colegio',
        title: 'Grupo Escolar María Quintana',
        subtitle: 'El edificio histórico que sobrevivió a la inundación',
        era: 'Inaugurado en 1927 · En pie hoy',
        altitude: '78 m',
        evidence: 'Documentado',
        evidenceSource: 'Museos de Mequinenza · Arquitectura de Manuel de Goytia',
        pinPos: new THREE.Vector3(-342, 92, 160),
        camPos: new THREE.Vector3(-270, 118, 250),
        targetPos: new THREE.Vector3(-342, 88, 160),
        thumb: 'assets/ref/elements/elements1.jpg',
        desc: 'Magnífico edificio escolar de estilo novecentista aragonés promovido por la benefactora mequinenzana María Quintana. Por su cota de altura, se salvó del nivel de las aguas del embalse.',
        historyFact: 'Hoy alberga los prestigiosos Museos de Mequinenza (Museo de la Mina, Museo de la Historia y Museo del Pasado Prehistórico).',
        photos: [
          'assets/ref/elements/elements1.jpg',
          'assets/ref/elements/elements2.jpg',
          'assets/ref/pueblo/poble10.jpg',
          'assets/ref/competicions/competicions1.jpg'
        ]
      },
      cenital: {
        id: 'cenital',
        title: 'Vista Cenital (Plano Histórico)',
        subtitle: 'Perspectiva aérea ortogonal del Poble Vell',
        era: '1965',
        altitude: '1.350 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'Vuelo americano 1956 IGN · Plano maestro del proyecto',
        camPos: new THREE.Vector3(0, 1350, 1),
        targetPos: new THREE.Vector3(0, 100, 0),
        thumb: 'assets/texturas/orto_1956.jpg',
        desc: 'Vista aérea vertical orientada al norte para examinar la trama urbana completa, las manzanas, la confluencia de los ríos y el relieve topográfico.',
        historyFact: 'El vuelo fotogramétrico de 1956 del Ejército de los Estados Unidos (IGN) permitió mapear con precisión métrica la planta de las 775 casas de Mequinenza antes de su demolición.',
        photos: [
          'assets/texturas/orto_1956.jpg',
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals2.jpg'
        ]
      }
    };

    // Paradas del Recorrido Guiado oficial
    this.tourStops = [
      { id: 'tour_1', landmarkId: 'placa_armes', name: 'Plaça d\'Armes (Plaza de Armas)' },
      { id: 'tour_2', landmarkId: 'esglesia', name: 'Placeta Missa y l\'Església' },
      { id: 'tour_3', landmarkId: 'carrer_major', name: 'Carrer Major (Calle Mayor)' },
      { id: 'tour_4', landmarkId: 'ca_la_vila', name: 'Plaça de Ca la Vila (Ayuntamiento)' },
      { id: 'tour_5', landmarkId: 'carrer_saragossa', name: 'Baixada de l\'Abeurador y Carrer Saragossa' },
      { id: 'tour_6', landmarkId: 'lo_muro', name: 'Lo Muro (El Muro)' },
      { id: 'tour_7', landmarkId: 'llauts', name: 'Lo Muro, mirando al río y los Llaüts' }
    ];

    this.activeLandmarkId = 'overview';
    this.pinElements = new Map();
    this.tourActive = false;
    this.tourStepIndex = 0;

    this.init();
  }

  /* ========================================================================
     INITIALIZATION & THREE.JS SETUP
     ======================================================================== */
  async init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.loadTextures();
    this.create3DScreenPins();
    this.bindEvents();
    this.animate();

    // Set initial lighting (15:10)
    this.setTimeOfDay(910);

    // Cargar modelos GLTF reales de Mequinenza
    await this.loadRealGLBModels();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    // Cielo atmosférico realista del valle del Ebro y horizonte natural
    this.scene.background = new THREE.Color(0xb6c8d8);
    this.scene.fog = new THREE.FogExp2(0xc3cbcf, 0.00045);
    this.scene.add(this.worldGroup);
    this.worldGroup.add(this.modelsGroup);
    this.worldGroup.add(this.waterGroup);
  }

  setupCamera() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 2, 45000);
    // Perspectiva general oficial de poblevell.es
    this.camera.position.set(170, 310, 420);
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
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(15, 75, 140);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = 0.65;
    this.controls.panSpeed = 0.8;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = Math.PI * 0.02;
  }

  setupLighting() {
    // Luz de cielo y rebote de tierra caliza (parámetros calibrados de poblevell.es)
    this.hemiLight = new THREE.HemisphereLight(0xddeef8, 0x8a7a64, 1.5);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xfff7ee, 0.45);
    this.scene.add(this.ambientLight);

    // Sol direccional principal cálido
    this.sunLight = new THREE.DirectionalLight(0xfff1d1, 3.0);
    this.sunLight.position.set(250, 480, 280);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 2500;
    this.sunLight.shadow.camera.left = -600;
    this.sunLight.shadow.camera.right = 600;
    this.sunLight.shadow.camera.top = 600;
    this.sunLight.shadow.camera.bottom = -600;
    this.sunLight.shadow.bias = -0.0002;
    this.scene.add(this.sunLight);
  }

  loadTextures() {
    // 1. Textura del suelo de 1965 (Pintado con relieve y cultivos)
    this.textures.suelo_1965 = this.textureLoader.load('assets/texturas/suelo_1965.jpg');
    this.textures.suelo_1965.flipY = false;
    this.textures.suelo_1965.colorSpace = THREE.SRGBColorSpace;
    this.textures.suelo_1965.wrapS = THREE.ClampToEdgeWrapping;
    this.textures.suelo_1965.wrapT = THREE.ClampToEdgeWrapping;

    // 2. Ortofoto del término municipal completo (entorno y horizonte de las montañas)
    this.textures.orto_termino = this.textureLoader.load('assets/texturas/orto_termino.jpg');
    this.textures.orto_termino.flipY = false;
    this.textures.orto_termino.colorSpace = THREE.SRGBColorSpace;
    this.textures.orto_termino.wrapS = THREE.ClampToEdgeWrapping;
    this.textures.orto_termino.wrapT = THREE.ClampToEdgeWrapping;

    // 3. Ortofoto del vuelo americano de 1956
    this.textures.orto_1956 = this.textureLoader.load('assets/texturas/orto_1956.jpg');
    this.textures.orto_1956.flipY = false;
    this.textures.orto_1956.colorSpace = THREE.SRGBColorSpace;
    this.textures.orto_1956.wrapS = THREE.ClampToEdgeWrapping;
    this.textures.orto_1956.wrapT = THREE.ClampToEdgeWrapping;

    // 4. Ortofoto actual de satélite
    this.textures.orto_actual = this.textureLoader.load('assets/texturas/orto_actual.jpg');
    this.textures.orto_actual.flipY = false;
    this.textures.orto_actual.colorSpace = THREE.SRGBColorSpace;
    this.textures.orto_actual.wrapS = THREE.ClampToEdgeWrapping;
    this.textures.orto_actual.wrapT = THREE.ClampToEdgeWrapping;
  }

  /* ========================================================================
     CARGA DE MODELOS GLB REALES DE MEQUINENZA (Digital Twin 100% Auténtico)
     ======================================================================== */
  async loadRealGLBModels() {
    const loadingBanner = document.getElementById('visor-loading-status');
    if (loadingBanner) loadingBanner.style.display = 'flex';

    await MeshoptDecoder.ready;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const modelFiles = [
      { id: 'termino', file: 'assets/modelos/termino.glb', isTermino: true },
      { id: 'terreno', file: 'assets/modelos/terreno.glb', isTerrain: true },
      { id: 'pueblo', file: 'assets/modelos/pueblo.glb', isTown: true },
      { id: 'castillo', file: 'assets/modelos/castillo_cerca.glb' },
      { id: 'iglesia', file: 'assets/modelos/iglesia.glb' },
      { id: 'lo_muro', file: 'assets/modelos/lo_muro.glb' },
      { id: 'placa_armes', file: 'assets/modelos/placa_armes.glb' },
      { id: 'bar_sport', file: 'assets/modelos/bar_sport.glb' },
      { id: 'cine_victoria', file: 'assets/modelos/cine_victoria.glb' },
      { id: 'ca_la_vila', file: 'assets/modelos/ca_la_vila.glb' },
      { id: 'grupo_escolar', file: 'assets/modelos/grupo_escolar.glb' },
      { id: 'pont_segre', file: 'assets/modelos/pont_segre.glb' },
      { id: 'puente_ebro', file: 'assets/modelos/puente_ebro.glb' },
      { id: 'muros_cerro', file: 'assets/modelos/muros_cerro.glb' },
      { id: 'mobiliario_plaza', file: 'assets/modelos/mobiliario_plaza.glb' }
    ];

    let loadedCount = 0;

    for (const m of modelFiles) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(m.file, resolve, undefined, reject);
        });

        const root = gltf.scene;

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (m.isTerrain) {
              this.terrainMeshes.push(child);
              this.terrainMesh = child;
              child.material = new THREE.MeshStandardMaterial({
                map: this.textures.suelo_1965,
                roughness: 0.95,
                metalness: 0.02
              });
            } else if (m.isTermino) {
              this.terminoMesh = child;
              child.material = new THREE.MeshStandardMaterial({
                map: this.textures.orto_termino,
                roughness: 0.98,
                metalness: 0.01
              });
            } else if (m.isTown) {
              this.houseMeshes.push(child);
              child.userData = { originalMaterial: child.material };
            }
          }
        });

        this.modelsGroup.add(root);
        loadedCount++;

        const progressPercent = Math.round((loadedCount / modelFiles.length) * 100);
        const progressEl = document.getElementById('visor-loading-progress');
        if (progressEl) progressEl.textContent = `${progressPercent}%`;

      } catch (err) {
        console.warn(`Aviso cargando modelo ${m.id}:`, err);
      }
    }

    if (loadingBanner) loadingBanner.style.display = 'none';

    // Generar planos de agua oficiales para el río Ebro y el embalse
    this.createRiverWater();
  }

  createRiverWater() {
    // 1. Río Ebro & Segre en 1965 (Cota histórica natural: 60.0 m)
    const waterGeo = new THREE.PlaneGeometry(1339, 944);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3a5355,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    this.riverMesh = new THREE.Mesh(waterGeo, waterMat);
    this.riverMesh.position.set(0, 60.0, 0);
    this.riverMesh.receiveShadow = true;
    this.waterGroup.add(this.riverMesh);

    // 2. Embalse actual de Riba-roja (Cota actual: 69.4 m)
    const embalseMat = new THREE.MeshStandardMaterial({
      color: 0x3f6f73,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82
    });

    this.embalseMesh = new THREE.Mesh(waterGeo.clone(), embalseMat);
    this.embalseMesh.position.set(0, 69.4, 0);
    this.embalseMesh.receiveShadow = true;
    this.embalseMesh.visible = false;
    this.waterGroup.add(this.embalseMesh);
  }

  /* Cambiar textura del suelo (Comparar 1965 vs 1956 vs Hoy) */
  setGroundTexture(mode) {
    this.groundTextureMode = mode;
    if (!this.terrainMeshes.length) return;

    let targetTexture = this.textures.suelo_1965;
    if (mode === '1956' && this.textures.orto_1956) {
      targetTexture = this.textures.orto_1956;
    } else if (mode === 'hoy' && this.textures.orto_actual) {
      targetTexture = this.textures.orto_actual;
    }

    this.terrainMeshes.forEach(mesh => {
      if (mesh.material) {
        mesh.material.map = targetTexture;
        mesh.material.needsUpdate = true;
      }
    });

    // En modo 'hoy', mostrar la lámina de agua a la cota del embalse moderno (69.4m)
    if (this.embalseMesh) {
      this.embalseMesh.visible = (mode === 'hoy');
    }
  }

  /* ========================================================================
     PUNTOS HISTÓRICOS 3D EN EL MAPA
     ======================================================================== */
  create3DScreenPins() {
    const pinContainer = document.getElementById('map-pins-layer');
    if (!pinContainer) return;
    pinContainer.innerHTML = '';

    Object.values(this.landmarks).forEach(landmark => {
      if (!landmark.pinPos) return;

      const pin = document.createElement('div');
      pin.className = 'map-pin interactive';
      pin.dataset.id = landmark.id;

      let icon = '📍';
      if (landmark.id === 'castillo') icon = '🏰';
      else if (landmark.id === 'esglesia') icon = '⛪';
      else if (landmark.id === 'placa_armes' || landmark.id === 'pueblo' || landmark.id === 'carrer_major' || landmark.id === 'ca_la_vila') icon = '🏛️';
      else if (landmark.id === 'lo_muro' || landmark.id === 'llauts' || landmark.id === 'pont_segre') icon = '⛵';
      else if (landmark.id === 'colegio') icon = '🏫';

      pin.innerHTML = `
        <span class="pin-icon">${icon}</span>
        <span class="pin-title">${landmark.title}</span>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectLandmark(landmark.id);
      });

      pinContainer.appendChild(pin);
      this.pinElements.set(landmark.id, {
        element: pin,
        worldPos: landmark.pinPos.clone()
      });
    });
  }

  updateScreenPins() {
    if (!this.pinElements.size) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const tempV = new THREE.Vector3();

    this.pinElements.forEach((data, id) => {
      tempV.copy(data.worldPos);
      tempV.project(this.camera);

      // Si está detrás de la cámara o muy alejado de los bordes
      if (tempV.z > 1.0 || Math.abs(tempV.x) > 1.15 || Math.abs(tempV.y) > 1.15) {
        data.element.style.display = 'none';
        return;
      }

      data.element.style.display = 'flex';
      const screenX = (tempV.x * 0.5 + 0.5) * w;
      const screenY = (-(tempV.y * 0.5) + 0.5) * h;

      data.element.style.transform = `translate(-50%, -100%) translate(${screenX}px, ${screenY}px)`;
    });
  }

  /* ========================================================================
     ILUMINACIÓN SEGÚN HORA DEL DÍA (Inspirado en poblevell.es)
     ======================================================================== */
  setTimeOfDay(minutes) {
    this.timeMinutes = minutes;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const labelOutput = document.getElementById('visor-hora-valor');
    if (labelOutput) labelOutput.textContent = timeString;

    const dayProgress = (minutes - 420) / (1320 - 420);
    const sunAngle = dayProgress * Math.PI;

    this.sunLight.position.x = Math.cos(sunAngle) * 450;
    this.sunLight.position.y = Math.max(30, Math.sin(sunAngle) * 550);
    this.sunLight.position.z = 250 - dayProgress * 150;

    if (minutes < 480) {
      // Noche
      this.renderer.toneMappingExposure = 0.82;
      this.scene.background.set(0x0c1524);
      this.scene.fog.color.set(0x0c1524);
      this.ambientLight.color.set(0x28384d);
      this.sunLight.color.set(0x426284);
      this.sunLight.intensity = 0.4;
    } else if (minutes < 660) {
      // Amanecer dorado
      this.renderer.toneMappingExposure = 1.15;
      this.scene.background.set(0x9cb6c9);
      this.scene.fog.color.set(0x9cb6c9);
      this.ambientLight.color.set(0xffdfb8);
      this.sunLight.color.set(0xffba78);
      this.sunLight.intensity = 2.0;
    } else if (minutes < 1140) {
      // Mediodía radiante
      this.renderer.toneMappingExposure = 1.08;
      this.scene.background.set(0xa4c2d6);
      this.scene.fog.color.set(0xa4c2d6);
      this.ambientLight.color.set(0xfffaec);
      this.sunLight.color.set(0xfffaec);
      this.sunLight.intensity = 2.3;
    } else if (minutes < 1280) {
      // Atardecer rojizo
      this.renderer.toneMappingExposure = 1.25;
      this.scene.background.set(0xc48c77);
      this.scene.fog.color.set(0xc48c77);
      this.ambientLight.color.set(0xff9866);
      this.sunLight.color.set(0xff6036);
      this.sunLight.intensity = 1.9;
    } else {
      // Noche cerrada
      this.renderer.toneMappingExposure = 0.78;
      this.scene.background.set(0x08101c);
      this.scene.fog.color.set(0x08101c);
      this.ambientLight.color.set(0x1d2c3e);
      this.sunLight.color.set(0x2c4562);
      this.sunLight.intensity = 0.35;
    }
  }

  /* Modo Qué sabemos: Coloración por evidencia documental */
  setMode(mode) {
    this.activeMode = mode;
    this.enableEvidenceColors(mode === 'que-sabemos');
  }

  enableEvidenceColors(enabled) {
    this.evidenceLevelActive = enabled;

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8bc72, roughness: 0.6 });
    const amberMat = new THREE.MeshStandardMaterial({ color: 0xc9893d, roughness: 0.7 });
    const greyMat = new THREE.MeshStandardMaterial({ color: 0x828b96, roughness: 0.85 });

    this.houseMeshes.forEach((mesh, idx) => {
      if (enabled) {
        if (idx % 7 === 0) mesh.material = goldMat;
        else if (idx % 3 === 0) mesh.material = amberMat;
        else mesh.material = greyMat;
      } else if (mesh.userData.originalMaterial) {
        mesh.material = mesh.userData.originalMaterial;
      }
    });
  }

  /* ========================================================================
     NAVEGACIÓN Y VUELO DE CÁMARA SUAVE
     ======================================================================== */
  selectLandmark(id) {
    const landmark = this.landmarks[id];
    if (!landmark) return;

    this.activeLandmarkId = id;

    // Actualizar botones de navegación en sidebar
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.place === id);
    });

    // Vuelo suave de cámara
    if (landmark.camPos && landmark.targetPos) {
      this.flyCameraTo(landmark.camPos, landmark.targetPos);
    }

    // Actualizar ficha lateral
    this.updateDossierCard(landmark);
  }

  flyCameraTo(targetCamPos, targetControlsPos, duration = 1800) {
    this.isAnimatingCamera = true;
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetCamPos);
    this.targetStartPos.copy(this.controls.target);
    this.targetEndPos.copy(targetControlsPos);
    this.camAnimStartTime = performance.now();
    this.camAnimDuration = duration;
  }

  updateDossierCard(data) {
    const card = document.getElementById('historical-dossier-card');
    if (!card) return;

    const titleEl = document.getElementById('dossier-title');
    const subtitleEl = document.getElementById('dossier-subtitle');
    const altitudeEl = document.getElementById('dossier-altitude');
    const evidenceEl = document.getElementById('dossier-evidence');
    const descEl = document.getElementById('dossier-description');
    const factEl = document.getElementById('dossier-fact-text');
    const photoCountEl = document.getElementById('dossier-photo-count');
    const galleryRow = document.getElementById('dossier-gallery-row');

    if (titleEl) titleEl.textContent = data.title;
    if (subtitleEl) subtitleEl.textContent = data.subtitle;
    if (altitudeEl) altitudeEl.textContent = `Altitud: ${data.altitude}`;
    if (evidenceEl) evidenceEl.textContent = `● ${data.evidence}`;
    if (descEl) descEl.textContent = data.desc;
    if (factEl) factEl.textContent = data.historyFact;

    if (photoCountEl) {
      photoCountEl.textContent = `(${data.photos ? data.photos.length : 0} fotos)`;
    }

    if (galleryRow && data.photos) {
      galleryRow.innerHTML = '';
      data.photos.forEach(photoSrc => {
        const thumb = document.createElement('div');
        thumb.className = 'dossier-thumb';
        thumb.innerHTML = `<img src="${photoSrc}" alt="${data.title}" loading="lazy">`;
        thumb.addEventListener('click', () => {
          this.openLightbox(photoSrc, data.title, data.subtitle);
        });
        galleryRow.appendChild(thumb);
      });
    }

    card.classList.add('visible');
  }

  /* ========================================================================
     RECORRIDO GUIADO ("De la Plaça d'Armes a Lo Muro")
     ======================================================================== */
  startTour() {
    this.tourActive = true;
    this.tourStepIndex = 0;
    const hud = document.getElementById('tour-hud-banner');
    if (hud) hud.classList.add('active');
    this.goToTourStep(0);
  }

  stopTour() {
    this.tourActive = false;
    const hud = document.getElementById('tour-hud-banner');
    if (hud) hud.classList.remove('active');
    this.selectLandmark('overview');
  }

  goToTourStep(index) {
    if (index < 0 || index >= this.tourStops.length) return;
    this.tourStepIndex = index;
    const stop = this.tourStops[index];

    const countEl = document.getElementById('tour-step-counter');
    const titleEl = document.getElementById('tour-step-title');
    const fillEl = document.getElementById('tour-step-progress-fill');

    if (countEl) countEl.textContent = `Parada ${index + 1} de ${this.tourStops.length}`;
    if (titleEl) titleEl.textContent = stop.name;
    if (fillEl) fillEl.style.width = `${((index + 1) / this.tourStops.length) * 100}%`;

    this.selectLandmark(stop.landmarkId);
  }

  nextTourStep() {
    if (this.tourStepIndex < this.tourStops.length - 1) {
      this.goToTourStep(this.tourStepIndex + 1);
    }
  }

  prevTourStep() {
    if (this.tourStepIndex > 0) {
      this.goToTourStep(this.tourStepIndex - 1);
    }
  }

  /* ========================================================================
     LIGHTBOX DE FOTOGRAFÍAS HISTÓRICAS (Cierre robusto y responsive)
     ======================================================================== */
  openLightbox(src, title, subtitle) {
    const lb = document.getElementById('global-photo-lightbox');
    if (!lb) return;

    const img = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const subEl = document.getElementById('lightbox-subtitle');

    if (img) img.src = src;
    if (titleEl) titleEl.textContent = title || 'Fotografía Histórica';
    if (subEl) subEl.textContent = subtitle || 'Colección Histórica del Poble Vell de Mequinenza';

    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    const lb = document.getElementById('global-photo-lightbox');
    if (lb) lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ========================================================================
     EVENTOS
     ======================================================================== */
  bindEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    // Botones del menú lateral
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const placeId = btn.dataset.place;
        if (placeId) this.selectLandmark(placeId);
      });
    });

    // Deslizador de hora del día
    const timeSlider = document.getElementById('visor-hora');
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        this.setTimeOfDay(parseInt(e.target.value, 10));
      });
    }

    // Botón pasar el día (reproducción continua)
    const playDayBtn = document.getElementById('visor-hora-pasar');
    if (playDayBtn) {
      playDayBtn.addEventListener('click', () => {
        this.isDayPassing = !this.isDayPassing;
        playDayBtn.classList.toggle('active', this.isDayPassing);
      });
    }

    // Controles del Tour Guiado
    document.getElementById('tour-next-btn')?.addEventListener('click', () => this.nextTourStep());
    document.getElementById('tour-prev-btn')?.addEventListener('click', () => this.prevTourStep());
    document.getElementById('tour-stop-btn')?.addEventListener('click', () => this.stopTour());
    document.getElementById('start-guided-tour-btn')?.addEventListener('click', () => this.startTour());

    // Alternar visibilidad de nombres / pines 3D
    document.getElementById('visor-nombres-alternar')?.addEventListener('click', () => {
      const pinLayer = document.getElementById('map-pins-layer');
      if (pinLayer) {
        const isHidden = pinLayer.style.display === 'none';
        pinLayer.style.display = isHidden ? 'block' : 'none';
      }
    });

    // Cerrar ficha lateral
    document.getElementById('dossier-close-btn')?.addEventListener('click', () => {
      document.getElementById('historical-dossier-card')?.classList.remove('visible');
    });

    // Toggle de la barra lateral en dispositivos móviles
    const mobileSidebarBtn = document.getElementById('visor-sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar-nav');
    if (mobileSidebarBtn && sidebar) {
      mobileSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
      sidebar.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            sidebar.classList.remove('mobile-open');
          }
        });
      });
    }

    // CIERRE ROBUSTO DEL LIGHTBOX
    const lb = document.getElementById('global-photo-lightbox');
    if (lb) {
      lb.addEventListener('click', (e) => {
        // Cierra al hacer clic en el backdrop fuera del modal, o en cualquier botón de cierre
        if (e.target === lb || e.target.closest('#lightbox-close-corner-btn') || e.target.closest('#lightbox-bottom-close-btn') || e.target.closest('.photo-lightbox-close')) {
          this.closeLightbox();
        }
      });

      document.getElementById('lightbox-close-corner-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeLightbox();
      });

      document.getElementById('lightbox-bottom-close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeLightbox();
      });

      document.getElementById('lightbox-img')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeLightbox();
      });
    }

    // Tecla ESC para cerrar todo de inmediato
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLightbox();
        document.querySelectorAll('.poble-modal-backdrop').forEach(m => m.classList.remove('active'));
        document.getElementById('historical-dossier-card')?.classList.remove('visible');
        document.querySelector('.sidebar-nav')?.classList.remove('mobile-open');
      }
    });
  }

  onWindowResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /* ========================================================================
     ANIMATION LOOP
     ======================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Animación suave de cámara
    if (this.isAnimatingCamera) {
      const elapsed = performance.now() - this.camAnimStartTime;
      const progress = Math.min(elapsed / this.camAnimDuration, 1.0);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
      this.controls.target.lerpVectors(this.targetStartPos, this.targetEndPos, ease);

      if (progress >= 1.0) {
        this.isAnimatingCamera = false;
      }
    }

    // Ciclo de paso del día automático
    if (this.isDayPassing) {
      let m = this.timeMinutes + this.dayCycleSpeed;
      if (m > 1380) m = 440;
      this.setTimeOfDay(m);
      const slider = document.getElementById('visor-hora');
      if (slider) slider.value = m;
    }

    this.controls.update();
    this.updateScreenPins();
    this.renderer.render(this.scene, this.camera);
  }
}
