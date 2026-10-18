# Mequinenza Histórica · Visor 3D y Galería Fotográfica

Recreación visual y visor 3D interactivo del casco antiguo y el castillo de Mequinenza (Aragón, España).

## Contenido

- `index.html` — Página principal: historia, información de los paneles, galería fotográfica con 491 fotos reales
- `visor-3d.html` — Visor 3D interactivo (Three.js + OrbitControls) con texturas PBR reales
- `package.json` — Dependencias y scripts
- `assets/` — Texturas PBR y 491 fotos de referencia histórica

## Estructura de assets

```
assets/
├── piedra.jpg          — Textura PBR del castillo (tomada de castell3.jpg)
├── ruinas.jpg           — Textura PBR del casco antiguo (tomada de enderroc3.jpg)
├── ref/
│   ├── castillo/        — 8 fotos del castillo
│   ├── pueblo/          — 99 fotos del Poble Vell
│   ├── vistas/          — 67 vistas generales
│   ├── esglesia/        — 39 fotos de la iglesia
│   ├── enderroc/        — 12 fotos de derribo/reconstrucción
│   ├── generals/        — 15 vistas generales
│   ├── festes/          — 49 fotos de fiestas
│   ├── elements/        — 30 elementos singulares
│   ├── mequinensans/    — 62 fotos de vecinos
│   ├── mina/            — 12 fotos de la mina
│   ├── competicions/    — 22 fotos de competiciones
│   ├── llauts/          — 11 fotos de llauts
│   ├── moments/         — 6 momentos importantes
│   ├── ajuntament/      — 14 fotos del ayuntamiento
│   ├── campfutbol/      — 5 fotos del campo de fútbol
│   └── lopoble/         — 20 fotos del pueblo (copia)
└── LEEME.txt            — Instrucciones
```

## Cómo usar

### Opción 1: Ejecutar localmente

```bash
cd mequinenza-pro
npm start
```

Luego abre `http://localhost:3000` en tu navegador.

### Opción 2: Abrir directamente

Abre `index.html` en un navegador moderno. Requiere conexión a Internet para cargar Three.js desde CDN.

### Opción 3: GitHub Pages

1. Crea un repositorio en GitHub con nombre `Mequi3D`
2. Sube todo el contenido de `mequinenza-pro/` al repositorio
3. En GitHub: Settings → Pages → Source: `main` / `/(root)`
4. Tu sitio estará en `https://manu-alvarez.github.io/Mequi3D/`

## Contenido de las páginas

### index.html (Historia y Galería)
- Sección de Historia con línea de tiempo (1149-1960)
- Sección de Reconstrucción (ENHER, 1959)
- Sección de Ubicación (confluencia Ebro-Segre, 185m de altitud)
- Galería fotográfica con 491 imágenes reales de la colección oficial de mequinenza.com
- Textos extraídos de los paneles informativos del castillo

### visor-3d.html (Visor 3D)
- Terreno procedural con elevación realista
- Castillo con torres, murallas y almenas
- Casco antiguo con casas de piedra y calles empinadas
- Ríos Ebro y Segre
- Vegetación (árboles y arbustos)
- Texturas PBR reales (piedra.jpg, ruinas.jpg)
- Controles: girar, acercar, cambiar iluminación (mañana/tarde), mostrar etiquetas
- Vistas predefinidas: general, castillo, casco antiguo, ríos

## Controles del visor 3D

- Arrastrar (botón izquierdo): Girar la cámara
- Rueda / pellizca: Acercar / alejar
- Botón derecho: Desplazar la vista
- Botones de la barra inferior: Girar, cambiar iluminación, mostrar etiquetas
- Botones de la barra lateral: Seleccionar vistas predefinidas

## Limitaciones importantes

Este modelo es una **recreación conceptual procedimental** basada en referencias visuales. No es:

- Un levantamiento topográfico exacto
- Una reconstrucción arqueológica precisa
- Un gemelo digital geográficamente fiel

Para obtener un modelo de alta fidelidad se necesitarían datos topográficos reales, cartografía del área y referencias fotogramétricas del castillo.

## Fuentes de referencia

- https://www.mequinenza.com/coleccion_fotografica — Colección fotográfica oficial (491 fotos)
- Paneles informativos del Castillo de Mequinenza (fotografías locales)
- Datos históricos: Guerra de la Independencia (1810), Guerra Civil (1939), Reconstrucción ENHER (1959)