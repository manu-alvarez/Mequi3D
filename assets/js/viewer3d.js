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
    this.llautsGroup = new THREE.Group();
    this.streetPavementsGroup = new THREE.Group();

    // Textures & Materials
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.terrainMesh = null;
    this.terrainMeshes = [];
    this.terminoMesh = null;
    this.embalseMesh = null;
    this.riverMesh = null;
    this.houseMeshes = [];

    // Perspective & Street Mode State
    this.perspectiveMode = 'aerial'; // 'aerial' | 'street'
    this.photoBlendActive = false;
    this.photoBlendMode = 'fade'; // 'fade' | 'split'
    this.photoBlendValue = 50;
    this.activePhotoBlend = null;
    this.streetWaypoints = [];

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
    this.fovStart = 45;
    this.fovEnd = 45;
    this.camAnimStartTime = 0;
    this.camAnimDuration = 1800; // ms

    // Authentic Landmark Data with Aerial and Street-Level Photographic Alignments
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
        aerialCam: { pos: new THREE.Vector3(170, 310, 420), target: new THREE.Vector3(15, 75, 140), fov: 45 },
        streetCam: { pos: new THREE.Vector3(105, 95, 230), target: new THREE.Vector3(40, 75, 150), fov: 55 },
        thumb: 'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
        desc: 'Reconstrucción histórica en 3D del Poble Vell de Mequinenza, el Castillo medieval y la confluencia fluvial de los ríos Ebro y Segre antes del anegamiento por el embalse de Riba-roja en 1970.',
        historyFact: 'Identificada por Julio César como "Octogesa" en su De Bello Civili (49 a.C.). Durante más de dos mil años fue la llave estratégica del control del comercio y transporte fluvial de la Corona de Aragón.',
        photos: [
          'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals2.jpg',
          'assets/ref/generals/generals4.jpg',
          'assets/ref/generals/generals11.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/generals/generals1.jpg',
          year: '1963',
          title: 'Panorámica del Poble Vell desde el río Segre',
          subtitle: 'Vista de conjunto con el Castillo de los Moncada y la trama urbana',
          camPos: new THREE.Vector3(185, 160, 360),
          targetPos: new THREE.Vector3(25, 80, 150),
          fov: 48,
          features: [
            'Confluencia fluvial del Segre y el Ebro ("Aiguabarreig")',
            'Casas escalonadas de piedra caliza sobre la ladera',
            'Castillo dominando sobre el escarpe rocoso a 185 m',
            'Pretil de sillería de Lo Muro junto al cauce'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(95, 195, 290), target: new THREE.Vector3(40, 80, 150), fov: 45 },
        streetCam: { pos: new THREE.Vector3(38.0, 78.5, 155.0), target: new THREE.Vector3(12.0, 79.0, 142.0), fov: 55 },
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
        ],
        photoMatch: {
          src: 'assets/ref/pueblo/poble1.jpg',
          year: '1958',
          title: 'El corazón del Poble Vell: Plaça d\'Armes',
          subtitle: 'Vida cotidiana, tertulias y fachadas tradicionales',
          camPos: new THREE.Vector3(-3.5, 76.5, 172.0),
          targetPos: new THREE.Vector3(-1.0, 78.0, 142.0),
          fov: 55,
          features: [
            'Fachada porticada con arcadas de piedra de sillería',
            'Bar Sport en los bajos con mesas de terraza y persianas de tablillas',
            'Balcones de hierro forjado con contraventanas de madera',
            'Pavimento tradicional de canto rodado'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(130, 330, -80), target: new THREE.Vector3(-12, 245, -249.4), fov: 45 },
        streetCam: { pos: new THREE.Vector3(-8.0, 248.0, -235.0), target: new THREE.Vector3(-12.0, 252.0, -250.0), fov: 60 },
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
        ],
        photoMatch: {
          src: 'assets/ref/castillo/castell3.jpg',
          year: '1950',
          title: 'Patio de Armas y Almenas del Castillo',
          subtitle: 'Arquitectura militar defensiva de la Corona de Aragón',
          camPos: new THREE.Vector3(-8.0, 248.0, -235.0),
          targetPos: new THREE.Vector3(-12.0, 252.0, -250.0),
          fov: 60,
          features: [
            'Torre del Homenaje con muros de sillería de 2 metros de espesor',
            'Patio interior con arcadas góticas apuntadas',
            'Almenas defensivas y saeteras orientadas al paso del Ebro',
            'Vista aérea ininterrumpida de todo el valle'
          ]
        }
      },
      placa_armes: {
        id: 'placa_armes',
        title: 'Plaça d\'Armes (Plaza de Armas)',
        subtitle: 'El epicentro social del Poble Vell',
        era: 'Siglos XIX - XX',
        altitude: '76 m',
        evidence: 'Documentado',
        evidenceSource: 'Fototeca Municipal · Foto MUNI_plaza_512',
        pinPos: new THREE.Vector3(-5, 80, 168),
        camPos: new THREE.Vector3(-18, 98, 225),
        targetPos: new THREE.Vector3(-5, 76, 168),
        aerialCam: { pos: new THREE.Vector3(-18, 98, 225), target: new THREE.Vector3(-5, 76, 168), fov: 45 },
        streetCam: { pos: new THREE.Vector3(-3.5, 76.5, 172.0), target: new THREE.Vector3(-1.0, 78.0, 142.0), fov: 55 },
        thumb: 'assets/ref/pueblo/poble1.jpg',
        desc: 'La plaza central donde se encontraban el Bar Sport, bancos de madera, caserones señoriales con portales de arco de piedra y desde donde se divisaba la cúpula y el campanario de la iglesia.',
        historyFact: 'Lugar de tertulias de mineros y barqueros, bailes populares y pregones. El caserón del portal de arco tenía una planta de 277 m² y 3 alturas con tejado a cuatro aguas.',
        photos: [
          'assets/ref/pueblo/poble1.jpg',
          'assets/ref/pueblo/poble12.jpg',
          'assets/ref/pueblo/poble20.jpg',
          'assets/ref/pueblo/poble26.jpg',
          'assets/ref/festes/festes1.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/pueblo/poble1.jpg',
          year: '1958',
          title: 'Plaça d\'Armes y Fachada Norte',
          subtitle: 'Ángulo exacto desde la esquina sur mirando al Bar Sport',
          camPos: new THREE.Vector3(-3.5, 76.5, 172.0),
          targetPos: new THREE.Vector3(-1.0, 78.0, 142.0),
          fov: 55,
          features: [
            'Bar Sport en los bajos con persianas de madera y mesas de café',
            'Pórtico de piedra de sillería con arcadas de paso',
            'Balcones de hierro forjado con tiestos y contraventanas',
            'Pavimento tradicional de canto rodado'
          ]
        }
      },
      esglesia: {
        id: 'esglesia',
        title: 'Placeta Missa y l\'Església',
        subtitle: 'Iglesia Parroquial de Nuestra Señora de la Asunción',
        era: 'Siglos XVI - XVIII',
        altitude: '85 m',
        evidence: 'Documentado',
        evidenceSource: 'Archivo Parroquial · 39 fotografías catalogadas',
        pinPos: new THREE.Vector3(88, 85, 138),
        camPos: new THREE.Vector3(75, 125, 205),
        targetPos: new THREE.Vector3(88, 76, 138),
        aerialCam: { pos: new THREE.Vector3(75, 125, 205), target: new THREE.Vector3(88, 76, 138), fov: 45 },
        streetCam: { pos: new THREE.Vector3(80.0, 77.2, 155.0), target: new THREE.Vector3(88.0, 86.0, 136.0), fov: 60 },
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
        ],
        photoMatch: {
          src: 'assets/ref/esglesia/esglesia1.jpg',
          year: '1955',
          title: 'Placeta Missa y Campanario de la Asunción',
          subtitle: 'Perspectiva peatonal desde la escalinata barroca',
          camPos: new THREE.Vector3(80.0, 77.2, 155.0),
          targetPos: new THREE.Vector3(88.0, 86.0, 136.0),
          fov: 60,
          features: [
            'Torre campanario cuadrada de sillería de piedra caliza',
            'Escalinata de acceso donde se reunían las cofradías',
            'Portada de medio punto con remate escultórico',
            'Vista hacia los escarpes que ascienden al castillo'
          ]
        }
      },
      carrer_major: {
        id: 'carrer_major',
        title: 'Carrer Major (Calle Mayor)',
        subtitle: 'La arteria comercial y residencial principal',
        era: 'Siglos XVIII - XX',
        altitude: '80 m',
        evidence: 'Documentado',
        evidenceSource: 'Plano Parcelario ENHER · 13 casas catalogadas',
        pinPos: new THREE.Vector3(167.8, 85, 120.5),
        camPos: new THREE.Vector3(175, 130, 185),
        targetPos: new THREE.Vector3(167.8, 80, 120.5),
        aerialCam: { pos: new THREE.Vector3(175, 130, 185), target: new THREE.Vector3(167.8, 80, 120.5), fov: 45 },
        streetCam: { pos: new THREE.Vector3(172.5, 80.5, 138.0), target: new THREE.Vector3(167.0, 81.5, 110.0), fov: 50 },
        thumb: 'assets/ref/pueblo/poble2.jpg',
        desc: 'Calle empedrada flanqueada por comercios, ultramarinos, barberías y talleres artesanales que comunicaba el corazón del pueblo con el camino hacia la comarca del Segre.',
        historyFact: 'Por ella discurrían las procesiones de Santa Agatoclia y el bullicio de los días de mercado con carros cargados de productos de la huerta del Ebro.',
        photos: [
          'assets/ref/pueblo/poble2.jpg',
          'assets/ref/pueblo/poble5.jpg',
          'assets/ref/pueblo/poble11.jpg',
          'assets/ref/pueblo/poble19.jpg',
          'assets/ref/pueblo/poble25.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/pueblo/poble2.jpg',
          year: '1962',
          title: 'Carrer Major: Eje comercial y vecinal',
          subtitle: 'Perspectiva histórica a pie de calle con comercios y farolas',
          camPos: new THREE.Vector3(172.5, 80.5, 138.0),
          targetPos: new THREE.Vector3(167.0, 81.5, 110.0),
          fov: 50,
          features: [
            'Comercios con toldos de lona y rótulos pintados a mano',
            'Alineación de 13 casas señoriales de tres alturas',
            'Farolas de brazo de hierro fundido ancladas en fachada',
            'Escalones de piedra en los portales para evitar aguas de escorrentía'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(205, 115, 155), target: new THREE.Vector3(189.9, 75, 108.5), fov: 45 },
        streetCam: { pos: new THREE.Vector3(198.0, 76.5, 122.0), target: new THREE.Vector3(188.0, 77.0, 102.0), fov: 55 },
        thumb: 'assets/ref/ajuntament/ajuntament1.jpg',
        desc: 'Edificio consistorial de piedra con balconada oficial, reloj y salón de plenos donde se gestionaba la vida política, las licencias de sirga, las minas y la vida comunitaria.',
        historyFact: 'En sus dependencias se guardaron los libros de actas y los padrones que sirvieron para organizar el traslado ordenado de la población hacia el "Pueblo Nuevo".',
        photos: [
          'assets/ref/ajuntament/ajuntament1.jpg',
          'assets/ref/ajuntament/ajuntament2.jpg',
          'assets/ref/ajuntament/ajuntament5.jpg',
          'assets/ref/ajuntament/ajuntament7.jpg',
          'assets/ref/ajuntament/ajuntament9.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/ajuntament/ajuntament1.jpg',
          year: '1960',
          title: 'Casa de la Vila (Ayuntamiento Histórico)',
          subtitle: 'Fachada con balconada consistorial y porches',
          camPos: new THREE.Vector3(198.0, 76.5, 122.0),
          targetPos: new THREE.Vector3(188.0, 77.0, 102.0),
          fov: 55,
          features: [
            'Edificio noble de sillería y arquería en planta baja',
            'Balcón consistorial para pregones y celebraciones',
            'Reloj municipal y campana de aviso',
            'Mirador abierto hacia el cauce del Ebro'
          ]
        }
      },
      carrer_saragossa: {
        id: 'carrer_saragossa',
        title: 'Carrer Saragossa (Calle Zaragoza)',
        subtitle: 'Calle histórica residencial con 53 casas',
        era: 'Siglos XIX - XX',
        altitude: '78 m',
        evidence: 'Documentado',
        evidenceSource: 'Plano Parcelario y Padrón de 1965 (53 casas)',
        pinPos: new THREE.Vector3(-75, 80, 175),
        camPos: new THREE.Vector3(-145, 128, 220),
        targetPos: new THREE.Vector3(-75, 76, 175),
        aerialCam: { pos: new THREE.Vector3(-145, 128, 220), target: new THREE.Vector3(-75, 76, 175), fov: 45 },
        streetCam: { pos: new THREE.Vector3(-65.0, 78.0, 185.0), target: new THREE.Vector3(-85.0, 83.5, 165.0), fov: 55 },
        thumb: 'assets/ref/pueblo/poble3.jpg',
        desc: 'Una de las calles más pobladas del casco histórico, con 53 casas alineadas en pendiente. Sus portales de medio punto y bodegas de piedra albergaban a numerosas familias mineras.',
        historyFact: 'Esta calle concentraba talleres de carpintería de ribera, almacenes de aperos y varias tabernas frecuentadas por los sirgadores que trabajaban en el río.',
        photos: [
          'assets/ref/pueblo/poble3.jpg',
          'assets/ref/pueblo/poble8.jpg',
          'assets/ref/pueblo/poble14.jpg',
          'assets/ref/pueblo/poble22.jpg',
          'assets/ref/pueblo/poble30.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/pueblo/poble3.jpg',
          year: '1964',
          title: 'Carrer Saragossa y Baixada de l\'Abeurador',
          subtitle: 'Perspectiva peatonal del callejón escalonado',
          camPos: new THREE.Vector3(-65.0, 78.0, 185.0),
          targetPos: new THREE.Vector3(-85.0, 83.5, 165.0),
          fov: 55,
          features: [
            'Callejón con tramos escalonados adaptados a la ladera',
            'Casas de mineros y sirgadores con bodegas frescas',
            'Portales en arco y ventanas con rejería tradicional',
            'Conexión directa con la senda del Castillo'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(110, 92, 240), target: new THREE.Vector3(75, 68, 185), fov: 45 },
        streetCam: { pos: new THREE.Vector3(84.0, 70.0, 195.0), target: new THREE.Vector3(42.0, 69.5, 185.0), fov: 55 },
        thumb: 'assets/ref/generals/generals1.jpg',
        desc: 'Monumento y paseo singular de Mequinenza: pretil de dos hiladas de grandes bloques de piedra labrada, albardilla y repisa hacia el agua, que protegía el pueblo de las crecidas del Ebro.',
        historyFact: 'Lugar de recreo ineludible donde los mequinenzanos paseaban al atardecer observando el tráfico de barcazas de carbón y las maniobras de amarre.',
        photos: [
          'assets/ref/generals/generals1.jpg',
          'assets/ref/generals/generals3.jpg',
          'assets/ref/llauts/llauts1.jpg',
          'assets/ref/llauts/llauts2.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/llauts/llauts1.jpg',
          year: '1959',
          title: 'Lo Muro y los Llaüts en el Río Ebro',
          subtitle: 'Barcazas tradicionales cargadas de lignito junto al pretil',
          camPos: new THREE.Vector3(84.0, 70.0, 195.0),
          targetPos: new THREE.Vector3(42.0, 69.5, 185.0),
          fov: 55,
          features: [
            'Pretil de sillería de dos hiladas de piedra caliza labrada',
            'Llaüts amarrados con maromas de cáñamo a las argollas',
            'Embarcadero y rampa de sirga hacia la confluencia fluvial',
            'Paseo arbolado y vistas a la ribera del Ebro'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(65, 80, 235), target: new THREE.Vector3(45, 65, 195), fov: 45 },
        streetCam: { pos: new THREE.Vector3(62.0, 69.0, 198.0), target: new THREE.Vector3(45.0, 65.0, 195.0), fov: 55 },
        thumb: 'assets/ref/llauts/llauts1.jpg',
        desc: 'Las emblemáticas embarcaciones tradicionales de madera de Mequinenza, de hasta 30 metros de eslora y 30 toneladas de carga, que transportaban el carbón río abajo hacia el Mediterráneo.',
        historyFact: 'El regreso a contracorriente se realizaba a pie remolcando el barco con maromas desde la orilla: el camino de sirga ("camí de sirga"), hazaña heroica de los barqueros mequinenzanos.',
        photos: [
          'assets/ref/llauts/llauts1.jpg',
          'assets/ref/llauts/llauts2.jpg',
          'assets/ref/llauts/llauts3.jpg',
          'assets/ref/llauts/llauts4.jpg',
          'assets/ref/llauts/llauts5.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/llauts/llauts2.jpg',
          year: '1955',
          title: 'Sirgadores remolcando el Llaüt río arriba',
          subtitle: 'El esfuerzo épico del Camí de Sirga',
          camPos: new THREE.Vector3(62.0, 69.0, 198.0),
          targetPos: new THREE.Vector3(45.0, 65.0, 195.0),
          fov: 55,
          features: [
            'Embarcación de madera de pino y roble del país con proa curvada',
            'Bodega abierta con cargamento de carbón de lignito',
            'Maroma de cáñamo atada al mástil para el tiro desde la orilla',
            'Maniobras de remo en las corrientes del río Ebro'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(355, 125, 50), target: new THREE.Vector3(397, 66, -87), fov: 45 },
        streetCam: { pos: new THREE.Vector3(368.0, 72.5, 15.0), target: new THREE.Vector3(397.0, 71.0, -87.0), fov: 55 },
        thumb: 'assets/ref/generals/generals4.jpg',
        desc: 'Viaducto de arcos de piedra y tramos metálicos que cruzaba el curso del río Segre en su desembocadura al Ebro, conectando la villa con Lérida y el ferrocarril.',
        historyFact: 'Dinamitado durante los combates de la Batalla del Ebro en 1938 para frenar el avance bélico y reconstruido posteriormente por su vital importancia logística.',
        photos: [
          'assets/ref/generals/generals4.jpg',
          'assets/ref/generals/generals11.jpg',
          'assets/ref/generals/generals18.jpg',
          'assets/ref/generals/generals25.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/generals/generals4.jpg',
          year: '1952',
          title: 'Viaducto del Segre y Confluencia',
          subtitle: 'Perspectiva peatonal hacia el pueblo y el castillo',
          camPos: new THREE.Vector3(368.0, 72.5, 15.0),
          targetPos: new THREE.Vector3(397.0, 71.0, -87.0),
          fov: 55,
          features: [
            'Arcos de piedra y tablero de paso',
            'Punto de confluencia de las aguas verdosas del Segre con el Ebro',
            'Perspectiva del pueblo y castillo alzándose sobre la ribera'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(-270, 118, 250), target: new THREE.Vector3(-342, 88, 160), fov: 45 },
        streetCam: { pos: new THREE.Vector3(-315.0, 89.5, 175.0), target: new THREE.Vector3(-342.0, 91.0, 160.0), fov: 55 },
        thumb: 'assets/ref/elements/elements1.jpg',
        desc: 'Magnífico edificio escolar de estilo novecentista aragonés promovido por la benefactora mequinenzana María Quintana. Por su cota de altura, se salvó del nivel de las aguas del embalse.',
        historyFact: 'Hoy alberga los prestigiosos Museos de Mequinenza (Museo de la Mina, Museo de la Historia y Museo del Pasado Prehistórico).',
        photos: [
          'assets/ref/elements/elements1.jpg',
          'assets/ref/elements/elements2.jpg',
          'assets/ref/pueblo/poble10.jpg',
          'assets/ref/competicions/competicions1.jpg'
        ],
        photoMatch: {
          src: 'assets/ref/elements/elements1.jpg',
          year: '1930',
          title: 'Fachada Principal del Grupo Escolar',
          subtitle: 'Arquitectura novecentista de Manuel de Goytia',
          camPos: new THREE.Vector3(-315.0, 89.5, 175.0),
          targetPos: new THREE.Vector3(-342.0, 91.0, 160.0),
          fov: 55,
          features: [
            'Pabellón central con alero tallado de madera',
            'Grandes ventanales para iluminación natural de aulas',
            'Patio de recreo arbolado y escalinata de acceso'
          ]
        }
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
        aerialCam: { pos: new THREE.Vector3(0, 1350, 1), target: new THREE.Vector3(0, 100, 0), fov: 45 },
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

    // Composición enriquecida de las calles con fotos históricas como referencia
    this.createHistoricLlauts();
    this.createStreetPavements();
    this.createStreetWaypoints();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    // Cielo atmosférico cálido del valle del Ebro
    this.scene.background = new THREE.Color(0x8faec7);
    this.scene.fog = new THREE.FogExp2(0xc4baa8, 0.00032);
    this.scene.add(this.worldGroup);
    this.worldGroup.add(this.modelsGroup);
    this.worldGroup.add(this.waterGroup);
    this.worldGroup.add(this.llautsGroup);
    this.worldGroup.add(this.streetPavementsGroup);

    // Cúpula celeste con horizonte aragonés difuminado
    this.createSkyDome();
  }

  createSkyDome() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#3a6c94'); // Cenit azul mediterráneo
    grad.addColorStop(0.35, '#6a96b8');
    grad.addColorStop(0.65, '#a4c2d6');
    grad.addColorStop(0.88, '#d4c7b2'); // Bruma cálida caliza sobre el horizonte
    grad.addColorStop(1.0, '#dfd3be');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyGeo = new THREE.SphereGeometry(18000, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  createGroundDetailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8c7d6c';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.75));
    }
    ctx.putImageData(imgData, 0, 0);

    const pebbleColors = ['#a89985', '#6e6152', '#b3a492', '#5a4f42', '#918270'];
    for (let j = 0; j < 350; j++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const pr = 1.5 + Math.random() * 3.5;
      ctx.fillStyle = pebbleColors[Math.floor(Math.random() * pebbleColors.length)];
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.generateMipmaps = true;
    return tex;
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
    this.renderer.toneMappingExposure = 0.96;
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
    // Luz de cielo mediterránea y rebote de caliza del valle del Ebro
    this.hemiLight = new THREE.HemisphereLight(0xd4e5f2, 0x7a6b57, 0.75);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xfff6ec, 0.22);
    this.scene.add(this.ambientLight);

    // Sol direccional principal cálido calibrado para sombras fotográficas suaves
    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.75);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1600;
    this.sunLight.shadow.camera.left = -320;
    this.sunLight.shadow.camera.right = 320;
    this.sunLight.shadow.camera.top = 320;
    this.sunLight.shadow.camera.bottom = -320;
    this.sunLight.shadow.bias = -0.00035;
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.radius = 2.0;

    this.sunLight.target.position.set(35, 75, 150);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
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

            // 1. Filtrar mallas de prueba o duplicadas de Lo Muro (elimina el bloque negro invasivo y la rampa sin terminar en el agua)
            if (m.id === 'lo_muro') {
              const n = child.name || '';
              if (n.startsWith('LMV8_Casa_final') ||
                  n.startsWith('LMV8_Carretera') ||
                  n.startsWith('LMV8_Acceso_puente')) {
                child.visible = false;
                return;
              }
            }

            if (m.isTerrain) {
              this.terrainMeshes.push(child);
              this.terrainMesh = child;
              const detailTex = this.createGroundDetailTexture();
              detailTex.wrapS = THREE.RepeatWrapping;
              detailTex.wrapT = THREE.RepeatWrapping;
              detailTex.repeat.set(90, 90);

              const terrainMat = new THREE.MeshStandardMaterial({
                map: this.textures.suelo_1965,
                roughness: 0.96,
                metalness: 0.01
              });

              terrainMat.onBeforeCompile = (shader) => {
                shader.uniforms.detailMap = { value: detailTex };
                shader.fragmentShader = `
                  uniform sampler2D detailMap;
                ` + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <map_fragment>',
                  `
                  #include <map_fragment>
                  vec4 microGrain = texture2D(detailMap, vUv * 90.0);
                  diffuseColor.rgb *= (0.75 + 0.5 * microGrain.rgb);
                  `
                );
              };

              child.material = terrainMat;
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

              // Variación cromática auténtica de tejas árabes y revocos tradicionales
              if (child.material) {
                const matName = child.material.name || '';
                if (matName.includes('Teja')) {
                  const roofTones = [
                    { color: new THREE.Color(0x944a2e), roughness: 0.94 }, // Teja vieja tradicional tostada
                    { color: new THREE.Color(0x743d26), roughness: 0.96 }, // Teja oscura pátina carbón
                    { color: new THREE.Color(0xa8623a), roughness: 0.92 }, // Teja ocre asoleada
                    { color: new THREE.Color(0x863e26), roughness: 0.95 }, // Teja rojiza apagada
                    { color: new THREE.Color(0x623622), roughness: 0.98 }, // Teja pátina hollín
                    { color: new THREE.Color(0x9e5634), roughness: 0.93 }  // Teja arcilla cocida
                  ];
                  const hash = Math.abs(Math.sin((child.id || 1) * 12.9898 + (child.position.x || 0) * 4.14159)) * 10000;
                  const selectedTone = roofTones[Math.floor(hash) % roofTones.length];
                  const clonedMat = child.material.clone();
                  clonedMat.color.copy(selectedTone.color);
                  clonedMat.roughness = selectedTone.roughness;
                  clonedMat.metalness = 0.01;
                  child.material = clonedMat;
                } else if (matName.includes('Interior_hundido')) {
                  child.material.roughness = 0.98;
                  child.material.color = new THREE.Color(0x16130f);
                } else if (matName.includes('Madera')) {
                  child.material.roughness = 0.96;
                  child.material.color = new THREE.Color(0x3e3024);
                } else if (matName.includes('Revoco') || matName.includes('Mamposteria')) {
                  child.material.roughness = 0.95;
                  child.material.metalness = 0.01;
                }
              }
            } else if (m.id === 'mobiliario_plaza') {
              if (child.material) {
                child.material.roughness = 0.94;
                child.material.side = THREE.DoubleSide;
                const n = child.name || '';
                if (n.includes('hoja')) {
                  child.material.color.multiplyScalar(0.72); // Tonos oliva natural
                }
              }
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
     DETALLES HISTÓRICOS A RAS DE SUELO (Llaüts en Lo Muro y Empedrado de Calles)
     ======================================================================== */
  createHistoricLlauts() {
    this.llautsGroup.clear();

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d291a,
      roughness: 0.85,
      metalness: 0.05
    });

    const gunwaleMat = new THREE.MeshStandardMaterial({
      color: 0x22170e,
      roughness: 0.9,
      metalness: 0.1
    });

    const coalMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.96,
      metalness: 0.15
    });

    const ropeMat = new THREE.LineBasicMaterial({
      color: 0xc4b28c,
      linewidth: 2
    });

    const buildLlaut = (name, x, y, z, rotY, scale = 1) => {
      const llaut = new THREE.Group();
      llaut.name = `llaut_${name}`;

      // 1. Casco de madera con doble proa tradicional curvada
      const hullGeo = new THREE.BoxGeometry(16 * scale, 1.8 * scale, 3.8 * scale, 8, 2, 4);
      const posAttr = hullGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);

        const factor = 1.0 - Math.min(Math.abs(vx) / (8 * scale), 0.85);
        posAttr.setZ(i, vz * factor);

        if (Math.abs(vx) > 5 * scale) {
          posAttr.setY(i, vy + Math.pow((Math.abs(vx) - 5 * scale) / 3, 2) * 0.45);
        }
      }
      hullGeo.computeVertexNormals();

      const hullMesh = new THREE.Mesh(hullGeo, woodMat);
      hullMesh.castShadow = true;
      hullMesh.receiveShadow = true;
      llaut.add(hullMesh);

      // 2. Borda superior de refuerzo
      const rimGeo = new THREE.BoxGeometry(16.2 * scale, 0.25 * scale, 3.9 * scale);
      const rimMesh = new THREE.Mesh(rimGeo, gunwaleMat);
      rimMesh.position.y = 0.9 * scale;
      llaut.add(rimMesh);

      // 3. Montones de carbón de lignito en la bodega
      const coalMound1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 * scale, 1), coalMat);
      coalMound1.position.set(-2 * scale, 0.6 * scale, 0);
      coalMound1.scale.set(2.2, 0.7, 1.4);
      coalMound1.castShadow = true;
      llaut.add(coalMound1);

      const coalMound2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 * scale, 1), coalMat);
      coalMound2.position.set(2.5 * scale, 0.6 * scale, 0);
      coalMound2.scale.set(1.8, 0.65, 1.3);
      coalMound2.castShadow = true;
      llaut.add(coalMound2);

      // 4. Mástil para la maroma del camí de sirga
      const mastGeo = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 4.5 * scale, 8);
      const mastMesh = new THREE.Mesh(mastGeo, gunwaleMat);
      mastMesh.position.set(-1 * scale, 2.2 * scale, 0);
      llaut.add(mastMesh);

      // 5. Posicionar sobre el agua junto a Lo Muro
      llaut.position.set(x, y, z);
      llaut.rotation.y = rotY;
      this.llautsGroup.add(llaut);

      // 6. Maroma de amarre hacia el pretil de Lo Muro
      const ropePoints = [
        new THREE.Vector3(x, y + 0.8 * scale, z),
        new THREE.Vector3(x + 5, 68.2, z - 8)
      ];
      const ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
      const ropeLine = new THREE.Line(ropeGeo, ropeMat);
      this.llautsGroup.add(ropeLine);
    };

    // 3 Llaüts emblemáticos documentados en la fototeca amarrados junto a Lo Muro
    buildLlaut('La_Mequinenzana', 68, 60.4, 196, -0.15, 1.05);
    buildLlaut('Santa_Agatoclia', 44, 60.4, 191, 0.08, 0.95);
    buildLlaut('El_Segre', 92, 60.4, 202, -0.25, 1.1);
  }

  createStreetPavements() {
    this.streetPavementsGroup.clear();

    // Generar textura procedural de canto rodado tradicional (adoquines de río del Ebro)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#6e6151';
    ctx.fillRect(0, 0, 512, 512);

    const stoneColors = ['#9c8f7d', '#b0a390', '#7d7060', '#bfb2a0', '#8a7e6e'];
    for (let y = 8; y < 512; y += 18) {
      const offsetX = (y % 36 === 0) ? 9 : 0;
      for (let x = 8 + offsetX; x < 512; x += 18) {
        ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
        ctx.beginPath();
        const rw = 12 + Math.random() * 4;
        const rh = 10 + Math.random() * 4;
        ctx.ellipse(x, y, rw / 2, rh / 2, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4a3f33';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const pavementTex = new THREE.CanvasTexture(canvas);
    pavementTex.wrapS = THREE.RepeatWrapping;
    pavementTex.wrapT = THREE.RepeatWrapping;
    pavementTex.repeat.set(6, 6);

    const pavementMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      roughness: 0.92,
      metalness: 0.05
    });

    // 1. Pavimento de la Plaça d'Armes
    const plazaPave = new THREE.Mesh(new THREE.PlaneGeometry(38, 48), pavementMat);
    plazaPave.rotation.x = -Math.PI / 2;
    plazaPave.position.set(-5, 75.25, 166);
    plazaPave.receiveShadow = true;
    this.streetPavementsGroup.add(plazaPave);

    // 2. Pavimento del Carrer Major
    const majorPave = new THREE.Mesh(new THREE.PlaneGeometry(9, 72), pavementMat);
    majorPave.rotation.x = -Math.PI / 2;
    majorPave.rotation.z = 0.12;
    majorPave.position.set(170, 79.55, 126);
    majorPave.receiveShadow = true;
    this.streetPavementsGroup.add(majorPave);

    // 3. Paseo de Lo Muro
    const muroPave = new THREE.Mesh(new THREE.PlaneGeometry(8, 110), pavementMat);
    muroPave.rotation.x = -Math.PI / 2;
    muroPave.rotation.z = -0.18;
    muroPave.position.set(72, 68.25, 186);
    muroPave.receiveShadow = true;
    this.streetPavementsGroup.add(muroPave);

    // 4. Callejón empinado de Carrer Saragossa
    const saragossaPave = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 55), pavementMat);
    saragossaPave.rotation.x = -Math.PI / 2;
    saragossaPave.rotation.z = -0.35;
    saragossaPave.position.set(-72, 77.25, 175);
    saragossaPave.receiveShadow = true;
    this.streetPavementsGroup.add(saragossaPave);
  }

  createStreetWaypoints() {
    this.streetWaypoints = [
      { id: 'wp_placa', name: 'Plaça d\'Armes (Centro)', pos: new THREE.Vector3(-3.5, 76.5, 168.0), target: new THREE.Vector3(-1.0, 78.0, 142.0), streetId: 'placa_armes' },
      { id: 'wp_bar_sport', name: 'Bar Sport y Porche', pos: new THREE.Vector3(10.0, 76.5, 160.0), target: new THREE.Vector3(2.0, 77.5, 155.0), streetId: 'placa_armes' },
      { id: 'wp_carrer_major_in', name: 'Carrer Major (Entrada comercial)', pos: new THREE.Vector3(172.5, 80.5, 138.0), target: new THREE.Vector3(167.0, 81.5, 110.0), streetId: 'carrer_major' },
      { id: 'wp_carrer_major_out', name: 'Carrer Major (Salida al Segre)', pos: new THREE.Vector3(166.0, 81.5, 108.0), target: new THREE.Vector3(180.0, 79.0, 90.0), streetId: 'carrer_major' },
      { id: 'wp_esglesia', name: 'Placeta Missa y Escalinata', pos: new THREE.Vector3(80.0, 77.2, 155.0), target: new THREE.Vector3(88.0, 86.0, 136.0), streetId: 'esglesia' },
      { id: 'wp_saragossa', name: 'Carrer Saragossa (Bodegas)', pos: new THREE.Vector3(-65.0, 78.0, 185.0), target: new THREE.Vector3(-85.0, 83.5, 165.0), streetId: 'carrer_saragossa' },
      { id: 'wp_lo_muro', name: 'Lo Muro y Llaüts del Ebro', pos: new THREE.Vector3(84.0, 70.0, 195.0), target: new THREE.Vector3(42.0, 69.5, 185.0), streetId: 'lo_muro' },
      { id: 'wp_ca_la_vila', name: 'Porches de Ca la Vila', pos: new THREE.Vector3(198.0, 76.5, 122.0), target: new THREE.Vector3(188.0, 77.0, 102.0), streetId: 'ca_la_vila' }
    ];
  }
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

    // Orientar el sol centrando su objetivo en el Poble Vell
    const targetX = 35;
    const targetY = 75;
    const targetZ = 150;
    if (this.sunLight && this.sunLight.target) {
      this.sunLight.target.position.set(targetX, targetY, targetZ);
      this.sunLight.position.set(
        targetX + Math.cos(sunAngle) * 360,
        targetY + Math.max(90, Math.sin(sunAngle) * 440),
        targetZ + 180 - dayProgress * 140
      );
    }

    if (minutes < 480) {
      // Noche
      this.renderer.toneMappingExposure = 0.75;
      this.scene.background.set(0x0a121c);
      this.scene.fog.color.set(0x0a121c);
      this.ambientLight.color.set(0x202d3d);
      this.ambientLight.intensity = 0.2;
      this.hemiLight.intensity = 0.3;
      this.sunLight.color.set(0x354e6b);
      this.sunLight.intensity = 0.25;
    } else if (minutes < 660) {
      // Amanecer dorado
      this.renderer.toneMappingExposure = 0.96;
      this.scene.background.set(0x9caec0);
      this.scene.fog.color.set(0xb8aa9a);
      this.ambientLight.color.set(0xffd5a8);
      this.ambientLight.intensity = 0.22;
      this.hemiLight.intensity = 0.6;
      this.hemiLight.color.set(0xc8daf0);
      this.sunLight.color.set(0xffab62);
      this.sunLight.intensity = 1.6;
    } else if (minutes < 1140) {
      // Mediodía radiante mediterráneo
      this.renderer.toneMappingExposure = 0.94;
      this.scene.background.set(0x8faec7);
      this.scene.fog.color.set(0xc4baa8);
      this.ambientLight.color.set(0xfff7ea);
      this.ambientLight.intensity = 0.24;
      this.hemiLight.intensity = 0.75;
      this.hemiLight.color.set(0xd4e5f2);
      this.sunLight.color.set(0xfff4e0);
      this.sunLight.intensity = 1.75;
    } else if (minutes < 1280) {
      // Atardecer cálido aragonés
      this.renderer.toneMappingExposure = 0.98;
      this.scene.background.set(0xb3826f);
      this.scene.fog.color.set(0xb87f6b);
      this.ambientLight.color.set(0xff8850);
      this.ambientLight.intensity = 0.22;
      this.hemiLight.intensity = 0.6;
      this.sunLight.color.set(0xff5a2e);
      this.sunLight.intensity = 1.65;
    } else {
      // Noche cerrada
      this.renderer.toneMappingExposure = 0.72;
      this.scene.background.set(0x060c14);
      this.scene.fog.color.set(0x060c14);
      this.ambientLight.color.set(0x182432);
      this.ambientLight.intensity = 0.18;
      this.hemiLight.intensity = 0.25;
      this.sunLight.color.set(0x22364c);
      this.sunLight.intensity = 0.2;
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
     NAVEGACIÓN Y VUELO DE CÁMARA SUAVE (Aéreo y A Pie de Calle)
     ======================================================================== */
  selectLandmark(id) {
    const landmark = this.landmarks[id];
    if (!landmark) return;

    this.activeLandmarkId = id;

    // Actualizar botones de navegación en sidebar
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.place === id);
    });

    // Decidir posición de cámara y FOV según el modo de perspectiva activo
    let camPos = landmark.camPos;
    let targetPos = landmark.targetPos;
    let targetFov = 45;

    if (this.perspectiveMode === 'street' && landmark.streetCam) {
      camPos = landmark.streetCam.pos;
      targetPos = landmark.streetCam.target;
      targetFov = landmark.streetCam.fov || 55;
    } else if (landmark.aerialCam) {
      camPos = landmark.aerialCam.pos;
      targetPos = landmark.aerialCam.target;
      targetFov = landmark.aerialCam.fov || 45;
    }

    // Vuelo suave de cámara
    if (camPos && targetPos) {
      this.flyCameraTo(camPos, targetPos, 1800, targetFov);
    }

    // Actualizar ficha lateral
    this.updateDossierCard(landmark);
  }

  flyCameraTo(targetCamPos, targetControlsPos, duration = 1800, targetFov = null) {
    this.isAnimatingCamera = true;
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetCamPos);
    this.targetStartPos.copy(this.controls.target);
    this.targetEndPos.copy(targetControlsPos);
    this.fovStart = this.camera.fov;
    this.fovEnd = targetFov || (this.perspectiveMode === 'street' ? 55 : 45);
    this.camAnimStartTime = performance.now();
    this.camAnimDuration = duration;
  }

  setPerspectiveMode(mode) {
    this.perspectiveMode = mode;

    const aerialBtn = document.getElementById('btn-view-aerial');
    const streetBtn = document.getElementById('btn-view-street');
    if (aerialBtn) aerialBtn.classList.toggle('active', mode === 'aerial');
    if (streetBtn) streetBtn.classList.toggle('active', mode === 'street');

    const streetBar = document.getElementById('street-quick-select-bar');
    if (streetBar) {
      streetBar.style.display = mode === 'street' ? 'flex' : 'none';
    }

    if (mode === 'street') {
      // Ajuste de límites de OrbitControls para una experiencia cómoda a nivel peatonal
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 80;
      this.controls.maxPolarAngle = Math.PI * 0.54; // Permitir mirar hacia fachadas altas y campanario
      this.controls.minPolarAngle = Math.PI * 0.12;
    } else {
      // Modo aéreo panorámico
      this.controls.minDistance = 15;
      this.controls.maxDistance = 850;
      this.controls.maxPolarAngle = Math.PI * 0.48; // Evitar pasar por debajo del terreno
      this.controls.minPolarAngle = 0.05;
    }

    if (this.activeLandmarkId && this.landmarks[this.activeLandmarkId]) {
      this.selectLandmark(this.activeLandmarkId);
    }
  }

  walkToStreetWaypoint(wpId) {
    const wp = this.streetWaypoints.find(w => w.id === wpId);
    if (!wp) return;

    this.perspectiveMode = 'street';
    this.setPerspectiveMode('street');

    if (wp.streetId) {
      this.activeLandmarkId = wp.streetId;
      document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.place === wp.streetId);
      });
      if (this.landmarks[wp.streetId]) {
        this.updateDossierCard(this.landmarks[wp.streetId]);
      }
    }

    this.flyCameraTo(wp.pos, wp.target, 1600, 58);
  }

  /* ========================================================================
     COMPOSICIÓN CON FOTOGRAFÍA HISTÓRICA (Photo Blend & Split-Wipe)
     ======================================================================== */
  openPhotoBlend(landmarkId) {
    const id = landmarkId || this.activeLandmarkId || 'placa_armes';
    let landmark = this.landmarks[id];
    if (!landmark || !landmark.photoMatch) {
      landmark = this.landmarks['placa_armes'];
    }
    if (!landmark || !landmark.photoMatch) return;

    const pm = landmark.photoMatch;
    this.activePhotoBlend = pm;
    this.photoBlendActive = true;

    // Alinear cámara 3D con la perspectiva y FOV exactos de la foto original
    this.flyCameraTo(pm.camPos, pm.targetPos, 1400, pm.fov || 55);

    // Contenedor HUD
    const hud = document.getElementById('photo-blend-hud');
    if (!hud) return;

    const img = document.getElementById('blend-photo-img');
    const titleEl = document.getElementById('blend-photo-title');
    const subEl = document.getElementById('blend-photo-sub');
    const yearEl = document.getElementById('blend-photo-year');
    const featuresEl = document.getElementById('blend-features-list');

    if (img) img.src = pm.src;
    if (titleEl) titleEl.textContent = pm.title;
    if (subEl) subEl.textContent = pm.subtitle;
    if (yearEl) yearEl.textContent = `Archivo Histórico · Año ${pm.year}`;

    if (featuresEl) {
      featuresEl.innerHTML = '';
      (pm.features || []).forEach(feat => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="feat-bullet">✓</span> ${feat}`;
        featuresEl.appendChild(li);
      });
    }

    // Configurar modo y valor por defecto (50%)
    this.setPhotoBlendMode(this.photoBlendMode || 'fade');
    const slider = document.getElementById('blend-opacity-slider');
    if (slider) slider.value = 50;
    this.updatePhotoBlendVisual(50);

    hud.classList.add('active');
  }

  closePhotoBlend() {
    this.photoBlendActive = false;
    this.activePhotoBlend = null;
    const hud = document.getElementById('photo-blend-hud');
    if (hud) hud.classList.remove('active');
  }

  setPhotoBlendMode(mode) {
    this.photoBlendMode = mode;
    const btnFade = document.getElementById('blend-mode-fade');
    const btnSplit = document.getElementById('blend-mode-split');
    const frame = document.getElementById('photo-blend-viewport-frame');

    if (btnFade) btnFade.classList.toggle('active', mode === 'fade');
    if (btnSplit) btnSplit.classList.toggle('active', mode === 'split');
    if (frame) frame.classList.toggle('split-mode', mode === 'split');

    this.updatePhotoBlendVisual(this.photoBlendValue || 50);
  }

  updatePhotoBlendVisual(val) {
    this.photoBlendValue = val;
    const sliderVal = document.getElementById('blend-slider-val');
    const photoImg = document.getElementById('blend-photo-img');
    const divider = document.getElementById('blend-split-divider');

    if (sliderVal) sliderVal.textContent = `${val}%`;

    if (this.photoBlendMode === 'fade') {
      if (photoImg) {
        photoImg.style.opacity = (val / 100).toString();
        photoImg.style.clipPath = 'none';
      }
      if (divider) divider.style.display = 'none';
    } else {
      // Split Wipe Mode
      if (photoImg) {
        photoImg.style.opacity = '1';
        photoImg.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
      }
      if (divider) {
        divider.style.display = 'block';
        divider.style.left = `${val}%`;
      }
    }
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

    // Acciones de calle y composición fotográfica en la ficha
    const blendBtn = document.getElementById('dossier-photo-blend-btn');
    if (blendBtn) {
      const hasPhotoMatch = !!data.photoMatch;
      blendBtn.style.display = hasPhotoMatch ? 'inline-flex' : 'none';
      if (hasPhotoMatch) {
        blendBtn.innerHTML = `<span>📷</span> <span>Componer con Foto Real (${data.photoMatch.year})</span>`;
      }
    }
    const streetBtn = document.getElementById('dossier-street-view-btn');
    if (streetBtn) {
      streetBtn.style.display = data.streetCam ? 'inline-flex' : 'none';
    }

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

    // Controles de Modo de Perspectiva (Aérea vs A Pie de Calle vs Composición)
    document.getElementById('btn-view-aerial')?.addEventListener('click', () => this.setPerspectiveMode('aerial'));
    document.getElementById('btn-view-street')?.addEventListener('click', () => this.setPerspectiveMode('street'));
    document.getElementById('btn-view-blend')?.addEventListener('click', () => this.openPhotoBlend(this.activeLandmarkId));

    // Acciones dentro de la Ficha Histórica (Dossier)
    document.getElementById('dossier-street-view-btn')?.addEventListener('click', () => this.setPerspectiveMode('street'));
    document.getElementById('dossier-photo-blend-btn')?.addEventListener('click', () => this.openPhotoBlend(this.activeLandmarkId));

    // Controles de la Composición con Foto Histórica (Photo Blend HUD)
    document.getElementById('blend-hud-close-btn')?.addEventListener('click', () => this.closePhotoBlend());
    document.getElementById('blend-mode-fade')?.addEventListener('click', () => this.setPhotoBlendMode('fade'));
    document.getElementById('blend-mode-split')?.addEventListener('click', () => this.setPhotoBlendMode('split'));
    document.getElementById('blend-opacity-slider')?.addEventListener('input', (e) => {
      this.updatePhotoBlendVisual(parseInt(e.target.value, 10));
    });

    // Selector rápido de calles históricas a nivel de suelo
    document.querySelectorAll('[data-street-wp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wpId = btn.dataset.streetWp;
        if (wpId) this.walkToStreetWaypoint(wpId);
      });
    });

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
        this.closePhotoBlend();
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

      if (this.fovStart !== this.fovEnd) {
        this.camera.fov = this.fovStart + (this.fovEnd - this.fovStart) * ease;
        this.camera.updateProjectionMatrix();
      }

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
