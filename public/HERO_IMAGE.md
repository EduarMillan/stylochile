# Imagen de fondo del hero

El landing y el explorer (`/` y `/salones`) usan **`public/hero-bg.jpg`** como
imagen de fondo del hero.

## Qué imagen funciona bien

- **Estética**: dark luxury salon, mármol negro, vidrio, dorado, plantas
  oscuras, luz dramática lateral.
- **Composición**: con espacio negativo a la izquierda o centro (el headline
  ocupa la mitad izquierda); evitar caras o textos en la imagen.
- **Color**: mejor si tiene tonos cálidos / dorados / marrones. Se aplica un
  overlay degradado de oscuro a casi negro, así que imágenes muy claras se
  apagarán; las medio-oscuras quedan perfectas.
- **Resolución mínima**: 1920×1080. Recomendado: 2400×1500. JPG 80-90% calidad.
- **Tamaño**: <500 KB idealmente (Next.js la optimiza igual con `next/image`,
  pero el archivo fuente no debería ser muy pesado).

## Dónde conseguir una gratis y libre de derechos

- [Unsplash](https://unsplash.com/s/photos/luxury-salon) — busca "luxury salon
  interior", "dark beauty salon", "marble salon".
- [Pexels](https://www.pexels.com/search/luxury%20salon/)
- [Pixabay](https://pixabay.com/images/search/luxury%20salon/)

## Cómo reemplazarla

1. Descarga la imagen.
2. Renómbrala a `hero-bg.jpg`.
3. Ponla en esta carpeta (`stylochile-app/public/`).
4. Recarga la página — `next/image` la sirve y optimiza automáticamente.

Si prefieres `.webp` o `.png`, cambia la extensión en `src/app/page.tsx` y
`src/app/salones/page.tsx` (busca `/hero-bg.jpg`).
