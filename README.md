# ☁️ UranoCloudSync Híbrido MCP & Engine Plugin

Bienvenido al plugin **UranoCloudSync**, un módulo de arquitectura híbrida diseñado para integrarse nativamente tanto con **Urano Desktop** como con **Urano Cloud (SaaS Multi-tenant)**. 

Este plugin actúa como un puente inteligente y seguro entre tus chats omnicanal (WhatsApp, Telegram, Webchat) y tus buckets de almacenamiento en la nube compatibles con S3 (como Cloudflare R2, AWS S3 o MinIO), optimizando la memoria y costes de inferencia del LLM en tiempo real.

---

### 🚀 Una Nueva Era para el Almacenamiento de Agentes
Este plugin habilita capacidades críticas de optimización y resiliencia para tus bots:
*   **Compresión de Historial en Caliente**: Intercepta de forma transparente las imágenes y adjuntos Base64 pesados enviados por el usuario. Los sube al S3 y los sustituye por URLs temporales firmadas en el prompt, **reduciendo el consumo de tokens de visión hasta en un 90%** y evitando saturar el contexto del modelo.
*   **Gestión Multi-Tenant Aislada**: Las credenciales de S3 se almacenan cifradas en el Vault de Urano y se recuperan dinámicamente por Tenant/Usuario. Nunca hay fuga de llaves entre clientes en la nube.
*   **Acceso Temporal Seguro**: Utiliza enlaces temporales pre-firmados (Presigned URLs) con expiración configurable, ideal para compartir archivos corporativos (PDFs, facturas) de manera confidencial y cumpliendo regulaciones de seguridad de datos (GDPR, PCI-DSS).

---

## 🏗️ Estructura del Proyecto

El plugin sigue la arquitectura híbrida avanzada de Urano:

```text
UranoCloudSync/
├── 📄 config.ts                 # Manifiesto, settings del Vault y schemas de herramientas MCP
├── 📄 SKILL.md                  # Manual de instrucciones cognitivo para el Agente (System Prompt)
├── 📄 package.json              # Metadatos del módulo y dependencias (esbuild, AWS SDK v3)
├── 📄 tsconfig.json             # Configuraciones para soporte TypeScript en el IDE
├── 📁 Plugins/
│   ├── 📁 Engine/
│   │   └── 📄 UranoCloudSyncEnginePlugin.ts # Middleware de intercepción en caliente (preMessageProcess)
│   └── 📁 Storage/
│       └── 📄 StoragePlugin.ts              # Resolvedor de herramientas MCP de subida y URLs firmadas
└── 📁 dist/                     # Código transpilado y unificado unificado para distribución
```

---

## 🧠 Lógica de Funcionamiento

**UranoCloudSync** opera en dos frentes simultáneos:

1.  **Middleware Silencioso (Engine Plugin)**:
    *   Al recibir un mensaje con adjuntos multimedia (ej: fotos de WhatsApp), el Engine intercepta el payload en el hook `preMessageProcess`.
    *   Subirá los binarios al bucket configurado usando un timeout estricto de resiliencia de **2 segundos**.
    *   Si tiene éxito, inyecta el Badge `⚡ Multimedia Sincronizado S3` en la cabecera del chat y reemplaza el Base64 por la URL firmada.
2.  **Herramientas para el Agente (MCP Plugin)**:
    *   **`uploadBuffer`**: El agente puede generar archivos (reportes, planillas) y subirlos directamente a la nube a nombre del usuario.
    *   **`generatePresignedURL`**: El agente puede crear y dar enlaces firmados de descarga temporal a archivos ya existentes en el bucket.

---

## 💡 Ideas de Flujos que puedes crear

Gracias a esta arquitectura, puedes potenciar tus bots en WhatsApp o WebChat:

*   **Validador de Comprobantes de Pago**: Tu bot de ventas puede recibir fotos de comprobantes por WhatsApp, subirlos al R2 de la empresa de forma permanente, y enviarle el link al modelo para que los valide visualmente.
*   **Generador y Distribuidor de Facturas**: El agente redacta un reporte o PDF, lo sube usando `uploadBuffer` y le devuelve al usuario un enlace de descarga seguro válido por 15 minutos.
*   **Galería Multimedia de Soporte**: Permite que tus bots registren evidencias de soporte técnico en carpetas organizadas por sesión y fecha.

---

## 🛠️ Comandos de Desarrollo

Si deseas modificar o compilar el plugin para publicarlo en el Marketplace:

*   **`npm install`**: Instala las dependencias del SDK v3 de AWS localmente.
*   **`npm run build`**: Ejecuta `esbuild` para transpilar el código TypeScript y unificar todas las dependencias externas en archivos CommonJS súper ligeros dentro de la carpeta `dist/` (excluyendo `@core/*` para cumplir el estándar Plug & Play).

---

## 🚀 Instalación y Prueba

### En Urano Desktop:
1.  En Urano Desktop, ve a **Integraciones > MCP Manager > Pestaña Desarrollador**.
2.  Haz clic en **Vincular Carpeta Local** y selecciona este directorio.
3.  Configura las llaves de tu bucket en el panel de **Integraciones > UranoCloudSync**.
4.  ¡Listo! Tu agente tiene acceso instantáneo al almacenamiento en la nube.

---

Desarrollado con ❤️ para el ecosistema omnicanal de [UranoTools](https://uranoai.com).
