import type { SupportedLocale } from '@/domain/types';

export interface TranslationDictionary {
  readonly common: {
    readonly appSubtitle: string;
    readonly entriesCount: string;
    readonly wordsCount: string;
    readonly close: string;
    readonly cancel: string;
    readonly save: string;
  };
  readonly topBar: {
    readonly settingsTooltip: string;
    readonly infoTooltip: string;
    readonly resetTooltip: string;
  };
  readonly modes: {
    readonly sectionLabel: string;
    readonly title: string;
    readonly subtitle: string;
    readonly chronoTitle: string;
    readonly chronoDesc: string;
    readonly quickTitle: string;
    readonly quickDesc: string;
    readonly tasksTitle: string;
    readonly tasksDesc: string;
    readonly standupTitle: string;
    readonly standupDesc: string;
    readonly startRecordingBtn: string;
    readonly addTextBlockBtn: string;
  };
  readonly recorder: {
    readonly statusListening: string;
    readonly statusProcessing: string;
    readonly liveTranscriptLabel: string;
    readonly placeholderSpeaking: string;
    readonly markerKindLabel: string;
    readonly kindParagraph: string;
    readonly kindHeading: string;
    readonly kindTask: string;
    readonly kindCallout: string;
    readonly kindImportant: string;
    readonly kindCode: string;
    readonly stopAndSaveBtn: string;
    readonly splitBlockBtn: string;
    readonly fallbackWhisperNotice: string;
    readonly micErrorNotice: string;
  };
  readonly review: {
    readonly sessionTitleLabel: string;
    readonly addVoiceBurstBtn: string;
    readonly addManualBlockBtn: string;
    readonly tabBlocks: string;
    readonly tabMarkdown: string;
    readonly frontmatterToggle: string;
    readonly cleanFillersToggle: string;
    readonly aiStructureBtn: string;
    readonly aiStructuring: string;
    readonly aiResetBtn: string;
    readonly downloadMdBtn: string;
    readonly copyMdBtn: string;
    readonly copiedLabel: string;
    readonly shareBtn: string;
    readonly playAudioTooltip: string;
    readonly stopAudioTooltip: string;
    readonly downloadWavTooltip: string;
    readonly emptyEntriesHint: string;
  };
  readonly settings: {
    readonly modalTitle: string;
    readonly engineSection: string;
    readonly engineWebSpeech: string;
    readonly engineWebSpeechDesc: string;
    readonly engineWhisper: string;
    readonly engineWhisperDesc: string;
    readonly engineManual: string;
    readonly engineManualDesc: string;
    readonly whisperStatusIdle: string;
    readonly whisperStatusDownloading: string;
    readonly whisperStatusReady: string;
    readonly whisperStatusError: string;
    readonly whisperDownloadBtn: string;
    readonly commandsSection: string;
    readonly commandsHelp: string;
  };
  readonly about: {
    readonly headerSuper: string;
    readonly headerTitle: string;
    readonly closeAria: string;
    readonly privacyTitle: string;
    readonly privacyDesc: string;
    readonly openSourceTitle: string;
    readonly openSourceDesc: string;
    readonly repoButton: string;
    readonly serverlessTitle: string;
    readonly serverlessDesc: string;
    readonly disclaimerTitle: string;
    readonly disclaimerDesc: string;
    readonly understood: string;
  };
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  es: {
    common: {
      appSubtitle: 'VoiceLog — Bitácora Acústica',
      entriesCount: '{count} bloques',
      wordsCount: '{words} palabras',
      close: 'Cerrar',
      cancel: 'Cancelar',
      save: 'Guardar',
    },
    topBar: {
      settingsTooltip: 'Motor de transcripción y ajustes',
      infoTooltip: 'Acerca de VoiceLog',
      resetTooltip: 'Limpiar bitácora efímera',
    },
    modes: {
      sectionLabel: 'Flujo de estructuración',
      title: 'Selecciona el formato de bitácora',
      subtitle: 'Habla por ráfagas cortas, revisa el audio de cada bloque y descarga un archivo Markdown limpio.',
      chronoTitle: 'Bitácora cronológica',
      chronoDesc: 'Prefija cada entrada con marca de tiempo [HH:MM:SS] y nivel (INFO, FIX, WARN). Ideal para incidentes y debugging.',
      quickTitle: 'Nota rápida estructurada',
      quickDesc: 'Agrupa ideas habladas en párrafos, títulos, bloques de código y notas al margen listas para Obsidian.',
      tasksTitle: 'Lista de tareas',
      tasksDesc: 'Convierte cada captura de voz en ítems de verificación (- [ ]) que puedes marcar y reordenar.',
      standupTitle: 'Daily / Standup',
      standupDesc: 'Clasifica tus notas de voz en Avances, Próximos pasos y Bloqueos en una sola hoja.',
      startRecordingBtn: 'Capturar bloque de voz',
      addTextBlockBtn: 'Agregar bloque escrito',
    },
    recorder: {
      statusListening: 'Capturando voz en cliente',
      statusProcessing: 'Procesando señal acústica y estructura Markdown...',
      liveTranscriptLabel: 'Transcripción en curso (editable antes de guardar)',
      placeholderSpeaking: 'Habla ahora o escribe aquí. Puedes decir "título...", "tarea pendiente..." o "nota importante..."',
      markerKindLabel: 'Tipo de bloque actual (toque rápido)',
      kindParagraph: 'Párrafo',
      kindHeading: 'Título ##',
      kindTask: 'Tarea [ ]',
      kindCallout: 'Nota >',
      kindImportant: 'Alerta !',
      kindCode: 'Código ```',
      stopAndSaveBtn: 'Guardar bloque en bitácora',
      splitBlockBtn: 'Guardar y seguir hablando',
      fallbackWhisperNotice: 'Reconocimiento en vivo no disponible; al guardar se transcribirá automáticamente con Whisper Offline.',
      micErrorNotice: 'No se pudo acceder al micrófono. Verifica los permisos o escribe el bloque manualmente.',
    },
    review: {
      sessionTitleLabel: 'Título del documento',
      addVoiceBurstBtn: 'Grabar nuevo bloque',
      addManualBlockBtn: 'Bloque manual',
      tabBlocks: 'Bloques y audio',
      tabMarkdown: 'Vista Markdown (.md)',
      frontmatterToggle: 'YAML Frontmatter',
      cleanFillersToggle: 'Limpiar muletillas',
      aiStructureBtn: 'Pulir con Gemini',
      aiStructuring: 'Estructurando...',
      aiResetBtn: 'Restaurar bloques',
      downloadMdBtn: 'Descargar .md',
      copyMdBtn: 'Copiar Markdown',
      copiedLabel: 'Copiado',
      shareBtn: 'Compartir',
      playAudioTooltip: 'Reproducir audio original de este bloque',
      stopAudioTooltip: 'Detener reproducción',
      downloadWavTooltip: 'Descargar audio .wav de este bloque',
      emptyEntriesHint: 'No hay bloques registrados aún.',
    },
    settings: {
      modalTitle: 'Configuración de transcripción',
      engineSection: 'Motor acústico en cliente',
      engineWebSpeech: 'Híbrido Web Speech + Reglas de dominio',
      engineWebSpeechDesc: 'Transcripción instantánea de baja latencia combinada con limpieza determinista y respaldo WAV local.',
      engineWhisper: 'Whisper Neural Offline (Web Worker WASM)',
      engineWhisperDesc: 'Descarga y ejecuta el modelo neuronal Whisper ONNX en un Web Worker local para transcripción 100% offline.',
      engineManual: 'Captura manual asistida + Respaldo WAV',
      engineManualDesc: 'Graba el bloque de audio WAV mientras escribes o estructuras la nota manualmente sin reconocimiento automático.',
      whisperStatusIdle: 'Modelo Whisper listo para descargar bajo demanda',
      whisperStatusDownloading: 'Descargando modelo Whisper ({progress}%)...',
      whisperStatusReady: 'Modelo Whisper descargado y activo en caché local (100%)',
      whisperStatusError: 'Error al descargar el modelo Whisper',
      whisperDownloadBtn: 'Descargar modelo ahora',
      commandsSection: 'Comandos de voz detectados automáticamente',
      commandsHelp: 'Di "título", "tarea pendiente", "nota importante" o "bloque de código" al inicio de una frase para formatear el nodo.',
    },
    about: {
      headerSuper: 'Transparencia y Seguridad',
      headerTitle: 'Acerca de VoiceLog',
      closeAria: 'Cerrar modal de información',
      privacyTitle: 'Privacidad por diseño',
      privacyDesc: 'Procesamiento 100% en el dispositivo. Tus grabaciones de voz y notas nunca viajan a servidores propios ni se almacenan fuera de tu navegador.',
      openSourceTitle: 'Gratuito y código abierto',
      openSourceDesc: 'Sin publicidad, rastreadores ni suscripciones. Puedes auditar o compilar el código fuente tú mismo.',
      repoButton: 'Repositorio en GitHub',
      serverlessTitle: 'Arquitectura sin servidor',
      serverlessDesc: 'Análisis acústico VAD, codificación WAV y compilación de bloques Markdown mediante Web Workers e IndexedDB efímero.',
      disclaimerTitle: 'Exención de responsabilidad',
      disclaimerDesc: 'El software se entrega bajo la premisa "tal cual" (as is), sin garantías de ningún tipo. Los autores se eximen de cualquier responsabilidad sobre pérdida de datos o el uso de los archivos. El usuario asume la custodia exclusiva de sus grabaciones y notas.',
      understood: 'Entendido',
    },
  },
  en: {
    common: {
      appSubtitle: 'VoiceLog — Acoustic Logbook',
      entriesCount: '{count} blocks',
      wordsCount: '{words} words',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
    },
    topBar: {
      settingsTooltip: 'Transcription engine and settings',
      infoTooltip: 'About VoiceLog',
      resetTooltip: 'Clear ephemeral logbook',
    },
    modes: {
      sectionLabel: 'Structuring workflow',
      title: 'Select your logbook format',
      subtitle: 'Speak in short voice bursts, replay block audio while reviewing, and download a clean Markdown file.',
      chronoTitle: 'Chronological log',
      chronoDesc: 'Prefixes each entry with [HH:MM:SS] timestamp and severity (INFO, FIX, WARN). Built for incidents and debugging.',
      quickTitle: 'Structured quick note',
      quickDesc: 'Organizes spoken thoughts into paragraphs, headings, code blocks, and callouts ready for Obsidian.',
      tasksTitle: 'Action items checklist',
      tasksDesc: 'Turns each voice burst into interactive checklist items (- [ ]) you can toggle and reorder.',
      standupTitle: 'Daily / Standup',
      standupDesc: 'Classifies voice notes into Progress, Next steps, and Blockers on a single sheet.',
      startRecordingBtn: 'Capture voice block',
      addTextBlockBtn: 'Add written block',
    },
    recorder: {
      statusListening: 'Capturing client-side audio',
      statusProcessing: 'Processing acoustic signal and Markdown AST...',
      liveTranscriptLabel: 'Live transcript (editable before saving)',
      placeholderSpeaking: 'Speak now or type here. Say "heading...", "todo item..." or "important note..."',
      markerKindLabel: 'Current block kind (quick tap)',
      kindParagraph: 'Paragraph',
      kindHeading: 'Heading ##',
      kindTask: 'Task [ ]',
      kindCallout: 'Note >',
      kindImportant: 'Alert !',
      kindCode: 'Code ```',
      stopAndSaveBtn: 'Save block to logbook',
      splitBlockBtn: 'Save and keep speaking',
      fallbackWhisperNotice: 'Live speech recognition unavailable; audio will be automatically transcribed with Offline Whisper on save.',
      micErrorNotice: 'Could not access microphone. Check permissions or type your block manually.',
    },
    review: {
      sessionTitleLabel: 'Document title',
      addVoiceBurstBtn: 'Record new block',
      addManualBlockBtn: 'Manual block',
      tabBlocks: 'Blocks & audio',
      tabMarkdown: 'Markdown view (.md)',
      frontmatterToggle: 'YAML Frontmatter',
      cleanFillersToggle: 'Strip verbal fillers',
      aiStructureBtn: 'Polish with Gemini',
      aiStructuring: 'Structuring...',
      aiResetBtn: 'Restore blocks',
      downloadMdBtn: 'Download .md',
      copyMdBtn: 'Copy Markdown',
      copiedLabel: 'Copied',
      shareBtn: 'Share',
      playAudioTooltip: 'Play original audio for this block',
      stopAudioTooltip: 'Stop playback',
      downloadWavTooltip: 'Download .wav audio for this block',
      emptyEntriesHint: 'No blocks recorded yet.',
    },
    settings: {
      modalTitle: 'Transcription settings',
      engineSection: 'Client-side acoustic engine',
      engineWebSpeech: 'Hybrid Web Speech + Domain Rules',
      engineWebSpeechDesc: 'Low-latency live recognition combined with deterministic filler stripping and local WAV backup.',
      engineWhisper: 'Whisper Neural Offline (WASM Web Worker)',
      engineWhisperDesc: 'Downloads and runs the Whisper ONNX neural model inside a local Web Worker for 100% offline transcription.',
      engineManual: 'Manual Assisted Capture + WAV Backup',
      engineManualDesc: 'Records WAV audio while you type and structure your note manually without automatic speech recognition.',
      whisperStatusIdle: 'Whisper model ready for on-demand download',
      whisperStatusDownloading: 'Downloading Whisper model ({progress}%)...',
      whisperStatusReady: 'Whisper model downloaded and cached locally (100%)',
      whisperStatusError: 'Failed to download Whisper model',
      whisperDownloadBtn: 'Download model now',
      commandsSection: 'Automatically detected spoken commands',
      commandsHelp: 'Say "heading", "todo item", "important note", or "code block" at the start of a sentence to format the node.',
    },
    about: {
      headerSuper: 'Transparency and Security',
      headerTitle: 'About VoiceLog',
      closeAria: 'Close information modal',
      privacyTitle: 'Privacy by design',
      privacyDesc: '100% on-device processing. Your voice recordings and notes never leave your browser nor transmit to any external server.',
      openSourceTitle: 'Free and open source',
      openSourceDesc: 'No ads, trackers, or subscriptions. You can audit or compile the source code yourself.',
      repoButton: 'GitHub Repository',
      serverlessTitle: 'Serverless architecture',
      serverlessDesc: 'Acoustic VAD analysis, WAV encoding, and Markdown AST compilation via Web Workers and ephemeral IndexedDB.',
      disclaimerTitle: 'Disclaimer',
      disclaimerDesc: 'Software is provided "as is" without warranties of any kind. Authors disclaim liability for data loss or usage. The user maintains sole custody of recordings and files.',
      understood: 'Understood',
    },
  },
};
