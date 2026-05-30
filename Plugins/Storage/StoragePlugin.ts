import { PluginBase } from '@core/PluginBase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class StoragePlugin extends PluginBase {
    private configStore: any;

    constructor(moduleConfig: any) {
        super(moduleConfig);
        this.configStore = moduleConfig;
    }

    private getS3Client(): { client: S3Client; bucketName: string; defaultExpirationSecs: number } {
        const provider = this.configStore.STORAGE_PROVIDER;
        const bucketName = this.configStore.BUCKET_NAME;
        const endpoint = this.configStore.S3_ENDPOINT;
        const accessKeyId = this.configStore.AWS_ACCESS_KEY_ID;
        const secretAccessKey = this.configStore.AWS_SECRET_ACCESS_KEY;
        const expirationMinRaw = this.configStore.URL_EXPIRATION_MINUTES || '60';

        if (!bucketName || !accessKeyId || !secretAccessKey) {
            throw new Error("Faltan configuraciones mandatorias de S3/R2 en el Vault (Bucket, Access Key, Secret Key).");
        }

        const defaultExpirationSecs = parseInt(expirationMinRaw, 10) * 60;

        const config: any = {
            credentials: {
                accessKeyId: accessKeyId.trim(),
                secretAccessKey: secretAccessKey.trim(),
            },
            region: provider === 'r2' ? 'auto' : 'us-east-1'
        };

        if (endpoint && endpoint.trim().length > 0) {
            config.endpoint = endpoint.trim();
            config.forcePathStyle = provider === 'minio';
        }

        const client = new S3Client(config);

        return { client, bucketName, defaultExpirationSecs };
    }

    async executeAction(action: string, payload: any) {
        const { client, bucketName, defaultExpirationSecs } = this.getS3Client();

        if (action === 'uploadBuffer') {
            const { fileName, base64Data, mimeType } = payload;
            const sessionId = payload._sessionId || 'global';

            if (!fileName || !base64Data) {
                throw new Error("Parámetros insuficientes: fileName y base64Data son requeridos.");
            }

            try {
                // Estructurar ruta dentro de la sesión de chat
                const s3Key = `sessions/${sessionId}/files/${fileName}`;
                const buffer = Buffer.from(base64Data, 'base64');
                const contentType = mimeType || 'application/octet-stream';

                await client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: contentType
                }));

                // Generar link firmado inmediato
                const signedUrl = await getSignedUrl(
                    client,
                    new PutObjectCommand({ Bucket: bucketName, Key: s3Key }),
                    { expiresIn: defaultExpirationSecs }
                );

                return {
                    success: true,
                    key: s3Key,
                    url: signedUrl,
                    message: `Archivo "${fileName}" guardado correctamente en la bóveda Cloud.`
                };
            } catch (e: any) {
                throw new Error(`Fallo de S3 Upload: ${e.message}`);
            }
        }

        if (action === 'generatePresignedURL') {
            const { keyName, customExpiration } = payload;

            if (!keyName) {
                throw new Error("El parámetro keyName es requerido.");
            }

            try {
                const expirationSecs = customExpiration 
                    ? parseInt(customExpiration, 10) * 60 
                    : defaultExpirationSecs;

                const signedUrl = await getSignedUrl(
                    client,
                    new PutObjectCommand({ Bucket: bucketName, Key: keyName }),
                    { expiresIn: expirationSecs }
                );

                return {
                    success: true,
                    url: signedUrl,
                    expiresInSecs: expirationSecs
                };
            } catch (e: any) {
                throw new Error(`Fallo al generar URL firmada: ${e.message}`);
            }
        }

        throw new Error(`Acción "${action}" no soportada en el plugin de Storage.`);
    }
}
