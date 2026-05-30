export const UranoCloudSyncConfig = {
    name: "UranoCloudSync",
    description: "Sube archivos y capturas multimedia a tu bucket S3/R2 en caliente para reducir el coste de tokens del LLM de forma transparente.",
    icon: "CloudLightning",
    category: "Almacenamiento",

    // ── CONFIGURACIÓN DEL ENGINE MIDDLEWARE ──
    enginePlugin: true,
    engineHooks: [
        'preMessageProcess'
    ],

    // Habilitado para ambos mundos (Desktop y Cloud)
    inCloud: true,
    inDesktop: true,

    // ── VARIABLES DE ENTORNO EN CRIPTOGRAFÍA DE VAULT POR TENANT / USUARIO ──
    settings: [
        {
            name: 'STORAGE_PROVIDER',
            type: 'select',
            title: 'Proveedor de Almacenamiento',
            options: [
                { label: 'Cloudflare R2', value: 'r2' },
                { label: 'Amazon S3', value: 's3' },
                { label: 'MinIO (Local/Self-hosted)', value: 'minio' }
            ],
            required: true
        },
        {
            name: 'BUCKET_NAME',
            type: 'text',
            title: 'Nombre del Bucket',
            required: true
        },
        {
            name: 'S3_ENDPOINT',
            type: 'text',
            title: 'Endpoint S3 Personalizado',
            description: 'Obligatorio para Cloudflare R2 (ej: https://<account_id>.r2.cloudflarestorage.com) o MinIO'
        },
        {
            name: 'AWS_ACCESS_KEY_ID',
            type: 'password',
            title: 'Access Key ID',
            required: true
        },
        {
            name: 'AWS_SECRET_ACCESS_KEY',
            type: 'password',
            title: 'Secret Access Key',
            required: true
        },
        {
            name: 'URL_EXPIRATION_MINUTES',
            type: 'text',
            title: 'Caducidad de URLs firmadas (minutos)',
            description: 'Tiempo de validez de los enlaces generados. Default: 60'
        },
        {
            name: 'ENFORCE_AUTO_UPLOAD',
            type: 'select',
            title: 'Subida Automática en Caliente',
            options: [
                { label: 'Sí, subir todo e inyectar URLs', value: 'true' },
                { label: 'No, subir solo a demanda de herramientas', value: 'false' }
            ],
            description: 'Si se activa, el middleware subirá automáticamente cualquier imagen o adjunto Base64 recibido.'
        }
    ],

    // ── ESQUEMAS DE HERRAMIENTAS MCP EXPUESTAS AL AGENTE ──
    pluginSchemas: {
        Storage: {
            actions: {
                uploadBuffer: {
                    label: 'Subir Archivo al S3',
                    description: 'Sube un archivo/buffer binario al bucket configurado en la sesión y genera un link de acceso firmado.',
                    fields: [
                        { name: 'fileName', type: 'required', label: 'Nombre del Archivo (con extensión)' },
                        { name: 'base64Data', type: 'required', label: 'Contenido del archivo en Base64' },
                        { name: 'mimeType', type: 'text', label: 'MimeType del archivo (Ej: image/png, application/pdf)' }
                    ]
                },
                generatePresignedURL: {
                    label: 'Generar Enlace Temporal',
                    description: 'Obtiene una URL firmada de descarga temporal para un archivo existente en el bucket.',
                    fields: [
                        { name: 'keyName', type: 'required', label: 'Ruta/Clave del archivo en el bucket (Key Name)' },
                        { name: 'customExpiration', type: 'text', label: 'Expiración personalizada en minutos (Ej: 30)' }
                    ]
                }
            }
        }
    }
};
