# Astro Nova 3D

Juego de plataformas 3D/2D estilo **Astro Bot** para navegador y dispositivos móviles, construido con **Three.js**, **WebGL**, **React**, **TypeScript** y **Tailwind CSS**. Instalable en **iPhone / iPad** como **PWA** sin necesidad de Xcode ni cuenta de desarrollador.

## Características
- **3 Biomas con perspectiva híbrida 3D + 2D**:
  1. **Selva Esmeralda** — Ruinas flotantes, puentes holográficos y **Arco Estelar**.
  2. **Dunas del Desierto** — Cañón arenoso con transición al **Cohete Astro** manejable.
  3. **Glaciar Aurora** — Plataformas de hielo deslizante, acantilados 2D y dianas estelares.
- **Banda sonora y efectos procedurales (Web Audio API)**: Temas adaptativos por bioma y modo Cohete, con control independiente de música y sonido.
- **PWA Instalable en iOS y Android**: Caché *offline* mediante Service Worker, iconos propios (`180×180`, `192×192`, `512×512`) y controles táctiles en pantalla.

## Controles
- **Mover**: `WASD` o flechas (y pad táctil en móvil)
- **Saltar / Planear con láser**: `Espacio` (mantener en el aire para planear)
- **Ataque giratorio**: `F`, `Shift`, `J` o clic derecho
- **Disparar Arco Estelar**: `G`, `R`, `C` o clic izquierdo rápido
- **Rotar cámara (3D)**: Arrastrar con ratón o `Q` / `E`
- **Cohete Astro**: `WASD` para maniobrar · `Espacio` para Turbo

## Desarrollo local
```bash
npm install
npm run dev
```

Comprobar tipos y compilar para producción:
```bash
npm run lint
npm run build
```

## Subir a GitHub y publicar gratis con HTTPS (para instalar en iPhone)
1. Crea un repositorio nuevo en GitHub (por ejemplo `astro-nova-3d`).
2. Desde la carpeta del proyecto, ejecuta:
```bash
git init -b main
git add .
git commit -m "Initial commit: Astro Nova 3D PWA"
git remote add origin https://github.com/TU_USUARIO/astro-nova-3d.git
git push -u origin main
```
3. Para publicarlo gratis con **GitHub Pages** y poder instalarlo en tu iPhone:
   - En tu repo de GitHub ve a **Settings → Pages**.
   - En **Build and deployment → Source**, elige **GitHub Actions**.
   - El flujo incluido en `.github/workflows/deploy.yml` compilará y publicará tu juego en `https://TU_USUARIO.github.io/astro-nova-3d/`.
4. Abre esa URL desde **Safari** en tu iPhone → **Compartir** → **Añadir a pantalla de inicio**.
