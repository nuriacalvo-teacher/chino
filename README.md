# 中文 · Aprende y repasa chino

Portada de las apps de repaso de chino para hispanohablantes:

- **HSK 1 · Repaso** → https://nuriacalvo-teacher.github.io/hsk1/
- **HSK 2 · Repaso** → https://nuriacalvo-teacher.github.io/hsk2/

Publicada en **https://nuriacalvo-teacher.github.io/chino/**. Para activarla una
sola vez: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.

## Qué tiene

- **Paisaje de noche de luna (山水月夜):** montañas en capas con efecto
  paralaje al hacer scroll y al mover el ratón, niebla, una pagoda, grullas
  volando, farolillos del cielo (孔明灯) que suben y estrellas que parpadean.
- **Portada:** los caracteres 学中文 se trazan solos, trazo a trazo
  (Hanzi Writer).
- **Las dos apps** como rollos chinos colgantes que se desenrollan al
  aparecer. Se inclinan en 3D con el ratón y tienen contadores animados.
- **Interactivo:** los cuatro tonos (mā má mǎ mà) con su curva, que suenan al
  tocarlos, y una «palabra del día» que se gira y se escucha.
- **El camino:** un sendero por la montaña se dibuja con el scroll, de
  HSK 1 a HSK 2 y a HSK 3 (próximamente).
- **Sonido:** música de fondo propia, distinta de la de las apps: erhu
  (二胡), yangqin (扬琴) y campana de templo sobre la pentatónica en modo 商.
  Suena a partir del primer clic o toque y se quita con el botón ♪. También
  hay efectos al pasar por encima de las tarjetas y un gong al entrar en
  una app.
- Respeta la opción del sistema «reducir movimiento» y funciona en el móvil.

## Estructura

```
index.html               la página
css/landing.css          diseño y animaciones
js/landing.js            paralaje, animaciones e interacción
js/sonido.js             música y efectos (Web Audio, sin ficheros de audio)
js/vendor/               Hanzi Writer (MIT) y los trazos de 学中文 (Arphic Public License)
img/                     favicon, nubes y bambú en SVG
```
