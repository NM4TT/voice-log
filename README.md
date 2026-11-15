# VoiceLog

VoiceLog es una aplicacion web para capturar bitacoras de voz por rafagas (*voice bursts*), estructurar notas habladas y exportar documentos Markdown (`.md`) listos para Obsidian, Notion o repositorios Git directamente desde el navegador web.

## Caracteristicas Principales

- Procesamiento 100% en el cliente (Zero-Server Overhead): El analisis acustico de actividad de voz (VAD), la codificacion de audio PCM a WAV, la limpieza determinista de muletillas, el parser de comandos hablados y la compilacion de documentos Markdown con YAML Frontmatter se ejecutan integramente en el dispositivo del usuario mediante Web Workers e IndexedDB efimero.
- Estrategia hibrida de transcripcion: Soporte para reconocimiento en vivo mediante Web Speech API, inferencia neuronal offline en segundo plano con Whisper (WebAssembly / ONNX en Web Worker) y estructuracion semantica opcional con IA.
- Captura por bloques con respaldo de audio: Cada entrada de la bitacora conserva su fragmento de audio en almacenamiento efimero local para que puedas reproducir cualquier segmento mientras revisas y editas el texto antes de descargar.
- Multiples flujos de trabajo: Bitacora cronologica (con timestamps exactos `[HH:MM:SS]` y etiquetas de severidad para debugging o incidentes), Nota rapida por parrafos, Lista de tareas interactiva (`- [ ]`) y Daily Standup (*Avances / Proximos pasos / Bloqueos*).
- Marcadores tactiles en vivo: Controles de gran tamano durante la grabacion para inyectar saltos de parrafo, tareas pendientes, bloques de cita (`> [!NOTE]`) y marcas de tiempo sin interrumpir el habla.
- Soporte multi-idioma: Interfaz y reconocimiento de comandos de voz en espanol e ingles con selector dinamico en la barra superior.

## Requisitos de Desarrollo

- Node.js 22 o superior
- pnpm (gestor de paquetes obligatorio)

## Instrucciones de Instalacion y Uso

Instalar dependencias:

```bash
pnpm install
```

Iniciar servidor de desarrollo:

```bash
pnpm dev
```

Ejecutar suite de pruebas:

```bash
pnpm test
```

Compilar para produccion:

```bash
pnpm build
```

Previsualizar la compilacion de produccion:

```bash
pnpm preview
```

## Variables de Entorno

Puedes configurar un archivo `.env` basado en `.env.example`:

- `VITE_GEMINI_API_KEY`: Clave de API de Google Gemini (opcional, para estructuracion semantica asistida por IA).
- `PUBLIC_REPO`: URL del repositorio de codigo fuente.
- `CLOUDFLARE_TUNNEL_TOKEN`: Token para pruebas en dispositivos moviles mediante tunel seguro (opcional).

## Licencia y Exencion de Responsabilidad

Este proyecto es software libre y de codigo abierto publicado bajo los terminos de la [Licencia MIT](LICENSE).

### Limitacion de Responsabilidad

El software se entrega bajo la premisa "tal cual" (*as is*), sin garantias de ningun tipo, expresas o implicitas, incluyendo, entre otras, garantias de comerciabilidad, idoneidad para un proposito particular y no infraccion.

En ningun caso los autores o titulares de derechos de autor seran responsables de ninguna reclamacion, dano u otra responsabilidad, ya sea en una accion contractual, extracontractual o de otro tipo, que surja de, se derive de o este relacionada con el software, el uso del mismo, la perdida de datos o cualquier otra interaccion con los archivos generados. El usuario asume la custodia y responsabilidad exclusiva de sus grabaciones y notas procesadas.
