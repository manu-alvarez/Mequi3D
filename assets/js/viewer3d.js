/**
 * Mequinenza 3D · Visor Histórico y Gemelo Digital del Poble Vell
 * Inspirado en la investigación de poblevell.es y la colección histórica municipal
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

    // Current visual panorama key
    this.activePanoKey = 'real_castillo_confluencia';

    // Landmark Data (Puntos históricos reales según fuentes de Mequinenza y poblevell.es)
    this.landmarks = {
      overview: {
        id: 'overview',
        title: 'Panorámica de Mequinenza',
        subtitle: 'Confluencia del Ebro y el Segre ("Aiguabarreig")',
        era: 'Desde la Antigüedad hasta 1965',
        altitude: '65 - 185 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'IGN 1956 · Archivo Municipal',
        panoKey: 'real_castillo_confluencia',
        targetYaw: 0.12,
        targetPitch: -0.05,
        targetFov: 48,
        thumb: 'assets/ref/wikimedia/castillo/mequinenza_desde_castillo.jpg',
        category: 'vistas',
        desc: 'Fotografía panorámica histórica tomada desde lo alto del Castillo de Mequinenza dominando la confluencia de los ríos Segre y Ebro, el viaducto histórico y la ladera donde se extendía el Poble Vell.',
        historyFact: 'Identificada por Julio César como "Octogesa" en su De Bello Civili. Durante más de dos mil años fue la llave estratégica del paso de barcas y control de los ríos entre Aragón y Cataluña.',
        photos: [
          'assets/ref/wikimedia/castillo/mequinenza_desde_castillo.jpg',
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals2.jpg',
          'assets/ref/generals/generals4.jpg',
          'assets/ref/generals/generals11.jpg'
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
        panoKey: 'castillo_fachada',
        targetYaw: 0.04,
        targetPitch: 0.18,
        targetFov: 32,
        pinPos: new THREE.Vector3(4, 22, -97),
        thumb: 'assets/ref/castillo/castell3.jpg',
        category: 'castillo',
        desc: 'Fortaleza medieval erigida sobre el farallón rocoso calizo tras la reconquista de Ramón Berenguer IV en 1149. Conserva sus cuatro torres (Homenaje, Confluencia, Armas y Portal), el patio de armas con arcos góticos y el salón con vistas a la confluencia.',
        historyFact: 'En 1810, durante la Guerra de la Independencia, 1.200 defensores resistieron el asedio del General francés Suchet. Su resistencia fue tan admirada por Napoleón que hizo grabar el nombre de Mequinenza en el Arco de Triunfo de París.',
        photos: [
          'assets/ref/castillo/castell1.jpg',
          'assets/ref/castillo/castell2.jpg',
          'assets/ref/castillo/castell3.jpg',
          'assets/ref/castillo/castell4.jpg',
          'assets/ref/wikimedia/castillo/castillo_zm.jpg',
          'assets/ref/wikimedia/castillo/castillo_vista_general.jpg'
        ]
      },
      pueblo: {
        id: 'pueblo',
        title: 'Poble Vell (Casco Antiguo)',
        subtitle: 'El pueblo que fue desalojado por el embalse de Riba-roja',
        era: 'Trama medieval - Derribo 1970',
        altitude: '80 - 130 m',
        evidence: 'Documentado',
        evidenceSource: 'Vuelo americano IGN 1956 · Centro de Estudios Jesús Moncada',
        panoKey: 'poble_calle',
        targetYaw: -0.32,
        targetPitch: -0.08,
        targetFov: 36,
        pinPos: new THREE.Vector3(-32, -6, -94),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        category: 'pueblo',
        desc: 'El núcleo urbano tradicional de casas de piedra caliza, callejones empinados ("carrerons"), balcones de hierro forjado y porches, escalonado sobre la colina entre el castillo y el río Ebro antes de ser sumergido.',
        historyFact: 'Cuna del escritor Jesús Moncada, quien inmortalizó a sus barqueros, sirgadores, mineros y la vida del pueblo viejo en su obra cumbre de la literatura contemporánea "Camí de sirga".',
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
      placa_armes: {
        id: 'placa_armes',
        title: 'Plaça d\'Armes (Plaza de Armas)',
        subtitle: 'El epicentro social del Poble Vell',
        era: 'Siglos XIX - XX',
        altitude: '92 m',
        evidence: 'Documentado',
        evidenceSource: 'Fototeca Municipal · Foto MUNI_plaza_512',
        panoKey: 'poble_calle',
        targetYaw: -0.22,
        targetPitch: -0.05,
        targetFov: 32,
        pinPos: new THREE.Vector3(-22, -4, -96),
        thumb: 'assets/ref/pueblo/poble1.jpg',
        category: 'pueblo',
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
        panoKey: 'poble_calle',
        targetYaw: -0.16,
        targetPitch: 0.08,
        targetFov: 32,
        pinPos: new THREE.Vector3(-14, 6, -98),
        thumb: 'assets/ref/esglesia/esglesia1.jpg',
        category: 'esglesia',
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
        panoKey: 'poble_calle',
        targetYaw: -0.38,
        targetPitch: -0.04,
        targetFov: 33,
        pinPos: new THREE.Vector3(-38, -5, -92),
        thumb: 'assets/ref/pueblo/poble2.jpg',
        category: 'pueblo',
        desc: 'Calle empedrada flanqueada por comercios, ultramarinos, barberías y talleres artesanales que comunicaba el corazón del pueblo con el camino hacia la comarca del Segre.',
        historyFact: 'Por ella discurrían las procesiones de Santa Agatoclia y el bullicio de los días de mercado con carros cargados de productos de la huerta del Ebro.',
        photos: [
          'assets/ref/pueblo/poble2.jpg',
          'assets/ref/pueblo/poble7.jpg',
          'assets/ref/pueblo/poble13.jpg',
          'assets/ref/pueblo/poble17.jpg',
          'assets/ref/pueblo/poble28.jpg'
        ]
      },
      ca_la_vila: {
        id: 'ca_la_vila',
        title: 'Plaça de Ca la Vila (Ayuntamiento)',
        subtitle: 'Antigua Casa Consistorial y sede municipal',
        era: 'Siglo XIX - 1965',
        altitude: '85 m',
        evidence: 'Documentado',
        evidenceSource: 'Archivo Histórico de Mequinenza · 14 fotografías',
        panoKey: 'poble_calle',
        targetYaw: -0.28,
        targetPitch: -0.14,
        targetFov: 32,
        pinPos: new THREE.Vector3(-28, -14, -94),
        thumb: 'assets/ref/ajuntament/ajuntament1.jpg',
        category: 'ajuntament',
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
        panoKey: 'poble_calle',
        targetYaw: -0.44,
        targetPitch: -0.06,
        targetFov: 34,
        pinPos: new THREE.Vector3(-44, -7, -89),
        thumb: 'assets/ref/pueblo/poble3.jpg',
        category: 'pueblo',
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
        panoKey: 'real_castillo_confluencia',
        targetYaw: 0.28,
        targetPitch: -0.16,
        targetFov: 32,
        pinPos: new THREE.Vector3(26, -16, -95),
        thumb: 'assets/ref/generals/generals1.jpg',
        category: 'generals',
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
        panoKey: 'real_castillo_confluencia',
        targetYaw: 0.46,
        targetPitch: 0.02,
        targetFov: 34,
        pinPos: new THREE.Vector3(44, 4, -89),
        thumb: 'assets/ref/llauts/llauts1.jpg',
        category: 'llauts',
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
        panoKey: 'real_castillo_confluencia',
        targetYaw: 0.54,
        targetPitch: -0.14,
        targetFov: 32,
        pinPos: new THREE.Vector3(52, -14, -84),
        thumb: 'assets/ref/generals/generals4.jpg',
        category: 'generals',
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
        panoKey: 'real_castillo_confluencia',
        targetYaw: 0.18,
        targetPitch: -0.22,
        targetFov: 32,
        pinPos: new THREE.Vector3(18, -22, -94),
        thumb: 'assets/ref/elements/elements1.jpg',
        category: 'elements',
        desc: 'Magnífico edificio escolar de estilo novecentista aragonés promovido por la benefactora mequinenzana María Quintana. Por su cota de altura, se salvó del nivel de las aguas del embalse.',
        historyFact: 'Hoy alberga los prestigiosos Museos de Mequinenza (Museo de la Mina, Museo de la Historia y Museo del Pasado Prehistórico).',
        photos: [
          'assets/ref/elements/elements1.jpg',
          'assets/ref/elements/elements2.jpg',
          'assets/ref/pueblo/poble10.jpg',
          'assets/ref/competicions/competicions1.jpg'
        ]
      },
      mina: {
        id: 'mina',
        title: 'Cuenca Minera de Lignito',
        subtitle: 'Pozos, galerías subterráneas y planos inclinados',
        era: 'Siglos XIX - XX',
        altitude: '90 - 200 m',
        evidence: 'Documentado',
        evidenceSource: '12 fotografías históricas de la colección municipal',
        panoKey: 'real_castillo_confluencia',
        targetYaw: -0.52,
        targetPitch: 0.12,
        targetFov: 34,
        pinPos: new THREE.Vector3(-52, 12, -84),
        thumb: 'assets/ref/mina/mina1.jpg',
        category: 'mina',
        desc: 'La cuenca carbonífera de Mequinenza fue el mayor motor económico comarcal. Las explotaciones mineras perforaban las capas de lignito de los montes para alimentar barcos y centrales.',
        historyFact: 'Las vagonetas transportaban el carbón por planos inclinados hasta los cargaderos del Ebro, dando trabajo a más de mil mineros mequinenzanos y foráneos.',
        photos: [
          'assets/ref/mina/mina1.jpg',
          'assets/ref/mina/mina2.jpg',
          'assets/ref/mina/mina3.jpg',
          'assets/ref/mina/mina4.jpg',
          'assets/ref/mina/mina5.jpg'
        ]
      },
      paneles: {
        id: 'paneles',
        title: 'Paneles Informativos Oficiales',
        subtitle: 'Reconstrucción ENHER (1959) e Historia del Castillo',
        era: '1959 - Actualidad',
        altitude: '185 m',
        evidence: 'Documentado',
        evidenceSource: 'Paneles físicos originales del Castillo de Mequinenza',
        panoKey: 'castillo_fachada',
        targetYaw: 0.14,
        targetPitch: 0.15,
        targetFov: 30,
        pinPos: new THREE.Vector3(14, 15, -98),
        thumb: 'assets/ref/paneles/panel_castillo_historico.jpeg',
        category: 'paneles',
        desc: 'Los dos paneles físicos que conservan la historia fidedigna del castillo: el asedio napoleónico de 1810, los siete siglos de historia y la monumental reconstrucción realizada por ENHER en 1959.',
        historyFact: 'Por salvar el monumento de una ruina segura, la Asociación Española de Amigos de los Castillos concedió el 16 de marzo de 1960 su Medalla de Plata a la empresa reconstructora.',
        photos: [
          'assets/ref/paneles/panel_castillo_historico.jpeg',
          'assets/ref/paneles/panel_reconstruccion_enher.jpeg',
          'assets/ref/enderroc/enderroc1.jpg',
          'assets/ref/enderroc/enderroc2.jpg'
        ]
      }
    };

    // Paradas del Recorrido Guiado ("De la Plaça d'Armes a Lo Muro" como en poblevell.es)
    this.tourKeys = [
      'placa_armes',
      'esglesia',
      'carrer_major',
      'ca_la_vila',
      'carrer_saragossa',
      'lo_muro',
      'castillo'
    ];

    this.activeLandmarkId = 'overview';
    this.pinElements = new Map();

    // Tour state
    this.tourActive = false;
    this.tourStepIndex = 0;
    this.tourTimer = 0;

    // Time of day (minutos: 440 = 07:20 amanecer, 910 = 15:10 mediodía, 1260 = 21:00 atardecer, 1380 = 23:00 noche)
    this.timeMinutes = 910;

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
    this.camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 1000);
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
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = -0.35; // Natural look-around
    this.controls.minDistance = 0.01;
    this.controls.maxDistance = 1.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.22;

    this.controls.minPolarAngle = Math.PI * 0.25;
    this.controls.maxPolarAngle = Math.PI * 0.75;
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfff5ea, 1.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfae, 1.8);
    this.sunLight.position.set(10, 15, -10);
    this.scene.add(this.sunLight);
  }

  /* ========================================================================
     PANORAMIC ENVIRONMENT (Real Historical Projections)
     ======================================================================== */
  loadPanoramas() {
    // 1. Panorámica Real tomada desde el Castillo (4288x3216)
    const texConfluencia = this.textureLoader.load('assets/ref/wikimedia/castillo/mequinenza_desde_castillo.jpg');
    texConfluencia.colorSpace = THREE.SRGBColorSpace;
    texConfluencia.wrapS = THREE.ClampToEdgeWrapping;
    texConfluencia.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.real_castillo_confluencia = texConfluencia;

    // 2. Castillo Fachada y Murallas (5449x3150)
    const texCastillo = this.textureLoader.load('assets/ref/wikimedia/castillo/castillo_zm.jpg');
    texCastillo.colorSpace = THREE.SRGBColorSpace;
    texCastillo.wrapS = THREE.ClampToEdgeWrapping;
    texCastillo.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.castillo_fachada = texCastillo;

    // 3. Poble Vell a pie de calle (ruinas de piedra y empedrado)
    const texCalle = this.textureLoader.load('assets/poble_vell_fotorrealista.jpg');
    texCalle.colorSpace = THREE.SRGBColorSpace;
    texCalle.wrapS = THREE.ClampToEdgeWrapping;
    texCalle.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.poble_calle = texCalle;

    // 4. Gemelo digital aéreo
    const texDigital = this.textureLoader.load('assets/mequinenza_aerea_panoramica.jpg');
    texDigital.colorSpace = THREE.SRGBColorSpace;
    texDigital.wrapS = THREE.ClampToEdgeWrapping;
    texDigital.wrapT = THREE.ClampToEdgeWrapping;
    this.panoTextures.gemelo_digital = texDigital;

    // Sphere geometry (inverted for internal viewing)
    const sphereGeo = new THREE.SphereGeometry(100, 64, 40);
    sphereGeo.scale(-1, 1, 1);

    this.panoMaterial = new THREE.MeshBasicMaterial({
      map: texConfluencia,
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
     ATMOSPHERIC EFFECTS (Particles, Birds)
     ======================================================================== */
  createAtmosphereEffects() {
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
        height: 12 + Math.random() * 12,
        speed: 0.18 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2
      };
      this.birdsGroup.add(bird);
      this.birds.push(bird);
    }
  }

  /* ========================================================================
     TIME OF DAY LIGHTING (Inspirado en el deslizador de poblevell.es)
     ======================================================================== */
  setTimeOfDay(minutes) {
    this.timeMinutes = minutes;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const labelOutput = document.getElementById('visor-hora-valor');
    if (labelOutput) labelOutput.textContent = timeString;

    // Calcular factor de luz según la hora
    if (minutes < 480) {
      // Noche / Madrugada (antes de las 08:00)
      this.renderer.toneMappingExposure = 0.85;
      this.ambientLight.color.set(0x32475e);
      this.sunLight.color.set(0x5a88ba);
      this.sunLight.intensity = 0.6;
    } else if (minutes < 660) {
      // Amanecer / Mañana temprana (08:00 - 11:00)
      this.renderer.toneMappingExposure = 1.15;
      this.ambientLight.color.set(0xfff0dd);
      this.sunLight.color.set(0xffd59e);
      this.sunLight.intensity = 1.9;
    } else if (minutes < 1140) {
      // Mediodía radiante (11:00 - 19:00)
      this.renderer.toneMappingExposure = 1.08;
      this.ambientLight.color.set(0xf3f8ff);
      this.sunLight.color.set(0xffffff);
      this.sunLight.intensity = 2.1;
    } else if (minutes < 1290) {
      // Atardecer dorado / crepúsculo (19:00 - 21:30)
      this.renderer.toneMappingExposure = 1.25;
      this.ambientLight.color.set(0xffa175);
      this.sunLight.color.set(0xff6a3d);
      this.sunLight.intensity = 1.9;
    } else {
      // Noche cerrada (21:30 en adelante)
      this.renderer.toneMappingExposure = 0.82;
      this.ambientLight.color.set(0x283a4f);
      this.sunLight.color.set(0x4a74a3);
      this.sunLight.intensity = 0.5;
    }
  }

  /* ========================================================================
     INTERACTIVE 3D SCREEN-SPACE PINS (Puntos históricos reales)
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

      let icon = '📍';
      if (landmark.id === 'castillo') icon = '🏰';
      else if (landmark.id === 'esglesia') icon = '⛪';
      else if (landmark.id === 'placa_armes' || landmark.id === 'pueblo' || landmark.id === 'carrer_major' || landmark.id === 'ca_la_vila') icon = '🏛️';
      else if (landmark.id === 'lo_muro' || landmark.id === 'llauts' || landmark.id === 'pont_segre') icon = '⛵';
      else if (landmark.id === 'mina') icon = '⛏️';
      else if (landmark.id === 'colegio') icon = '🏫';
      else if (landmark.id === 'paneles') icon = '📜';

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
    const tempV = new THREE.Vector3();
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const widthHalf = w / 2;
    const heightHalf = h / 2;

    this.pinElements.forEach(({ element, worldPos }, id) => {
      tempV.copy(worldPos);
      tempV.project(this.camera);

      // Check if behind camera
      if (tempV.z < -1.0 || tempV.z > 1.0) {
        element.style.display = 'none';
        return;
      }

      const x = (tempV.x * widthHalf) + widthHalf;
      const y = -(tempV.y * heightHalf) + heightHalf;

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

    // Cambiar textura panorámica si corresponde
    if (lm.panoKey && lm.panoKey !== this.activePanoKey) {
      this.switchPanorama(lm.panoKey);
    }

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

    // Disparar evento para actualizar el Dossier y el carrete de fotos reales
    window.dispatchEvent(new CustomEvent('landmarkSelected', { detail: lm }));
  }

  /* ========================================================================
     RECORRIDOS GUIADOS (Paseo con paradas de poblevell.es)
     ======================================================================== */
  startTour() {
    this.tourActive = true;
    this.tourStepIndex = 0;
    this.tourTimer = 0;
    this.navigateToLandmark(this.tourKeys[0]);

    const banner = document.getElementById('tour-hud-banner');
    if (banner) banner.style.display = 'flex';
  }

  stopTour() {
    this.tourActive = false;
    const banner = document.getElementById('tour-hud-banner');
    if (banner) banner.style.display = 'none';
  }

  tourNext() {
    this.tourStepIndex = (this.tourStepIndex + 1) % this.tourKeys.length;
    this.navigateToLandmark(this.tourKeys[this.tourStepIndex]);
  }

  tourPrev() {
    this.tourStepIndex = (this.tourStepIndex - 1 + this.tourKeys.length) % this.tourKeys.length;
    this.navigateToLandmark(this.tourKeys[this.tourStepIndex]);
  }

  updateTour(delta) {
    if (!this.tourActive) return;
    this.tourTimer += delta;
    const stepDuration = 9.0;

    const progressFill = document.getElementById('tour-step-progress-fill');
    if (progressFill) {
      const pct = (this.tourTimer / stepDuration) * 100;
      progressFill.style.width = `${Math.min(pct, 100)}%`;
    }

    if (this.tourTimer >= stepDuration) {
      this.tourTimer = 0;
      this.tourNext();
    }
  }

  /* ========================================================================
     COMPASS & ROTATION
     ======================================================================== */
  updateCompass() {
    const dial = document.getElementById('compass-dial');
    if (!dial) return;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const angleDeg = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
    dial.style.transform = `rotate(${angleDeg}deg)`;
  }

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

    if (this.particleSystem) {
      const pos = this.particleSystem.geometry.attributes.position;
      for (let i = 1; i < pos.count * 3; i += 3) {
        pos.array[i] += Math.sin(elapsed + i) * 0.015;
      }
      pos.needsUpdate = true;
    }

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
    this.updateTour(delta);

    this.renderer.render(this.scene, this.camera);
  }
}
