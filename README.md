# Mequinenza 3D · Castillo medieval y Poble Vell

> **Gemelo digital y visor 3D interactivo** del Castillo medieval de Mequinenza, el casco antiguo (Poble Vell) y la confluencia de los ríos Ebro y Segre ("Aiguabarreig"), en Aragón, España.

Desplegado en producción en **GitHub Pages**:  
🔗 **[https://manu-alvarez.github.io/Mequi3D/](https://manu-alvarez.github.io/Mequi3D/)**

---

## 🏛 Características del Proyecto

- **Reconstrucción 3D Fidedigna**:
  - **Castillo de Mequinenza**: Fortaleza medieval del siglo XII sobre el escarpado promontorio rocoso calizo a 185 m sobre el nivel del río. Incluye sus 4 torres cuadradas almenadas (Torre del Homenaje, Torre de la Confluencia, Torre de las Armas y Torre del Portal), patio de armas con arquería gótica, adarve y el gran ventanal panorámico hacia la confluencia fluvial.
  - **Poble Vell (Casco Antiguo)**: Más de 85 viviendas de piedra aragonesa tradicional escalonadas en terrazas sobre la ladera sur, muros en ruinas, arcos de medio punto, callejones empinados ("carrerons") y la **Iglesia de Nuestra Señora de la Asunción** con su torre campanario.
  - **Confluencia Ebro - Segre ("Aiguabarreig")**: Masa de agua con reflejos especulares, el **puente histórico de arcos de piedra** y el puerto fluvial con los tradicionales **Llaüts** (embarcaciones históricas de madera para el transporte de carbón).
  - **Texturas PBR Reales**: Mapeo de texturas tomadas directamente de las fotografías históricas (`assets/piedra.jpg` y `assets/ruinas.jpg`).
- **Interfaz UI/UX Premium (Glassmorphism)**:
  - Selector de 7 puntos de interés con vuelos de cámara fluidos (curvas cúbicas de Bezier).
  - **Pines y marcadores interactivos 3D** proyectados en tiempo real sobre el lienzo.
  - **Brújula interactiva dinámica**: La aguja gira sincronizada con el rumbo de la cámara. Clic en "N" para reorientar al Norte.
  - **Dossier Histórico Desplegable**: Información detallada, altitud, época y hechos históricos de cada monumento.
  - **Modo Paseo a Pie (Primera Persona)**: Explora a nivel de calle (1,75 m) las ruinas y callejones del Poble Vell con controles WASD / Flechas / Arrastre táctil en móvil.
  - **Tour Guiado Cinematográfico**: Sobrevuelo automatizado con narración histórica paso a paso.
  - **4 Atmósferas de Iluminación**:
    - 🌅 *Amanecer Dorado* (Golden hour, sombras alargadas sobre el valle).
    - ☀️ *Mediodía Radiante* (Luz nítida cenital y alto contraste).
    - 🌇 *Atardecer Dramático* (Cielo rojizo y reflejos en el agua).
    - 🌙 *Noche Monumental* (Cielo estrellado con iluminación arquitectónica en castillo y ruinas).
- **Archivo Fotográfico Histórico (440+ fotos reales)**:
  - Modal interactivo con fotos organizadas por categorías: Castillo (12), Poble Vell (99), Vistas Panorámicas (67), Iglesia (39), Reconstrucción ENHER (12), Minas de Carbón (12), Llaüts del Ebro (11), Vecinos (62), Fiestas (49), Ayuntamiento (14), Elementos (30).
  - Visor Lightbox a pantalla completa con navegación por teclado y botones.
- **Paneles Informativos Oficiales**:
  - Fotografías en alta resolución y transcripción completa de los paneles históricos del Castillo (Reconquista de 1149 por Ramon Berenguer IV, Asedio de 1810 del General Suchet, Reconstrucción por ENHER en 1959 y Medalla de Plata en 1960).

---

## 📁 Estructura del Repositorio

```text
VISOR 3D MEQUINENZA/
├── index.html                   # Aplicación web unificada y visor 3D principal
├── visor-3d.html                # Redirección al visor principal
├── package.json                 # Metadatos del proyecto y scripts
├── README.md                    # Documentación del proyecto
├── assets/
│   ├── css/
│   │   └── viewer.css           # Sistema de diseño Glassmorphism responsive
│   ├── js/
│   │   ├── viewer3d.js          # Motor 3D Three.js, topografía, modelos y física
│   │   └── gallery-data.js      # Base de datos catalogada de las fotos históricas
│   ├── vendor/
│   │   ├── three.module.js      # Three.js r160 empaquetado para soporte offline
│   │   └── OrbitControls.js     # Controles orbitales de Three.js
│   ├── piedra.jpg               # Textura PBR del castillo (muros de sillería)
│   ├── ruinas.jpg               # Textura PBR del Poble Vell (piedra y mampostería)
│   └── ref/
│       ├── castillo/            # 8 fotografías del castillo
│       ├── pueblo/              # 99 fotografías del casco antiguo
│       ├── generals/            # 67 fotografías de vistas generales
│       ├── esglesia/            # 39 fotografías de la iglesia
│       ├── enderroc/            # 12 fotografías de la reconstrucción y derribo
│       ├── llauts/              # 11 fotografías de los llaüts del Ebro
│       ├── mina/                # 12 fotografías de las minas de lignito
│       ├── mequinensans/        # 62 fotografías de vecinos históricos
│       ├── festes/              # 49 fotografías de fiestas y tradiciones
│       ├── ajuntament/          # 14 fotografías del ayuntamiento
│       ├── elements/            # 30 fotografías de elementos patrimoniales
│       ├── paneles/             # Fotografías en alta resolución de los paneles
│       ├── diseno/              # Boceto de diseño y referencia UI
│       └── wikimedia/           # Fotografías de gran formato (5449x3150)
└── archive/                     # Prototipos y versiones preliminares archivadas
```

---

## 🚀 Despliegue en GitHub Pages

Este proyecto está optimizado para funcionar **directamente desde GitHub Pages**, sin necesidad de servidores locales ni dependencias de Node en ejecución en el equipo local:

1. **Subir los cambios al repositorio:**
   ```bash
   git add -A
   git commit -m "Visor 3D Mequinenza: Versión profesional completa"
   git push origin main
   ```

2. **Verificar GitHub Pages:**
   - En tu repositorio `https://github.com/manu-alvarez/Mequi3D`
   - Ve a **Settings** → **Pages**
   - Asegúrate de que **Source** esté configurado en `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
   - El visor estará disponible en: **`https://manu-alvarez.github.io/Mequi3D/`**

---

## 🎮 Controles del Visor

- **Modo Órbita**:
  - **Clic izquierdo + Arrastrar**: Rotar la vista alrededor del punto focal.
  - **Rueda del ratón / Pellizcar**: Acercar / alejar el zoom.
  - **Clic derecho + Arrastrar**: Desplazar la vista (Panorámica).
  - **Clic en la Brújula**: Restablecer la vista orientada hacia el Norte.
- **Modo Paseo (Primera Persona)**:
  - **Teclas W / A / S / D o Flechas**: Caminar por las calles y ruinas.
  - **Mover el ratón / Táctil**: Mirar en cualquier dirección.
  - **Tecla ESC o botón Salir**: Volver a la vista aérea general.
- **Barra Inferior**:
  - **⟳ Girar**: Activar o pausar la rotación continua automática.
  - **☀️ Iluminación**: Seleccionar entre Amanecer, Mediodía, Atardecer y Noche.
  - **⌖ Marcadores**: Mostrar u ocultar las etiquetas 3D sobre los monumentos.
  - **📷 Galería**: Abrir el catálogo de fotos históricas con filtros y lightbox.
  - **📜 Paneles**: Consultar las imágenes y textos de la exposición del Castillo.
  - **⛶ Pantalla Completa**: Alternar modo inmersivo a pantalla completa.

---

## 📜 Fuentes Históricas y Documentales

- **Paneles informativos del Castillo de Mequinenza** (Colección museográfica ENHER, 1959-1960).
- **Colección Fotográfica Oficial de Mequinenza**: [https://www.mequinenza.com/coleccion_fotografica](https://www.mequinenza.com/coleccion_fotografica)
- **Crónicas y fuentes bibliográficas**: Referencias a la villa de *Octogesa* (Julio César), Reconquista de Ramón Berenguer IV (1149), señorío de los Moncada, defensa ante el Mariscal Suchet en la Guerra de la Independencia (1810) y reconstrucción por ENHER (1959).