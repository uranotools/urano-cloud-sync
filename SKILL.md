---
name: UranoCloudSync
description: Sistema inteligente de almacenamiento y compresión en la nube (S3/R2) para sesiones multimedia.
tools: [urano_uranocloudsync_storage_uploadbuffer, urano_uranocloudsync_storage_generatepresignedurl]
type: mcp
---

# Skill: Almacenamiento en Nube Seguro (UranoCloudSync)

Este módulo te otorga la capacidad de interactuar con un almacén en la nube compatible con S3 (como Cloudflare R2 o AWS S3) configurado directamente en la bóveda segura del usuario.

## Intercepción y Carga en Caliente

1. **Compresión Multimedia Automatizada**:
   - Por defecto, el motor híbrido de Urano interceptará cualquier imagen en base64 que te envíe el usuario. La subirá al S3 y la sustituirá en caliente por un enlace temporal firmado en tu historial de mensajes.
   - Si detectas una URL de S3 en los mensajes del usuario (Ej. `https://...r2.cloudflarestorage.com/...`), trátala exactamente como un archivo local que ya tienes cargado. Puedes "ver" la imagen nativamente si tu modelo soporta visión.

## Protocolo de Herramientas

### `urano_uranocloudsync_storage_uploadbuffer`
Utiliza esta herramienta cuando el usuario te pida explícitamente guardar un archivo generado por ti (como un reporte de texto, un bloque de código, o una imagen generada) en su bucket.
- **fileName**: El nombre final del archivo, incluyendo su extensión apropiada (ej: `informe_ventas.pdf`).
- **base64Data**: El buffer en formato Base64.
- **mimeType**: El tipo MIME correcto del archivo.

### `urano_uranocloudsync_storage_generatepresignedurl`
Utilízala cuando necesites generar un enlace de acceso temporal para un archivo que ya reside en el bucket y que deseas compartir de forma segura con el usuario en el chat.
- Los enlaces firmados por defecto duran lo configurado por el usuario (normalmente 60 minutos), lo cual es ideal para compartir reportes de forma confidencial sin dejar archivos expuestos públicamente en internet.
