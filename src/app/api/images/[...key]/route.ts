import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const keyStr = key.join('/');
        const context = await getCloudflareContext();
        const bucket = context.env.BUCKET;

        if (!bucket) {
            return new Response('R2 Bucket not configured', { status: 500 });
        }

        const bucketObject = await bucket.get(keyStr);
        if (!bucketObject) {
            return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();

        // Use a local copy of metadata to avoid possible proxy issues
        const metadata = bucketObject.httpMetadata;
        if (metadata) {
            if (metadata.contentType) headers.set('content-type', metadata.contentType);
            if (metadata.contentEncoding) headers.set('content-encoding', metadata.contentEncoding);
            if (metadata.contentLanguage) headers.set('content-language', metadata.contentLanguage);
            if (metadata.contentDisposition) headers.set('content-disposition', metadata.contentDisposition);
            if (metadata.cacheControl) headers.set('cache-control', metadata.cacheControl);
        }

        // Security: Ensure Content-Type is limited to expected image types
        const contentType = headers.get('content-type') || '';
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(contentType)) {
            headers.set('content-type', 'application/octet-stream');
        }

        if (bucketObject.httpEtag) {
            headers.set('etag', bucketObject.httpEtag);
        }

        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");

        return new Response(bucketObject.body, {
            headers,
        });
    } catch (error) {
        console.error('Image serve error:', error);
        return new Response('Failed to serve image', { status: 500 });
    }
}
