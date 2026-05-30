import { EnginePluginBase, EnginePreProcessResult } from '@core/EnginePluginBase';
import type { SessionContext } from '@core/runtime/SessionContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class UranoCloudSyncEnginePlugin extends EnginePluginBase {

    private getS3Client(ctx: SessionContext): { client: S3Client; bucketName: string; expirationSecs: number } {
        const provider = ctx.getSecret('STORAGE_PROVIDER');
        const bucketName = ctx.getSecret('BUCKET_NAME');
        const endpoint = ctx.getSecret('S3_ENDPOINT');
        const accessKeyId = ctx.getSecret('AWS_ACCESS_KEY_ID');
        const secretAccessKey = ctx.getSecret('AWS_SECRET_ACCESS_KEY');
        const expirationMinRaw = ctx.getSecret('URL_EXPIRATION_MINUTES') || '60';

        if (!bucketName || !accessKeyId || !secretAccessKey) {
            throw new Error("Faltan configuraciones mandatorias de S3/R2 en el Vault (Bucket, Access Key, Secret Key).");
        }

        const expirationSecs = parseInt(expirationMinRaw, 10) * 60;

        const config: any = {
            credentials: {
                accessKeyId: accessKeyId.trim(),
                secretAccessKey: secretAccessKey.trim(),
            },
            region: provider === 'r2' ? 'auto' : 'us-east-1'
        };

        // Forzar endpoint personalizado para R2 o MinIO
        if (endpoint && endpoint.trim().length > 0) {
            config.endpoint = endpoint.trim();
            config.forcePathStyle = provider === 'minio'; // MinIO requiere estilo de ruta
        }

        const client = new S3Client(config);

        return { client, bucketName, expirationSecs };
    }

    async preMessageProcess(ctx: SessionContext, message: any): Promise<EnginePreProcessResult> {
        const enforceAutoUpload = ctx.getSecret('ENFORCE_AUTO_UPLOAD') === 'true';

        // Si la subida automática está desactivada, seguir con el flujo normal
        if (!enforceAutoUpload) {
            return { status: 'continue' };
        }

        try {
            // Verificar si el mensaje entrante contiene contenido estructurado (Array)
            if (message && Array.isArray(message.content)) {
                let modified = false;
                const { client, bucketName, expirationSecs } = this.getS3Client(ctx);

                // Recorrer las partes del mensaje buscando imágenes/adjuntos en Base64
                for (let i = 0; i < message.content.length; i++) {
                    const part = message.content[i];

                    if (part && part.type === 'image' && typeof part.image === 'string' && part.image.length > 0) {
                        const mimeType = part.mimeType || 'image/png';
                        const extension = mimeType.split('/')[1] || 'png';
                        const fileName = `sessions/${ctx.sessionId}/uploads/img-${Date.now()}-${i}.${extension}`;

                        // 1. Convertir Base64 a Buffer binario
                        const buffer = Buffer.from(part.image, 'base64');

                        // 2. Subir archivo a S3/R2
                        await client.send(new PutObjectCommand({
                            Bucket: bucketName,
                            Key: fileName,
                            Body: buffer,
                            ContentType: mimeType
                        }));

                        // 3. Generar la URL temporal firmada (Presigned URL)
                        const signedUrl = await getSignedUrl(
                            client,
                            new PutObjectCommand({ Bucket: bucketName, Key: fileName }),
                            { expiresIn: expirationSecs }
                        );

                        // 4. Mutar la parte del mensaje para alivianar el payload
                        // En lugar del pesado base64, enviamos una referencia de texto y URL
                        message.content[i] = {
                            type: 'text',
                            text: `[Archivo Multimedia Sincronizado en S3: ${signedUrl}]`
                        };

                        modified = true;
                    }
                }

                if (modified) {
                    // Agregar badge de éxito de optimización
                    ctx.addBadge({
                        id: 'cloudsync-upload-badge',
                        label: '⚡ Multimedia Sincronizado S3',
                        color: 'success',
                        icon: 'CloudUpload'
                    });

                    return {
                        status: 'continue',
                        modifiedMessage: message
                    };
                }
            }
        } catch (e: any) {
            console.error('[UranoCloudSync] Error en la subida en caliente:', e);
            
            // Inyectar alerta silenciosa del fallo en la sesión
            ctx.injectSystemMessage(`[ALERTA CLOUDSYNC: La carga automática falló: ${e.message}]`);
            
            ctx.addBadge({
                id: 'cloudsync-upload-badge',
                label: '⚠️ Falló Carga S3',
                color: 'warning',
                icon: 'CloudOffline'
            });
        }

        return { status: 'continue' };
    }
}
