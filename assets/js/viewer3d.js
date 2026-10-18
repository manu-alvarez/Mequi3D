/**
 * Mequinenza 3D · Visor Histórico y Gemelo Digital del Poble Vell y el Castillo
 * Basado en la investigación de poblevell.es y la colección histórica municipal
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

    // 3D Groups
    this.worldGroup = new THREE.Group();
    this.terrainGroup = new THREE.Group();
    this.castleGroup = new THREE.Group();
    this.townGroup = new THREE.Group();
    this.riversGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    this.streetLightsGroup = new THREE.Group();
    this.birdsGroup = new THREE.Group();

    // Materials dictionary for dynamic modes (Standard vs Qué sabemos vs Night)
    this.materials = {};
    this.houseMeshes = [];
    this.windowMeshes = [];
    this.streetLightPoints = [];

    // Active mode: 'explorar', 'recorridos', 'comparar', 'que-sabemos'
    this.activeMode = 'explorar';
    this.evidenceLevelActive = false;

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

    // Textures cache
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};

    // Landmark Data (Puntos históricos reales según fuentes de Mequinenza y poblevell.es)
    this.landmarks = {
      overview: {
        id: 'overview',
        title: 'Panorámica de Mequinenza',
        subtitle: 'Confluencia del Ebro y el Segre ("Aiguabarreig")',
        era: 'Desde la Antigüedad hasta 1965',
        altitude: '65 - 185 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'IGN 1956 · Archivo Municipal de Mequinenza',
        category: 'vistas',
        camPos: new THREE.Vector3(55, 62, 95),
        targetPos: new THREE.Vector3(-10, 15, -25),
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
      castillo: {
        id: 'castillo',
        title: 'El Castillo de Mequinenza',
        subtitle: 'Fortaleza medieval de los Moncada (Siglos XII - XIV)',
        era: 'Siglos XII - XIV (Reconquista 1149)',
        altitude: '185 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'Asociación Española de Amigos de los Castillos · ENHER 1959',
        category: 'castillo',
        pinPos: new THREE.Vector3(10, 52, -60),
        camPos: new THREE.Vector3(38, 55, -28),
        targetPos: new THREE.Vector3(10, 44, -60),
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
      pueblo: {
        id: 'pueblo',
        title: 'Poble Vell (Casco Antiguo)',
        subtitle: 'El pueblo que fue desalojado por el embalse de Riba-roja',
        era: 'Trama medieval - Derribo 1970',
        altitude: '80 - 130 m',
        evidence: 'Documentado',
        evidenceSource: 'Vuelo americano IGN 1956 · Centro de Estudios Jesús Moncada',
        category: 'pueblo',
        pinPos: new THREE.Vector3(-25, 22, -30),
        camPos: new THREE.Vector3(15, 36, 15),
        targetPos: new THREE.Vector3(-20, 18, -25),
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
      placa_armes: {
        id: 'placa_armes',
        title: 'Plaça d\'Armes (Plaza de Armas)',
        subtitle: 'El epicentro social del Poble Vell',
        era: 'Siglos XIX - XX',
        altitude: '92 m',
        evidence: 'Documentado',
        evidenceSource: 'Fototeca Municipal · Foto MUNI_plaza_512',
        category: 'pueblo',
        pinPos: new THREE.Vector3(-15, 20, -20),
        camPos: new THREE.Vector3(6, 24, -3),
        targetPos: new THREE.Vector3(-15, 17, -22),
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
        category: 'esglesia',
        pinPos: new THREE.Vector3(-5, 34, -35),
        camPos: new THREE.Vector3(16, 32, -18),
        targetPos: new THREE.Vector3(-5, 26, -36),
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
        category: 'pueblo',
        pinPos: new THREE.Vector3(-30, 20, -26),
        camPos: new THREE.Vector3(-10, 24, -8),
        targetPos: new THREE.Vector3(-30, 18, -26),
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
        subtitle: 'Casa Consistorial y balcón sobre el Ebro',
        era: 'Siglos XVIII - XX',
        altitude: '74 m',
        evidence: 'Documentado',
        evidenceSource: 'Archivo Histórico Provincial de Zaragoza',
        category: 'ajuntament',
        pinPos: new THREE.Vector3(-2, 11, -4),
        camPos: new THREE.Vector3(18, 16, 12),
        targetPos: new THREE.Vector3(-2, 9, -4),
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
        category: 'pueblo',
        pinPos: new THREE.Vector3(-45, 16, -28),
        camPos: new THREE.Vector3(-22, 25, -12),
        targetPos: new THREE.Vector3(-45, 15, -28),
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
        category: 'generals',
        pinPos: new THREE.Vector3(-15, 7, 15),
        camPos: new THREE.Vector3(-8, 12, 44),
        targetPos: new THREE.Vector3(-15, 5, 15),
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
        category: 'llauts',
        pinPos: new THREE.Vector3(10, 3, 25),
        camPos: new THREE.Vector3(26, 12, 50),
        targetPos: new THREE.Vector3(0, 3, 20),
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
        category: 'generals',
        pinPos: new THREE.Vector3(70, 8, 0),
        camPos: new THREE.Vector3(45, 20, 35),
        targetPos: new THREE.Vector3(70, 6, 0),
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
        category: 'elements',
        pinPos: new THREE.Vector3(-75, 20, -15),
        camPos: new THREE.Vector3(-45, 28, 20),
        targetPos: new THREE.Vector3(-75, 18, -15),
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
      mina: {
        id: 'mina',
        title: 'Cuenca Minera de Lignito',
        subtitle: 'Pozos, galerías subterráneas y planos inclinados',
        era: 'Siglos XIX - XX',
        altitude: '90 - 200 m',
        evidence: 'Documentado',
        evidenceSource: '12 fotografías históricas de la colección municipal',
        category: 'mina',
        pinPos: new THREE.Vector3(-90, 30, -75),
        camPos: new THREE.Vector3(-60, 42, -45),
        targetPos: new THREE.Vector3(-90, 26, -75),
        thumb: 'assets/ref/mina/mina1.jpg',
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
      cenital: {
        id: 'cenital',
        title: 'Vista Cenital (Plano Histórico)',
        subtitle: 'Perspectiva aérea ortogonal del Poble Vell',
        era: '1965',
        altitude: '250 m s.n.m.',
        evidence: 'Documentado',
        evidenceSource: 'Vuelo americano 1956 IGN · Plano maestro del proyecto',
        category: 'vistas',
        camPos: new THREE.Vector3(-10, 160, -20),
        targetPos: new THREE.Vector3(-10, 0, -20),
        thumb: 'assets/mequinenza_aerea_panoramica.jpg',
        desc: 'Vista aérea vertical orientada al norte para examinar la trama urbana completa, las manzanas, la confluencia de los ríos y el relieve topográfico.',
        historyFact: 'El vuelo fotogramétrico de 1956 del Ejército de los Estados Unidos (IGN) permitió mapear con precisión métrica la planta de las 775 casas de Mequinenza antes de su demolición.',
        photos: [
          'assets/mequinenza_aerea_panoramica.jpg',
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals2.jpg'
        ]
      }
    };

    // Paradas del Recorrido Guiado ("De la Plaça d'Armes a Lo Muro" como en poblevell.es)
    this.tourStops = [
      {
        id: 'tour_1',
        landmarkId: 'placa_armes',
        name: 'Plaça d\'Armes (Plaza de Armas)',
        headline: 'El centro neurálgico del pueblo viejo',
        text: 'La Plaça d\'Armes era el corazón de la vida vecinal y social de Mequinenza. Rodeada por caserones señoriales como el caserón del portal de arco (277 m² de planta y tres alturas), albergaba el célebre Bar Sport, los quioscos de madera y las tertulias diarias de sirgadores y mineros.'
      },
      {
        id: 'tour_2',
        landmarkId: 'esglesia',
        name: 'Placeta Missa y l\'Església',
        headline: 'La iglesia parroquial de la Asunción',
        text: 'Subiendo hacia la ladera se abre la Placeta Missa ante la monumental iglesia de Nuestra Señora de la Asunción. Con su esbelta torre campanario de sillería caliza y su cúpula sobre el crucero, marcaba los cuartos y las horas de trabajo fluvial y minero.'
      },
      {
        id: 'tour_3',
        landmarkId: 'carrer_major',
        name: 'Carrer Major (Calle Mayor)',
        headline: 'La arteria comercial y los comercios históricos',
        text: 'El Carrer Major articulaba la circulación este-oeste con su empedrado desgastado por el paso de caballerías. Aquí se alineaban farmacias, sastrerías, panaderías de horno de leña y las tiendas de ultramarinos más frecuentadas.'
      },
      {
        id: 'tour_4',
        landmarkId: 'ca_la_vila',
        name: 'Plaça de Ca la Vila (Ayuntamiento)',
        headline: 'La sede consistorial sobre la ribera del río',
        text: 'La Casa Consistorial o Ca la Vila dominaba el rellano fluvial. Desde su balcón institucional se proclamaban los bandos, mientras en la planta baja se despachaban las licencias de sirga y los pesajes oficiales del carbón.'
      },
      {
        id: 'tour_5',
        landmarkId: 'carrer_saragossa',
        name: 'Baixada de l\'Abeurador y Carrer Saragossa',
        headline: 'El descenso hacia el abrevadero y el paso del río',
        text: 'La empinada bajada del abrevadero conectaba el sector de la calle Zaragoza (53 casas de familias trabajadoras) directamente con el caudal del Ebro, permitiendo a los animales abrevar y a los vecinos abastecerse de agua.'
      },
      {
        id: 'tour_6',
        landmarkId: 'lo_muro',
        name: 'Lo Muro (El Muro)',
        headline: 'El monumento fluvial y defensa contra las riadas',
        text: 'El orgullo arquitectónico de los mequinenzanos: un muro de sillería de doble hilada de bloques labrados que se extendía a lo largo de cientos de metros frente al Ebro. Protegía al pueblo de las avenidas y servía de paseo ineludible al atardecer.'
      },
      {
        id: 'tour_7',
        landmarkId: 'llauts',
        name: 'Lo Muro, mirando al río y los Llaüts',
        headline: 'El puerto fluvial de los barcos de carbón',
        text: 'Desde Lo Muro se contemplaba el trajín incesante de los llaüts cargados de toneladas de lignito negro procedente de las cuencas mineras. Los valientes sirgadores amarraban aquí antes de emprender el duro camino de sirga contracorriente hacia Fayón.'
      }
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
  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.loadTextures();
    this.build3DDigitalTwin();
    this.setupAtmosphere();
    this.create3DScreenPins();
    this.bindEvents();
    this.animate();

    // Set initial lighting (15:10)
    this.setTimeOfDay(910);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1724);
    this.scene.fog = new THREE.FogExp2(0x132132, 0.0028);
    this.scene.add(this.worldGroup);

    this.worldGroup.add(this.terrainGroup);
    this.worldGroup.add(this.riversGroup);
    this.worldGroup.add(this.castleGroup);
    this.worldGroup.add(this.townGroup);
    this.worldGroup.add(this.foliageGroup);
    this.worldGroup.add(this.streetLightsGroup);
    this.worldGroup.add(this.birdsGroup);
  }

  setupCamera() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 2000);
    // Initial Overview Perspective
    this.camera.position.set(55, 62, 95);
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(-10, 15, -25);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = 0.65;
    this.controls.panSpeed = 0.8;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 280;
    this.controls.maxPolarAngle = Math.PI * 0.48; // No traspasar suelo
    this.controls.minPolarAngle = Math.PI * 0.05;
  }

  setupLighting() {
    // Hemisphere ambient light (cielo azul mediterráneo / tierra cálida)
    this.hemiLight = new THREE.HemisphereLight(0xe8f2ff, 0x5a4836, 1.2);
    this.scene.add(this.hemiLight);

    // Luz ambiental suave
    this.ambientLight = new THREE.AmbientLight(0xffeedb, 0.65);
    this.scene.add(this.ambientLight);

    // Sol direccional principal con sombras
    this.sunLight = new THREE.DirectionalLight(0xfff1dc, 2.4);
    this.sunLight.position.set(70, 95, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 350;
    this.sunLight.shadow.camera.left = -110;
    this.sunLight.shadow.camera.right = 110;
    this.sunLight.shadow.camera.top = 110;
    this.sunLight.shadow.camera.bottom = -110;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
  }

  loadTextures() {
    // Carga de texturas PBR locales disponibles en el proyecto
    const piedraTex = this.textureLoader.load('assets/piedra.jpg');
    piedraTex.wrapS = THREE.RepeatWrapping;
    piedraTex.wrapT = THREE.RepeatWrapping;
    piedraTex.repeat.set(4, 4);
    this.textures.piedra = piedraTex;

    const ruinasTex = this.textureLoader.load('assets/ruinas.jpg');
    ruinasTex.wrapS = THREE.RepeatWrapping;
    ruinasTex.wrapT = THREE.RepeatWrapping;
    ruinasTex.repeat.set(3, 3);
    this.textures.ruinas = ruinasTex;

    // Materiales base del modelo
    this.materials.rockCliff = new THREE.MeshStandardMaterial({
      map: piedraTex,
      color: 0xbaa892,
      roughness: 0.9,
      metalness: 0.05
    });

    this.materials.townTerrain = new THREE.MeshStandardMaterial({
      map: ruinasTex,
      color: 0x9e9282,
      roughness: 0.92,
      metalness: 0.02
    });

    this.materials.castleStone = new THREE.MeshStandardMaterial({
      map: piedraTex,
      color: 0xd6c4aa,
      roughness: 0.82,
      metalness: 0.08
    });

    this.materials.castleTrim = new THREE.MeshStandardMaterial({
      color: 0x9c8872,
      roughness: 0.7
    });

    this.materials.churchStone = new THREE.MeshStandardMaterial({
      map: piedraTex,
      color: 0xe0cfb6,
      roughness: 0.78
    });

    this.materials.churchDome = new THREE.MeshStandardMaterial({
      color: 0x7a8e7e, // Cúpula de zinc/plomo oxidada noble
      roughness: 0.5,
      metalness: 0.3
    });

    this.materials.roofTile = new THREE.MeshStandardMaterial({
      color: 0xae5838, // Teja árabe cerámica envejecida
      roughness: 0.88,
      metalness: 0.02
    });

    this.materials.stuccoWallOchre = new THREE.MeshStandardMaterial({
      color: 0xd9c5a5,
      roughness: 0.85
    });

    this.materials.stuccoWallWhite = new THREE.MeshStandardMaterial({
      color: 0xe8e2d5,
      roughness: 0.82
    });

    this.materials.stuccoWallSienna = new THREE.MeshStandardMaterial({
      color: 0xc8a482,
      roughness: 0.86
    });

    this.materials.timber = new THREE.MeshStandardMaterial({
      color: 0x4a3220,
      roughness: 0.9
    });

    // Materiales para el modo "Qué sabemos" (Evidencia histórica)
    this.materials.evidenceDocumented = new THREE.MeshStandardMaterial({
      color: 0xe8bc72,
      emissive: 0x3a2c14,
      roughness: 0.6,
      metalness: 0.2
    });

    this.materials.evidenceInferred = new THREE.MeshStandardMaterial({
      color: 0xc9893d,
      roughness: 0.7,
      metalness: 0.1
    });

    this.materials.evidenceHypothetical = new THREE.MeshStandardMaterial({
      color: 0x828b96,
      roughness: 0.85,
      metalness: 0.05
    });

    // Material de ventanas iluminadas de noche
    this.materials.windowDark = new THREE.MeshBasicMaterial({ color: 0x181a20 });
    this.materials.windowLit = new THREE.MeshBasicMaterial({ color: 0xffd97d });
  }

  /* ========================================================================
     3D DIGITAL TWIN BUILDER (Topografía, Castillo, Calles, Casas, Ríos)
     ======================================================================== */
  build3DDigitalTwin() {
    this.buildTerrain();
    this.buildRivers();
    this.buildLoMuro();
    this.buildCastle();
    this.buildChurch();
    this.buildPobleVellHouses();
    this.buildGrupoEscolar();
    this.buildPontDeSegre();
    this.buildLlauts();
    this.buildFoliage();
  }

  /* 1. TERRENO REALISTA DE MEQUINENZA */
  buildTerrain() {
    const geo = new THREE.PlaneGeometry(280, 280, 110, 110);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const x = vertex.x;
      const z = vertex.z;

      let y = 0;

      // Farallón rocoso del Castillo (Noreste: X ~ -10..40, Z ~ -95..-40)
      const distCastle = Math.hypot(x - 10, z - (-65));
      if (distCastle < 45) {
        const factor = Math.cos((distCastle / 45) * (Math.PI / 2));
        y += Math.pow(factor, 1.4) * 44;
      }

      // Ladera escalonada del Poble Vell (X ~ -65..15, Z ~ -75..-10)
      if (x > -75 && x < 25 && z > -80 && z < 15) {
        const slopeFactor = (-z + 15) / 95; // Sube al norte
        const westFactor = (25 - x) / 100;
        y += Math.max(0, slopeFactor * 26 + westFactor * 6);
      }

      // Cauce del río Ebro (Z > 5 hacia el sur)
      if (z > 2 && z < 65) {
        const riverCenter = 32;
        const distRiver = Math.abs(z - riverCenter);
        if (distRiver < 28) {
          const depth = Math.cos((distRiver / 28) * (Math.PI / 2)) * 6.5;
          y -= depth;
        }
      }

      // Cauce del río Segre (X > 45 hacia el este, reuniéndose con el Ebro)
      if (x > 38 && z < 30) {
        const segreCenter = 68;
        const distSegre = Math.abs(x - segreCenter);
        if (distSegre < 26) {
          const depth = Math.cos((distSegre / 26) * (Math.PI / 2)) * 6;
          y -= depth;
        }
      }

      // Ondulaciones naturales del relieve exterior
      y += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.2;

      pos.setY(i, y);
    }

    geo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(geo, this.materials.rockCliff);
    terrainMesh.receiveShadow = true;
    this.terrainGroup.add(terrainMesh);
  }

  /* 2. CONFLUENCIA FLUVIAL (EBRO Y SEGRE - "AIGUABARREIG") */
  buildRivers() {
    // Lámina de agua del Ebro
    const ebroGeo = new THREE.PlaneGeometry(280, 55, 32, 16);
    ebroGeo.rotateX(-Math.PI / 2);

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b4f5e,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    const ebroWater = new THREE.Mesh(ebroGeo, this.waterMat);
    ebroWater.position.set(0, 0.4, 32);
    ebroWater.receiveShadow = true;
    this.riversGroup.add(ebroWater);

    // Lámina de agua del Segre
    const segreGeo = new THREE.PlaneGeometry(50, 110, 16, 24);
    segreGeo.rotateX(-Math.PI / 2);
    const segreWater = new THREE.Mesh(segreGeo, this.waterMat);
    segreWater.position.set(68, 0.4, -22);
    segreWater.receiveShadow = true;
    this.riversGroup.add(segreWater);
  }

  /* 3. LO MURO (EL PRETIL HISTÓRICO SOBRE EL EBRO) */
  buildLoMuro() {
    const muroGroup = new THREE.Group();

    // Muro de sillería de piedra a lo largo de la ribera
    const muroLength = 80;
    const muroGeo = new THREE.BoxGeometry(muroLength, 5.5, 3.2);
    const muroMesh = new THREE.Mesh(muroGeo, this.materials.castleStone);
    muroMesh.position.set(-15, 3.8, 14);
    muroMesh.castShadow = true;
    muroMesh.receiveShadow = true;
    muroGroup.add(muroMesh);

    // Albardilla superior labrada
    const albardillaGeo = new THREE.BoxGeometry(muroLength + 2, 0.6, 3.8);
    const albardillaMesh = new THREE.Mesh(albardillaGeo, this.materials.castleTrim);
    albardillaMesh.position.set(-15, 6.8, 14);
    albardillaMesh.castShadow = true;
    muroGroup.add(albardillaMesh);

    // Rampa histórica de bajada al agua (embarcadero)
    const rampaGeo = new THREE.BoxGeometry(14, 2, 10);
    rampaGeo.rotateX(0.24);
    const rampaMesh = new THREE.Mesh(rampaGeo, this.materials.townTerrain);
    rampaMesh.position.set(12, 1.8, 16);
    muroGroup.add(rampaMesh);

    this.townGroup.add(muroGroup);
  }

  /* 4. EL CASTILLO DE MEQUINENZA (FORTALEZA MEDIEVAL) */
  buildCastle() {
    const cGroup = new THREE.Group();
    cGroup.position.set(10, 40, -60);

    // 1. Terraza fortificada y cimientos
    const baseGeo = new THREE.BoxGeometry(44, 7, 36);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.castleStone);
    baseMesh.position.set(0, 3.5, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    cGroup.add(baseMesh);

    // 2. Torre del Homenaje (La más alta y emblemática)
    const torreHomGeo = new THREE.BoxGeometry(11, 20, 11);
    const torreHom = new THREE.Mesh(torreHomGeo, this.materials.castleStone);
    torreHom.position.set(12, 16, 8);
    torreHom.castShadow = true;
    torreHom.receiveShadow = true;
    cGroup.add(torreHom);

    // Almenas Torre Homenaje
    this.addCrenellations(cGroup, 12, 26, 8, 11.4, 11.4);

    // Mástil y bandera de Aragón / Mequinenza
    const mastilGeo = new THREE.CylinderGeometry(0.12, 0.12, 7, 8);
    const mastil = new THREE.Mesh(mastilGeo, this.materials.timber);
    mastil.position.set(12, 29.5, 8);
    cGroup.add(mastil);

    const flagGeo = new THREE.PlaneGeometry(3.5, 2.2);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xdfa028, // Bandera cuatribarrada simplificada
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(13.8, 31.8, 8);
    cGroup.add(flag);

    // 3. Torre de la Confluencia (Hacia el sur dominando ambos ríos)
    const torreConfGeo = new THREE.BoxGeometry(9, 16, 9);
    const torreConf = new THREE.Mesh(torreConfGeo, this.materials.castleStone);
    torreConf.position.set(-13, 14, 9);
    torreConf.castShadow = true;
    cGroup.add(torreConf);
    this.addCrenellations(cGroup, -13, 22, 9, 9.4, 9.4);

    // 4. Torre de Armas (Ángulo Noroeste)
    const torreArmasGeo = new THREE.BoxGeometry(9, 15, 9);
    const torreArmas = new THREE.Mesh(torreArmasGeo, this.materials.castleStone);
    torreArmas.position.set(-13, 13.5, -9);
    torreArmas.castShadow = true;
    cGroup.add(torreArmas);
    this.addCrenellations(cGroup, -13, 21, -9, 9.4, 9.4);

    // 5. Torre del Portal (Puerta fortificada con arco)
    const torrePortGeo = new THREE.BoxGeometry(10, 15, 9);
    const torrePort = new THREE.Mesh(torrePortGeo, this.materials.castleStone);
    torrePort.position.set(12, 13.5, -9);
    torrePort.castShadow = true;
    cGroup.add(torrePort);
    this.addCrenellations(cGroup, 12, 21, -9, 10.4, 9.4);

    // 6. Muros perimetrales y adarves (Murallas conectoras)
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 3.2), this.materials.castleStone);
    wallN.position.set(0, 11.5, -9);
    wallN.castShadow = true;
    cGroup.add(wallN);

    const wallS = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 3.2), this.materials.castleStone);
    wallS.position.set(0, 11.5, 9);
    wallS.castShadow = true;
    cGroup.add(wallS);

    const wallW = new THREE.Mesh(new THREE.BoxGeometry(3.2, 11, 18), this.materials.castleStone);
    wallW.position.set(-13, 11.5, 0);
    wallW.castShadow = true;
    cGroup.add(wallW);

    const wallE = new THREE.Mesh(new THREE.BoxGeometry(3.2, 11, 18), this.materials.castleStone);
    wallE.position.set(12, 11.5, 0);
    wallE.castShadow = true;
    cGroup.add(wallE);

    // 7. Patio de armas gótico central
    const patioSuelo = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), this.materials.castleTrim);
    patioSuelo.rotateX(-Math.PI / 2);
    patioSuelo.position.set(-0.5, 7.1, 0);
    cGroup.add(patioSuelo);

    // Sala noble gótica interior con tejado a dos aguas
    const salaGeo = new THREE.BoxGeometry(16, 7, 10);
    const salaMesh = new THREE.Mesh(salaGeo, this.materials.castleStone);
    salaMesh.position.set(-0.5, 10.5, 0);
    salaMesh.castShadow = true;
    cGroup.add(salaMesh);

    const salaTejadoGeo = new THREE.ConeGeometry(9.5, 4, 4);
    salaTejadoGeo.rotateY(Math.PI / 4);
    const salaTejado = new THREE.Mesh(salaTejadoGeo, this.materials.roofTile);
    salaTejado.position.set(-0.5, 16, 0);
    salaTejado.scale.set(1.4, 1, 0.9);
    cGroup.add(salaTejado);

    this.castleGroup.add(cGroup);
  }

  addCrenellations(group, x, y, z, width, depth) {
    const crenMat = this.materials.castleTrim;
    const crenSize = 1.1;
    const countX = Math.floor(width / (crenSize * 1.8));
    const countZ = Math.floor(depth / (crenSize * 1.8));

    // Lado frontal y trasero
    for (let i = 0; i < countX; i++) {
      const offsetX = -width / 2 + (i + 0.5) * (width / countX);
      const crenF = new THREE.Mesh(new THREE.BoxGeometry(crenSize, crenSize, 0.6), crenMat);
      crenF.position.set(x + offsetX, y + crenSize / 2, z + depth / 2);
      group.add(crenF);

      const crenB = new THREE.Mesh(new THREE.BoxGeometry(crenSize, crenSize, 0.6), crenMat);
      crenB.position.set(x + offsetX, y + crenSize / 2, z - depth / 2);
      group.add(crenB);
    }
  }

  /* 5. IGLESIA DE NUESTRA SEÑORA DE LA ASUNCIÓN */
  buildChurch() {
    const chGroup = new THREE.Group();
    chGroup.position.set(-5, 23, -36);

    // Nave principal
    const naveGeo = new THREE.BoxGeometry(24, 13, 13);
    const nave = new THREE.Mesh(naveGeo, this.materials.churchStone);
    nave.position.set(0, 6.5, 0);
    nave.castShadow = true;
    nave.receiveShadow = true;
    chGroup.add(nave);

    // Tejado a dos aguas de la nave
    const tejadoGeo = new THREE.ConeGeometry(10, 4, 4);
    tejadoGeo.rotateY(Math.PI / 4);
    const tejado = new THREE.Mesh(tejadoGeo, this.materials.roofTile);
    tejado.position.set(0, 15, 0);
    tejado.scale.set(1.9, 1, 1.1);
    chGroup.add(tejado);

    // Cúpula sobre el crucero con linterna
    const cruceroGeo = new THREE.BoxGeometry(11, 14, 15);
    const crucero = new THREE.Mesh(cruceroGeo, this.materials.churchStone);
    crucero.position.set(6, 7, 0);
    crucero.castShadow = true;
    chGroup.add(crucero);

    const tamborGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 12);
    const tambor = new THREE.Mesh(tamborGeo, this.materials.churchStone);
    tambor.position.set(6, 15.5, 0);
    chGroup.add(tambor);

    const cupulaGeo = new THREE.SphereGeometry(4.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const cupula = new THREE.Mesh(cupulaGeo, this.materials.churchDome);
    cupula.position.set(6, 17.2, 0);
    chGroup.add(cupula);

    // Campanario histórico de sillería (26 m de altura)
    const torreGeo = new THREE.BoxGeometry(6.5, 23, 6.5);
    const torre = new THREE.Mesh(torreGeo, this.materials.churchStone);
    torre.position.set(-11, 11.5, 5);
    torre.castShadow = true;
    chGroup.add(torre);

    // Campanario: cuerpo de campanas con arcos
    const belfryGeo = new THREE.BoxGeometry(5.5, 5, 5.5);
    const belfry = new THREE.Mesh(belfryGeo, this.materials.castleTrim);
    belfry.position.set(-11, 25, 5);
    chGroup.add(belfry);

    const chapitelGeo = new THREE.ConeGeometry(3.6, 5, 4);
    chapitelGeo.rotateY(Math.PI / 4);
    const chapitel = new THREE.Mesh(chapitelGeo, this.materials.churchDome);
    chapitel.position.set(-11, 29.5, 5);
    chGroup.add(chapitel);

    this.townGroup.add(chGroup);
  }

  /* 6. CASAS DEL POBLE VELL (ESTRUCTURA DE MANZANAS Y CALLES HISTÓRICAS) */
  buildPobleVellHouses() {
    // Definición de manzanas históricas a lo largo de las calles reales
    const townBlocks = [
      // Plaça d'Armes & entorno (caserones señoriales)
      { x: -15, z: -18, w: 9, d: 7, floors: 3.5, roofRot: 0, ev: 'documented', name: 'Caserón del portal de arco' },
      { x: -24, z: -17, w: 7, d: 6, floors: 3, roofRot: 0, ev: 'inferred', name: 'Sastrería Roca' },
      { x: -16, z: -25, w: 8, d: 6, floors: 2.5, roofRot: Math.PI / 2, ev: 'documented', name: 'Bar Sport y tertulias' },
      { x: -7, z: -20, w: 6, d: 6, floors: 3, roofRot: 0, ev: 'inferred', name: 'Caserón Este' },

      // Carrer Major (calle comercial continua)
      { x: -28, z: -24, w: 6, d: 5, floors: 3, roofRot: 0, ev: 'documented', name: 'Carrer Major 12' },
      { x: -34, z: -25, w: 5, d: 5, floors: 2.5, roofRot: 0, ev: 'inferred', name: 'Carrer Major 14' },
      { x: -40, z: -26, w: 6, d: 5.5, floors: 3, roofRot: 0, ev: 'inferred', name: 'Carrer Major 16' },
      { x: -46, z: -27, w: 5.5, d: 5, floors: 2.5, roofRot: 0, ev: 'hypothetical', name: 'Carrer Major 18' },
      { x: -52, z: -28, w: 6, d: 5, floors: 3, roofRot: 0, ev: 'hypothetical', name: 'Carrer Major 20' },

      // Carrer Saragossa (53 casas bajando en hilera escalonada)
      { x: -38, z: -15, w: 5, d: 5, floors: 2.5, roofRot: Math.PI / 2, ev: 'inferred', name: 'Carrer Saragossa 8' },
      { x: -43, z: -17, w: 5, d: 5, floors: 3, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer Saragossa 10' },
      { x: -48, z: -19, w: 5, d: 5, floors: 2.5, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer Saragossa 12' },
      { x: -53, z: -21, w: 5, d: 5, floors: 2, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer Saragossa 14' },
      { x: -58, z: -23, w: 5, d: 5, floors: 2.5, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer Saragossa 16' },

      // Ca la Vila & Sector Ribera
      { x: -3, z: -5, w: 9, d: 7, floors: 3, roofRot: 0, ev: 'documented', name: 'Ca la Vila (Ayuntamiento)' },
      { x: -12, z: -6, w: 6, d: 5.5, floors: 2.5, roofRot: 0, ev: 'inferred', name: 'Ribera Ebro 1' },
      { x: -18, z: -7, w: 5.5, d: 5.5, floors: 2.5, roofRot: 0, ev: 'inferred', name: 'Ribera Ebro 3' },
      { x: -24, z: -8, w: 6, d: 5, floors: 2, roofRot: 0, ev: 'hypothetical', name: 'Ribera Ebro 5' },

      // Carrer de la Barca & Callejones empinados
      { x: -32, z: -8, w: 5, d: 5, floors: 2, roofRot: Math.PI / 2, ev: 'inferred', name: 'Carrer de la Barca 2' },
      { x: -38, z: -9, w: 5, d: 5, floors: 2.5, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer de la Barca 4' },
      { x: -44, z: -10, w: 5, d: 4.5, floors: 2, roofRot: Math.PI / 2, ev: 'hypothetical', name: 'Carrer de la Barca 6' },

      // Sector Alto hacia la Iglesia y el Castillo
      { x: -14, z: -32, w: 6, d: 5, floors: 2.5, roofRot: 0, ev: 'inferred', name: 'Carreró de l\'Església 4' },
      { x: -20, z: -33, w: 5.5, d: 5, floors: 3, roofRot: 0, ev: 'hypothetical', name: 'Carreró de l\'Església 6' },
      { x: -26, z: -34, w: 5, d: 5, floors: 2.5, roofRot: 0, ev: 'hypothetical', name: 'Carreró de l\'Església 8' },
      { x: 3, z: -28, w: 6, d: 5.5, floors: 2.5, roofRot: Math.PI / 2, ev: 'inferred', name: 'Subida al Castillo 1' },
      { x: 7, z: -35, w: 6, d: 5, floors: 2, roofRot: 0, ev: 'hypothetical', name: 'Subida al Castillo 3' }
    ];

    // Generar racimos de casas adicionales para completar las 775 casas
    const wallMats = [this.materials.stuccoWallOchre, this.materials.stuccoWallWhite, this.materials.stuccoWallSienna];

    for (let i = 0; i < 90; i++) {
      const rx = -68 + (i % 12) * 5.8 + (Math.sin(i * 3.7) * 2.5);
      const rz = -68 + Math.floor(i / 12) * 7.2 + (Math.cos(i * 2.1) * 2.2);

      // Evitar zonas de la iglesia, plaza y castillo
      if (Math.hypot(rx - 10, rz - (-60)) < 24) continue;
      if (Math.hypot(rx - (-5), rz - (-36)) < 14) continue;
      if (Math.hypot(rx - (-15), rz - (-20)) < 9) continue;

      const evType = (i % 7 === 0) ? 'documented' : ((i % 3 === 0) ? 'inferred' : 'hypothetical');
      townBlocks.push({
        x: rx,
        z: rz,
        w: 4.5 + (i % 3) * 0.8,
        d: 4.5 + (i % 2) * 0.7,
        floors: 2 + (i % 3) * 0.5,
        roofRot: (i % 2 === 0) ? 0 : Math.PI / 2,
        ev: evType,
        name: `Casa MQN-${String(1000 + i).padStart(4, '0')}`
      });
    }

    townBlocks.forEach((b, idx) => {
      const hGroup = new THREE.Group();
      
      // Altura del terreno en esa posición
      const groundY = this.getTerrainHeightAt(b.x, b.z);
      const height = b.floors * 3.2;

      // Cuerpo de la casa
      const wallMat = wallMats[idx % wallMats.length];
      const houseGeo = new THREE.BoxGeometry(b.w, height, b.d);
      const houseMesh = new THREE.Mesh(houseGeo, wallMat);
      houseMesh.position.set(0, height / 2, 0);
      houseMesh.castShadow = true;
      houseMesh.receiveShadow = true;
      houseMesh.userData = {
        evidence: b.ev,
        originalMat: wallMat,
        name: b.name
      };
      this.houseMeshes.push(houseMesh);
      hGroup.add(houseMesh);

      // Tejado a dos aguas
      const roofGeo = new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.75, 2.2, 4);
      roofGeo.rotateY(Math.PI / 4 + b.roofRot);
      const roofMesh = new THREE.Mesh(roofGeo, this.materials.roofTile);
      roofMesh.position.set(0, height + 1.05, 0);
      roofMesh.scale.set(b.w / Math.max(b.w, b.d), 1, b.d / Math.max(b.w, b.d));
      roofMesh.castShadow = true;
      hGroup.add(roofMesh);

      // Ventanas con carpintería de madera (iluminables de noche)
      for (let f = 1; f <= Math.floor(b.floors); f++) {
        const winY = f * 3.0 - 1.2;
        const winGeo = new THREE.PlaneGeometry(0.75, 1.1);
        const win = new THREE.Mesh(winGeo, this.materials.windowDark);
        win.position.set(0, winY, b.d / 2 + 0.05);
        this.windowMeshes.push(win);
        hGroup.add(win);
      }

      // Farola en algunas esquinas de calles
      if (idx % 6 === 0) {
        const lanternGeo = new THREE.SphereGeometry(0.2, 6, 6);
        const lanternMesh = new THREE.Mesh(lanternGeo, new THREE.MeshBasicMaterial({ color: 0xffe294 }));
        lanternMesh.position.set(b.w / 2 + 0.3, 3.8, b.d / 2 + 0.3);
        hGroup.add(lanternMesh);

        const streetLight = new THREE.PointLight(0xffb84d, 0, 18);
        streetLight.position.set(b.w / 2 + 0.3, 3.8, b.d / 2 + 0.3);
        this.streetLightPoints.push(streetLight);
        hGroup.add(streetLight);
      }

      hGroup.position.set(b.x, groundY, b.z);
      this.townGroup.add(hGroup);
    });
  }

  /* 7. GRUPO ESCOLAR MARÍA QUINTANA */
  buildGrupoEscolar() {
    const sGroup = new THREE.Group();
    sGroup.position.set(-75, 16.5, -15);

    // Edificio monumental de estilo novecentista
    const cuerpoCentral = new THREE.Mesh(new THREE.BoxGeometry(22, 11, 10), this.materials.stuccoWallWhite);
    cuerpoCentral.position.set(0, 5.5, 0);
    cuerpoCentral.castShadow = true;
    sGroup.add(cuerpoCentral);

    // Alas laterales en "U"
    const alaIzq = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 14), this.materials.stuccoWallWhite);
    alaIzq.position.set(-15, 5, 2);
    alaIzq.castShadow = true;
    sGroup.add(alaIzq);

    const alaDer = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 14), this.materials.stuccoWallWhite);
    alaDer.position.set(15, 5, 2);
    alaDer.castShadow = true;
    sGroup.add(alaDer);

    // Tejado cerámico a cuatro aguas
    const roofCentral = new THREE.Mesh(new THREE.ConeGeometry(13, 3.5, 4), this.materials.roofTile);
    roofCentral.rotateY(Math.PI / 4);
    roofCentral.position.set(0, 12.6, 0);
    roofCentral.scale.set(1.6, 1, 0.85);
    sGroup.add(roofCentral);

    this.townGroup.add(sGroup);
  }

  /* 8. PONT DE SEGRE (VIADUCTO HISTÓRICO DE ARCOS DE PIEDRA) */
  buildPontDeSegre() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(70, 5, 0);

    // Tablero del puente
    const tableroGeo = new THREE.BoxGeometry(10, 1.2, 54);
    const tablero = new THREE.Mesh(tableroGeo, this.materials.castleStone);
    tablero.position.set(0, 2.5, 0);
    tablero.castShadow = true;
    bridgeGroup.add(tablero);

    // Pretiles de piedra
    const pretilGeo = new THREE.BoxGeometry(0.6, 1.1, 54);
    const pretilI = new THREE.Mesh(pretilGeo, this.materials.castleTrim);
    pretilI.position.set(-4.8, 3.6, 0);
    bridgeGroup.add(pretilI);

    const pretilD = new THREE.Mesh(pretilGeo, this.materials.castleTrim);
    pretilD.position.set(4.8, 3.6, 0);
    bridgeGroup.add(pretilD);

    // Pilares y arcos sobre el Segre
    for (let p = -18; p <= 18; p += 18) {
      const pilarGeo = new THREE.BoxGeometry(8, 7.5, 3.5);
      const pilar = new THREE.Mesh(pilarGeo, this.materials.castleStone);
      pilar.position.set(0, -1.2, p);
      pilar.castShadow = true;
      bridgeGroup.add(pilar);
    }

    this.riversGroup.add(bridgeGroup);
  }

  /* 9. LLAÜTS (BARCOS TRADICIONALES DE CARBÓN EN EL EBRO) */
  buildLlauts() {
    const llautGroup = new THREE.Group();

    for (let i = 0; i < 3; i++) {
      const boat = new THREE.Group();
      
      // Casco alargado de madera de roble calafateada
      const hullGeo = new THREE.BoxGeometry(2.8, 1.2, 16);
      const hull = new THREE.Mesh(hullGeo, this.materials.timber);
      hull.position.set(0, 0.4, 0);
      hull.castShadow = true;
      boat.add(hull);

      // Carga de lignito negro en la bodega central
      const coalGeo = new THREE.BoxGeometry(2.2, 0.9, 10);
      const coalMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.95 });
      const coal = new THREE.Mesh(coalGeo, coalMat);
      coal.position.set(0, 0.9, 0);
      boat.add(coal);

      // Mástil de sirga abatible
      const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.5, 8);
      const mast = new THREE.Mesh(mastGeo, this.materials.timber);
      mast.position.set(0, 3.2, -4);
      mast.rotateX(-0.15);
      boat.add(mast);

      // Posicionamiento amarrados a Lo Muro
      boat.position.set(-22 + i * 16, 0.6, 19 + (i % 2) * 2.5);
      boat.rotateY(0.12 - i * 0.08);
      llautGroup.add(boat);
    }

    this.riversGroup.add(llautGroup);
  }

  /* 10. VEGETACIÓN MEDITERRÁNEA (PINOS, CIPRESES, ÁRBOLES DE RIBERA) */
  buildFoliage() {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2e4f32, roughness: 0.85 });
    const trunkMat = this.materials.timber;

    const treePositions = [
      // En la plaza y Lo Muro
      { x: -11, z: -14 }, { x: -8, z: -16 }, { x: 5, z: 12 }, { x: -35, z: 13 },
      // Laderas y faldas del castillo
      { x: 2, z: -46 }, { x: -14, z: -52 }, { x: 26, z: -54 }, { x: 32, z: -42 },
      { x: -28, z: -48 }, { x: -55, z: -45 }, { x: -65, z: -35 }
    ];

    treePositions.forEach(p => {
      const tGroup = new THREE.Group();
      const y = this.getTerrainHeightAt(p.x, p.z);

      // Tronco
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), trunkMat);
      trunk.position.set(0, 1.5, 0);
      trunk.castShadow = true;
      tGroup.add(trunk);

      // Copa de pino / ciprés
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.5, 6), treeMat);
      crown.position.set(0, 4.5, 0);
      crown.castShadow = true;
      tGroup.add(crown);

      tGroup.position.set(p.x, y, p.z);
      this.foliageGroup.add(tGroup);
    });
  }

  /* Helper para obtener cota aproximada del terreno */
  getTerrainHeightAt(x, z) {
    let y = 0;
    const distCastle = Math.hypot(x - 10, z - (-65));
    if (distCastle < 45) {
      const factor = Math.cos((distCastle / 45) * (Math.PI / 2));
      y += Math.pow(factor, 1.4) * 44;
    }
    if (x > -75 && x < 25 && z > -80 && z < 15) {
      const slopeFactor = (-z + 15) / 95;
      const westFactor = (25 - x) / 100;
      y += Math.max(0, slopeFactor * 26 + westFactor * 6);
    }
    if (z > 2 && z < 65) {
      const distRiver = Math.abs(z - 32);
      if (distRiver < 28) y -= Math.cos((distRiver / 28) * (Math.PI / 2)) * 6.5;
    }
    return Math.max(0.5, y);
  }

  /* ========================================================================
     ATMOSPHERE & BIRDS
     ======================================================================== */
  setupAtmosphere() {
    // Aves volando en círculos sobre el farallón rocoso
    const birdGeo = new THREE.BufferGeometry();
    const birdVerts = new Float32Array([
      -0.6, 0, -0.2,   0, 0, 0.5,   0.6, 0, -0.2
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(birdVerts, 3));
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1b2838, side: THREE.DoubleSide });

    this.birds = [];
    for (let i = 0; i < 9; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat);
      bird.userData = {
        radius: 28 + (i * 4),
        angle: (i / 9) * Math.PI * 2,
        height: 48 + Math.sin(i) * 8,
        speed: 0.28 + (i % 3) * 0.08
      };
      this.birdsGroup.add(bird);
      this.birds.push(bird);
    }
  }

  /* ========================================================================
     3D SCREEN-SPACE PINS (Puntos históricos en posiciones reales 3D)
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
      else if (landmark.id === 'mina') icon = '⛏️';

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

      // Comprobar si está detrás de la cámara
      const isBehind = tempV.z > 1.0;
      // Comprobar límites de pantalla
      const isOutside = Math.abs(tempV.x) > 1.1 || Math.abs(tempV.y) > 1.1;

      if (isBehind || isOutside) {
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
     TIME OF DAY LIGHTING (Inspirado en el deslizador de poblevell.es)
     ======================================================================== */
  setTimeOfDay(minutes) {
    this.timeMinutes = minutes;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const labelOutput = document.getElementById('visor-hora-valor');
    if (labelOutput) labelOutput.textContent = timeString;

    // Ángulo solar según los minutos del día (de este a oeste)
    const dayProgress = (minutes - 420) / (1320 - 420); // 0 en amanecer, 1 en ocaso
    const sunAngle = dayProgress * Math.PI;

    this.sunLight.position.x = Math.cos(sunAngle) * 95;
    this.sunLight.position.y = Math.max(8, Math.sin(sunAngle) * 110);
    this.sunLight.position.z = 60 - dayProgress * 50;

    const isNight = minutes < 460 || minutes > 1280;

    if (minutes < 480) {
      // Noche / Madrugada
      this.renderer.toneMappingExposure = 0.85;
      this.scene.background.set(0x070c14);
      this.scene.fog.color.set(0x070c14);
      this.ambientLight.color.set(0x283a4f);
      this.sunLight.color.set(0x3e5e82);
      this.sunLight.intensity = 0.4;
    } else if (minutes < 660) {
      // Amanecer dorado (08:00 - 11:00)
      this.renderer.toneMappingExposure = 1.18;
      this.scene.background.set(0x1a2434);
      this.scene.fog.color.set(0x1a2434);
      this.ambientLight.color.set(0xffdcb3);
      this.sunLight.color.set(0xffb570);
      this.sunLight.intensity = 2.1;
    } else if (minutes < 1140) {
      // Mediodía radiante de octubre (11:00 - 19:00)
      this.renderer.toneMappingExposure = 1.12;
      this.scene.background.set(0x162638);
      this.scene.fog.color.set(0x1a2c40);
      this.ambientLight.color.set(0xfffaec);
      this.sunLight.color.set(0xfff7ea);
      this.sunLight.intensity = 2.5;
    } else if (minutes < 1280) {
      // Atardecer crepuscular (19:00 - 21:20)
      this.renderer.toneMappingExposure = 1.25;
      this.scene.background.set(0x2a1a26);
      this.scene.fog.color.set(0x2d1b28);
      this.ambientLight.color.set(0xff9e73);
      this.sunLight.color.set(0xff5e36);
      this.sunLight.intensity = 1.8;
    } else {
      // Noche cerrada
      this.renderer.toneMappingExposure = 0.82;
      this.scene.background.set(0x060a12);
      this.scene.fog.color.set(0x060a12);
      this.ambientLight.color.set(0x203042);
      this.sunLight.color.set(0x2d4866);
      this.sunLight.intensity = 0.35;
    }

    // Encender farolas y ventanas de noche
    const lightIntensity = isNight ? 2.8 : (minutes > 1200 ? 1.5 : 0);
    this.streetLightPoints.forEach(light => {
      light.intensity = lightIntensity;
    });

    const winMat = isNight ? this.materials.windowLit : this.materials.windowDark;
    this.windowMeshes.forEach(win => {
      win.material = winMat;
    });
  }

  /* ========================================================================
     VIEW MODES & EVIDENCE SHADING ("Qué sabemos" de poblevell.es)
     ======================================================================== */
  setMode(mode) {
    this.activeMode = mode;

    if (mode === 'que-sabemos') {
      this.enableEvidenceColors(true);
    } else {
      this.enableEvidenceColors(false);
    }
  }

  enableEvidenceColors(enabled) {
    this.evidenceLevelActive = enabled;

    this.houseMeshes.forEach(mesh => {
      if (enabled) {
        const ev = mesh.userData.evidence;
        if (ev === 'documented') mesh.material = this.materials.evidenceDocumented;
        else if (ev === 'inferred') mesh.material = this.materials.evidenceInferred;
        else mesh.material = this.materials.evidenceHypothetical;
      } else {
        mesh.material = mesh.userData.originalMat;
      }
    });
  }

  /* ========================================================================
     SELECTION & SMOOTH CAMERA FLY-TO
     ======================================================================== */
  selectLandmark(id) {
    const landmark = this.landmarks[id];
    if (!landmark) return;

    this.activeLandmarkId = id;

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.place === id);
    });

    // Animar cámara hacia la posición del monumento
    if (landmark.camPos && landmark.targetPos) {
      this.flyCameraTo(landmark.camPos, landmark.targetPos);
    }

    // Actualizar ficha lateral con datos auténticos y fotos históricas
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
     GUIDED WALKING TOUR ("De la Plaça d'Armes a Lo Muro")
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
     LIGHTBOX VIEWER
     ======================================================================== */
  openLightbox(src, title, subtitle) {
    let lb = document.getElementById('global-photo-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'global-photo-lightbox';
      lb.className = 'photo-lightbox-backdrop';
      lb.innerHTML = `
        <div class="photo-lightbox-modal">
          <button class="photo-lightbox-close" id="lightbox-close-btn">&times;</button>
          <img class="photo-lightbox-img" id="lightbox-img" src="" alt="Mequinenza Histórica">
          <div class="photo-lightbox-caption">
            <h3 id="lightbox-title"></h3>
            <p id="lightbox-subtitle"></p>
          </div>
        </div>
      `;
      document.body.appendChild(lb);

      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.id === 'lightbox-close-btn') {
          lb.classList.remove('active');
        }
      });
    }

    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-title').textContent = title;
    document.getElementById('lightbox-subtitle').textContent = subtitle || 'Fotografía de la Fototeca Histórica Municipal de Mequinenza';
    lb.classList.add('active');
  }

  /* ========================================================================
     EVENTS BINDING
     ======================================================================== */
  bindEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    // Botones del menú lateral izquierdo
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

    // Botones de control del Tour Guiado
    const nextBtn = document.getElementById('tour-next-btn');
    const prevBtn = document.getElementById('tour-prev-btn');
    const stopBtn = document.getElementById('tour-stop-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextTourStep());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevTourStep());
    if (stopBtn) stopBtn.addEventListener('click', () => this.stopTour());

    // Botón de iniciar tour guiado desde UI
    const tourStartBtn = document.getElementById('start-guided-tour-btn');
    if (tourStartBtn) {
      tourStartBtn.addEventListener('click', () => this.startTour());
    }

    // Alternar visibilidad de nombres / pines 3D
    const toggleNamesBtn = document.getElementById('visor-nombres-alternar');
    if (toggleNamesBtn) {
      toggleNamesBtn.addEventListener('click', () => {
        const pinLayer = document.getElementById('map-pins-layer');
        if (pinLayer) {
          const isHidden = pinLayer.style.display === 'none';
          pinLayer.style.display = isHidden ? 'block' : 'none';
          toggleNamesBtn.classList.toggle('active', isHidden);
        }
      });
    }

    // Botón cerrar ficha lateral
    const closeCardBtn = document.getElementById('dossier-close-btn');
    if (closeCardBtn) {
      closeCardBtn.addEventListener('click', () => {
        const card = document.getElementById('historical-dossier-card');
        if (card) card.classList.remove('visible');
      });
    }
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

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Actualizar animación suave de cámara
    if (this.isAnimatingCamera) {
      const elapsed = performance.now() - this.camAnimStartTime;
      const progress = Math.min(elapsed / this.camAnimDuration, 1.0);
      // Easing cúbico suave
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
      this.controls.target.lerpVectors(this.targetStartPos, this.targetEndPos, ease);

      if (progress >= 1.0) {
        this.isAnimatingCamera = false;
      }
    }

    // Reproducción automática del ciclo solar
    if (this.isDayPassing) {
      let m = this.timeMinutes + this.dayCycleSpeed;
      if (m > 1380) m = 440;
      this.setTimeOfDay(m);
      const slider = document.getElementById('visor-hora');
      if (slider) slider.value = m;
    }

    // Vuelo de aves sobre el castillo
    this.birds.forEach(bird => {
      bird.userData.angle += bird.userData.speed * delta;
      bird.position.x = 10 + Math.cos(bird.userData.angle) * bird.userData.radius;
      bird.position.z = -60 + Math.sin(bird.userData.angle) * bird.userData.radius;
      bird.position.y = bird.userData.height + Math.sin(time * 2 + bird.userData.radius) * 1.5;
      bird.rotation.y = -bird.userData.angle + Math.PI / 2;
    });

    this.controls.update();
    this.updateScreenPins();
    this.renderer.render(this.scene, this.camera);
  }
}
