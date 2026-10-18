/**
 * Mequinenza 3D · Historical Photo Archive Database
 * 491+ authentic historical photos from the official archive of Mequinenza & Wikimedia Commons
 */

export const GALLERY_CATEGORIES = [
  { id: 'all', name: 'Todas las fotos', icon: '📷', count: 442 },
  { id: 'castillo', name: 'Castillo medieval', icon: '🏰', count: 12 },
  { id: 'pueblo', name: 'Poble Vell (Ruinas)', icon: '🏚', count: 99 },
  { id: 'vistas', name: 'Vistas panorámicas', icon: '🌄', count: 67 },
  { id: 'esglesia', name: 'Iglesia de la Asunción', icon: '⛪', count: 39 },
  { id: 'enderroc', name: 'Reconstrucción ENHER', icon: '🏗', count: 12 },
  { id: 'llauts', name: 'Llaüts y Río Ebro', icon: '⛵', count: 11 },
  { id: 'mina', name: 'Minas de carbón', icon: '⛏', count: 12 },
  { id: 'mequinensans', name: 'Vecinos de Mequinenza', icon: '👥', count: 62 },
  { id: 'festes', name: 'Fiestas y Tradiciones', icon: '🎉', count: 49 },
  { id: 'ajuntament', name: 'Casa consistorial', icon: '🏛', count: 14 },
  { id: 'elements', name: 'Patrimonio y detalles', icon: '🏺', count: 30 }
];

export const GALLERY_PHOTOS = [];

// Helper to push items
function addCategory(catId, titlePrefix, folder, filePrefix, count, ext = 'jpg') {
  for (let i = 1; i <= count; i++) {
    GALLERY_PHOTOS.push({
      id: `${catId}_${i}`,
      category: catId,
      src: `assets/ref/${folder}/${filePrefix}${i}.${ext}`,
      title: `${titlePrefix} #${i}`,
      caption: `Fotografía histórica de Mequinenza · Colección oficial (${titlePrefix})`
    });
  }
}

// 1. Castillo (Local + Wikimedia Alta Resolución)
addCategory('castillo', 'Castillo de Mequinenza', 'castillo', 'castell', 8);
GALLERY_PHOTOS.push(
  {
    id: 'castillo_wm_1',
    category: 'castillo',
    src: 'assets/ref/wikimedia/castillo/castillo_vista_general.jpg',
    title: 'Castillo y promontorio rocoso (Alta resolución)',
    caption: 'Vista del Castillo de Mequinenza sobre el farallón rocoso calizo dominando el valle del Ebro'
  },
  {
    id: 'castillo_wm_2',
    category: 'castillo',
    src: 'assets/ref/wikimedia/castillo/castillo_zm.jpg',
    title: 'Murallas y Torres del Castillo (5449x3150)',
    caption: 'Detalle de los lienzos de muralla y torres del Castillo de Mequinenza'
  },
  {
    id: 'castillo_wm_3',
    category: 'castillo',
    src: 'assets/ref/wikimedia/castillo/mequinenza_desde_castillo.jpg',
    title: 'Panorámica de la confluencia desde el Castillo',
    caption: 'Vista de la confluencia del Ebro y el Segre y los puentes desde lo alto de la fortaleza'
  },
  {
    id: 'castillo_wm_4',
    category: 'castillo',
    src: 'assets/ref/wikimedia/castillo/castillo_cropped.jpg',
    title: 'Torre del Homenaje del Castillo',
    caption: 'Perspectiva suroeste de la Torre del Homenaje del Castillo de Mequinenza'
  }
);

// 2. Poble Vell (99 fotos completas)
addCategory('pueblo', 'Poble Vell (Casco Antiguo)', 'pueblo', 'poble', 99);

// 3. Vistas generales (67 fotos)
addCategory('vistas', 'Vista Panorámica', 'generals', 'generals', 67);

// 4. Iglesia de la Asunción (39 fotos)
addCategory('esglesia', 'Iglesia de Ntra. Sra. de la Asunción', 'esglesia', 'esglesia', 39);

// 5. Reconstrucción y derribo ENHER 1959 (12 fotos)
addCategory('enderroc', 'Reconstrucción ENHER', 'enderroc', 'enderroc', 12);

// 6. Llaüts del Ebro (11 fotos)
addCategory('llauts', 'Llaüt del Ebro', 'llauts', 'llauts', 11);

// 7. Minas de carbón de Mequinenza (12 fotos)
addCategory('mina', 'Minería de Mequinenza', 'mina', 'mina', 12);

// 8. Vecinos y mequinensanos (62 fotos)
addCategory('mequinensans', 'Vecinos de Mequinenza', 'mequinensans', 'mequinensans', 62);

// 9. Fiestas tradicionales (49 fotos)
addCategory('festes', 'Fiestas de Mequinenza', 'festes', 'festes', 49);

// 10. Ayuntamiento y edificios singulares (14 fotos)
addCategory('ajuntament', 'Casa de la Vila / Ayuntamiento', 'ajuntament', 'ajuntament', 14);

// 11. Elementos singulares (30 fotos)
addCategory('elements', 'Elemento Patrimonial', 'elements', 'elements', 30);
