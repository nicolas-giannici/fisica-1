# Reflexión y refracción

Experiencia interactiva independiente del manual. Usa módulos ES, Three.js para la geometría y SVG superpuesto para mantener legibles los arcos y etiquetas.

## Ejecutar

Desde esta carpeta:

```bash
npm run serve
```

Abrir `http://localhost:4173/sandbox-reflexion/`. Three.js se carga desde jsDelivr, por lo que la primera carga requiere conexión a Internet.

## Pruebas

```bash
npm test
```

Las pruebas cubren conversiones, incidencia normal, índices iguales, aire/agua, ángulo crítico, reflexión total interna, valores próximos a 90° y entradas inválidas.

Con el servidor iniciado, la validación responsive y funcional puede repetirse con:

```bash
npm run test:browser
```

El chequeo usa el Playwright ya instalado en el proyecto padre, prueba `1440x900`, `1024x768`, `390x844` y `360x800`, valida que no exista desborde, ejercita reflexión total interna y teclado, y falla ante errores de consola.

## Estructura

- `physics.js`: ley de Snell y cálculos puros.
- `media.js`: catálogo y presets.
- `scene.js`: escena, rayos, flechas, cuadrícula y ciclo de vida WebGL.
- `app.js`: estado, controles, interacción y presentación.
- `styles.css`: identidad UTN.BA y diseño responsive.
- `tests/`: pruebas unitarias sin dependencias adicionales.
- `screenshots/`: capturas verificadas en los cuatro tamaños solicitados.
