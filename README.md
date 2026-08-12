# Física I · Laboratorios interactivos

Catálogo estático de experiencias educativas publicado con GitHub Pages.

Cada experimento vive en una carpeta autónoma con su HTML, módulos, estilos, documentación y pruebas. Para agregar otro, crear una carpeta apta para URL, usar recursos relativos y añadir su tarjeta en `index.html`.

## Desarrollo local

```bash
python3 -m http.server 4173
```

- Catálogo: `http://localhost:4173/`
- Reflexión y refracción: `http://localhost:4173/sandbox-reflexion/`
- Lentes delgadas: `http://localhost:4173/sandbox-lentes/`

Cada push a `main` despliega automáticamente todo el árbol mediante GitHub Pages.
