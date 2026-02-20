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

        const object = await bucket.get(keyStr);

        if (!object) {
            return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);

        // Security: Ensure Content-Type is limited to expected image types
        const contentType = headers.get('content-type') || '';
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(contentType)) {
            // Default to octet-stream for safety if it's not a known safe image type, 
            // though ideally we'd have validated this on upload.
            headers.set('content-type', 'application/octet-stream');
        }

        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");

        return new Response(object.body, {
            headers,
        });
    } catch (error) {
        console.error('Image serve error:', error);
        return new Response('Failed to serve image', { status: 500 });
    }
}
