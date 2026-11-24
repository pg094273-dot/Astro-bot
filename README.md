# Astro Nova 3D

Juego de plataformas 3D/2D estilo **Astro Bot** para **Android TV**, navegador y dispositivos móviles, construido con **Three.js**, **WebGL**, **React**, **TypeScript**, **Tailwind CSS** y **Capacitor**.

## Características
- **8 Niveles completos con gráficos PBR realistas, vehículos y jefe final**:
  1. **Selva Esmeralda** — Ruinas flotantes, cascadas y **Arco Estelar**.
  2. **Dunas del Desierto** — Cañón arenoso con transición al **Cohete Astro** manejable.
  3. **Glaciar Aurora** — Plataformas de hielo deslizante, acantilados 2D y dianas estelares.
  4. **Templo del Mono** — Selva profunda, río dinámico con cascadas, 3 rutas (principal, elevada y secreta), **Traje de Mono**, **Prueba de los Antiguos** y jefe final **Ídolo Solar Kukul**.
  5. **Cañón Volcánico** — Ríos de lava, plataformas inestables y minas ígneas.
  6. **Ciudadela Nebulosa** — Batalla contra el **Jefe Final Megabot** en un planeta alienígena.
  7. **Cielos de París** — Salto en **Ala Delta** desde la **Torre Eiffel**, recogiendo monedas y atravesando aros sobre el Sena hasta el **Arco del Triunfo**.
  8. **Rápidos del Río Bravo** — Descenso en **Barco** esquivando rocas y cocodrilos hasta alcanzar el **Lago Tranquilo**.
- **Compatible con Android TV**: Launcher Leanback con banner propio (`320×180`), navegación con **control remoto (D-pad)** y soporte nativo para **mando Bluetooth / USB** (Gamepad API).
- **Banda sonora y efectos procedurales (Web Audio API)** e **instalable como PWA** en iPhone/iPad.

## Controles
- **Control remoto de Android TV (el mando del televisor)**: Cruceta Mover / Trepar / Cohete · Botón Central (`OK`) Saltar (mantener en el aire para planear / Turbo) · **Doble toque en `OK`** (o `OK` en el aire) Ataque Giratorio y Arco · `Volver` Pausa
- **Mando Bluetooth / USB (Android TV)**: Stick Izquierdo / Cruceta Mover · `A` Saltar / Planear / Turbo · `X` Girar · `B` / `RT` Disparar Arco · Stick Derecho Cámara · `Start` Pausa
- **Teclado**: `WASD` / Flechas Mover · `Espacio` Saltar / Planear · `F` / `Shift` Girar · `G` / `R` Arco · `Q`/`E` Cámara · `Esc` Pausa

## Descargar e instalar el APK en Android TV

El proyecto incluye el proyecto nativo `/android` configurado para **Android TV** y el flujo automático `.github/workflows/build-apk.yml` que compila el APK listo para instalar al hacer `git push` a `main`:

1. Sube estos cambios a tu repositorio de GitHub (`git add . && git commit -m "feat: android tv apk" && git push`).
2. En GitHub, espera ~2 minutos a que termine el workflow **"Build Android TV APK"** en la pestaña **Actions**.
3. Descarga `astro-nova-3d-android-tv.apk` desde:
   - La sección **Releases** (`android-tv-latest`) de tu repositorio — enlace directo:
     `https://github.com/TU_USUARIO/TU_REPO/releases/download/android-tv-latest/astro-nova-3d-android-tv.apk`
   - O desde el artifact `astro-nova-3d-android-tv-apk` dentro del resumen del workflow en **Actions**.
4. **Instalar en tu Android TV / Google TV**:
   - **Opción A (Directo en la TV con la app Downloader)**: Instala **Downloader by AFTVnews** desde Google Play en tu TV, habilita **"Instalar aplicaciones desconocidas"** para Downloader, introduce la URL del Release de arriba y pulsa **Install**.
   - **Opción B (Memoria USB)**: Copia `astro-nova-3d-android-tv.apk` a un pendrive USB, conéctalo a la TV y ábrelo con un gestor de archivos (como *FX File Explorer* o *Send Files to TV*).
   - **Opción C (ADB desde PC)**:
     ```bash
     adb connect IP_DE_TU_TV:5555
     adb install -r astro-nova-3d-android-tv.apk
     ```

### Compilar el APK manualmente en tu PC (opcional, si tienes Android Studio / JDK 21)
```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK generado en: android/app/build/outputs/apk/debug/app-debug.apk
```

## Publicar versión Web / PWA en GitHub Pages
1. En tu repo de GitHub ve a **Settings → Pages → Source: GitHub Actions**.
2. El flujo `.github/workflows/deploy.yml` publicará la versión web en `https://TU_USUARIO.github.io/TU_REPO/`.

