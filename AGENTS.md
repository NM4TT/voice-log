# Directrices de Desarrollo y Estándares de Ingeniería (AGENTS.md)

## 1. Filosofía Arquitectónica e Invariantes del Sistema

1. **Arquitectura Hexagonal (Puertos y Adaptadores):**
   - El dominio (`src/domain/`) es agnóstico de frameworks, del DOM y de librerías externas.
   - Las implementaciones técnicas (Web Workers, IndexedDB, Web Speech API, AudioContext, Gemini) residen exclusivamente en `src/adapters/`.
   - La interfaz de usuario reside exclusivamente en `src/ui/`.
   - La configuración y el arranque residen en `src/config/` y `src/core/`.
2. **Zero-Server Overhead & Privacidad por Diseño:**
   - Toda la captura acústica, detección de actividad de voz (VAD), codificación WAV, limpieza de muletillas, estructuración AST y compilación de archivos Markdown (`.md`) se ejecuta estrictamente en el dispositivo del cliente.
   - Ningún audio o nota sensible se transmite a servidores propios; el almacenamiento de sesión en IndexedDB es efímero y se limpia determinísticamente al reiniciar la sesión.
3. **Gestión Determinista de Memoria:**
   - Prohibido acumular buffers PCM crudos fuera de las operaciones de captura o codificación en curso.
   - Todo buffer transferible (`ArrayBuffer`) enviado al Worker debe ser desreferenciado tras el procesamiento.
   - Todo `URL.createObjectURL()` generado para reproducción de bloques de audio o descarga debe contar con su correspondiente `URL.revokeObjectURL()`.

---

## 2. Herramientas y Gestión de Paquetes

- **Gestor de Paquetes Exclusivo:** Se debe usar `pnpm`. Queda estrictamente prohibido el uso de `npm` o `yarn`.
- **Compilador:** TypeScript en modo estricto (`strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`).
- **Test Runner:** `vitest`.

---

## 3. Higiene y Estándares de Código

1. **Declaración y Orden de Variables:**
   - **Ámbito Global/Módulo:** Todas las constantes y tipos del archivo deben declararse al inicio del mismo, inmediatamente después de las importaciones.
   - **Ámbito Local:** Todas las variables y constantes locales de funciones o componentes deben declararse al principio del cuerpo de la función o componente.
2. **Estructuras de Control:**
   - Prohibido el uso de cascadas de `if / else if / else` anidados para evaluar estados o tipos discriminados.
   - Se debe utilizar la sentencia `switch` con control exhaustivo (`default: assertNever(value)`).
3. **Límite de Longitud y Principio de Responsabilidad Única (SRP):**
   - Ninguna función ni componente debe superar las **50 líneas de código**.
   - Cada función realiza una única tarea bien definida. Si una función tiende a extenderse, debe descomponerse en funciones auxiliares puras.
4. **Prohibición de Valores Mágicos:**
   - Cero strings mágicos o números mágicos hardcodeados en el código.
   - Toda constante debe importarse desde `src/config/constants.ts` o definirse al inicio del módulo.
5. **Principios DRY y Reusabilidad:**
   - Modularizar cualquier lógica repetida.
   - Componentes UI puramente composicionales y desacoplados del estado global.
6. **Higiene de Comentarios:**
   - Prohibidos los comentarios redundantes, obvios o que simplemente parafraseen lo que el código ya expresa de forma explícita.
   - El código debe ser autoexplicativo a través de nombres expresivos de variables, funciones y tipos TypeScript bien modelados.
   - Prohibido dejar bloques de código comentado o muerto.

---

## 4. Estándares de Diseño y UI ("Nordic Editorial & Warm Paper")

1. **Paleta de Colores ("Nordic Editorial & Warm Paper"):**
   - Prohibido terminantemente el uso de colores brillantes, saturados o chillones estilo neón.
   - Se utiliza una paleta editorial cálida y acústica:
     - Papel Alabastro Cálido (`#F7F6F2`), Tarjeta Blanca (`#FFFFFF`), Piedra Arena Suave (`#EFECE6`), Borde Piedra (`#E4E0D8`).
     - Primario Azul Acero Nórdico (`#5B7B9A`), Secundario Terracota Suave (`#B07D62`), Acento Ocre Arena (`#B8965A`), Peligro Rosa Empolvado (`#B56E6E`).
   - El texto principal utiliza Grafito Cálido profundo (`#262523`), nunca negro absoluto (`#000000`).
2. **Iconografía:**
   - Exclusivamente iconos MDI mediante `@mdi/react` y `@mdi/js`.
3. **Restricciones Estéticas Absolutas:**
   - **Cero Emojis:** Prohibido el uso de emojis en interfaces, botones, mensajes informativos o comentarios de código.
   - **Cero Dots:** Prohibido el uso de dots ornamentales o viñetas circulares decorativas en la interfaz gráfica. Los separadores deben ser estructurales (márgenes, divisores tenues de 1px).
4. **Framework CSS:**
   - TailwindCSS v4 configurado con tokens en `src/styles/theme.css`.
5. **Estándar Tipográfico y Jerarquía de Fuentes:**
   - **Sans-Serif Principal:** Pila nativa del sistema operativo (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`). Prohibido enlazar fuentes web externas para garantizar privacidad y funcionamiento *offline*.
   - **Monoespaciada Técnica:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` para marcas de tiempo (`[HH:MM:SS]`), duración de audio, frecuencias de muestreo y previsualización de código Markdown.
   - **Reglas de Pesos Tipográficos:** Peso máximo admitido en toda la aplicación: `font-semibold` (600). Prohibido `font-bold` (700) o superior.
   - **Restricciones de Cursiva:** Prohibido `italic` en controles, botones, encabezados o estados de interfaz.

---

## 5. Metodología TDD (Test-Driven Development)

1. Para cualquier lógica acústica, algorítmica o de dominio:
   - **Paso 1:** Escribir la prueba unitaria en `test/` especificando el comportamiento esperado.
   - **Paso 2:** Ejecutar la prueba y verificar que falle.
   - **Paso 3:** Implementar la lógica mínima requerida para satisfacer la prueba.
   - **Paso 4:** Refactorizar asegurando el cumplimiento de las reglas de higiene (< 50 líneas, constantes al inicio).

---

## 6. Configuración, Arranque y Seguridad

1. **Variables de Entorno Centralizadas:**
   - Toda variable de entorno debe residir y ser validada en `src/config/env.ts`.
   - Prohibido invocar `import.meta.env` directamente en componentes o lógica de dominio.
2. **Ciclo de Arranque Mínimo (`bootstrap.ts`):**
   - El archivo `src/main.tsx` debe limitarse a invocar `bootstrapApplication()` y montar el root de React (< 15 líneas).
   - `src/core/bootstrap.ts` ejecuta las validaciones de capacidades del navegador (Workers, IndexedDB, MediaDevices, SpeechRecognition, AudioContext).
3. **Seguridad y Anti-Hacking:**
   - Validación estricta de límites de buffers binarios de audio y longitud de texto para prevenir agotamiento de memoria.
   - Sanitización de cualquier nombre de archivo de descarga (`.md`, `.wav`).
