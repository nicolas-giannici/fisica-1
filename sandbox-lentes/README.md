# Experiencia 02 · Lentes delgadas

Simulador de lentes convergentes y divergentes basado en la ecuación de lente delgada.

## Convención

- `f > 0`: lente convergente.
- `f < 0`: lente divergente.
- `do > 0`: objeto real a la izquierda.
- `di > 0`: imagen real a la derecha.
- `di < 0`: imagen virtual a la izquierda.
- `m > 0`: imagen derecha.
- `m < 0`: imagen invertida.

La escena 3D utiliza perfiles procedurales de revolución para evitar dependencias externas y conservar correspondencia entre tipo de lente y volumen.

## Ejecutar

Desde esta carpeta:

```bash
npm run serve
```

Abrir `http://localhost:4173/sandbox-lentes/`.

## Verificar

```bash
npm test
npm run test:browser
```
