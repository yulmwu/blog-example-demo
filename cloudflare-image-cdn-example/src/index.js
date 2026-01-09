import { parsePositiveInt, clampInt } from './helpers.js'

const RAW_PREFIX = '/raw/'
const IMG_PREFIX = '/img/'

const serveRawFromR2 = async (request, env, key) => {
    const obj = await env.IMAGES.get(key)
    if (!obj) return new Response('Image not found', { status: 404 })

    const etag = obj.httpEtag
    const ifNoneMatch = request.headers.get('if-none-match')
    if (etag && ifNoneMatch && ifNoneMatch === etag) {
        return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    const headers = new Headers()

    obj.writeHttpMetadata(headers)
    if (etag) headers.set('ETag', etag)

    headers.set('Cache-Control', 'public, max-age=31536000')

    if (!headers.get('Content-Type')) {
        headers.set('Content-Type', 'application/octet-stream')
    }

    return new Response(obj.body, { status: 200, headers })
}

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url)

            if (request.method !== 'GET' && request.method !== 'HEAD') {
                return new Response('Method Not Allowed', { status: 405 })
            }

            if (url.pathname.startsWith(RAW_PREFIX)) {
                const key = decodeURIComponent(url.pathname.slice(RAW_PREFIX.length))
                if (!key) return new Response('Missing key', { status: 400 })

                return serveRawFromR2(request, env, key)
            }

            if (url.pathname.startsWith(IMG_PREFIX)) {
                const key = decodeURIComponent(url.pathname.slice(IMG_PREFIX.length))
                if (!key) return new Response('Missing key', { status: 400 })

                const cacheKey = new Request(url.toString(), request)
                const cache = caches.default

                let cached = await cache.match(cacheKey)
                if (cached) return cached

                const rawUrl = new URL(url.toString())
                rawUrl.pathname = `${RAW_PREFIX}${encodeURIComponent(key)}`
                rawUrl.search = ''

                const w = parsePositiveInt(url.searchParams.get('w'))
                const h = parsePositiveInt(url.searchParams.get('h'))
                const q = clampInt(parsePositiveInt(url.searchParams.get('q')) ?? 85, 1, 100)
                const f = url.searchParams.get('f') ?? 'auto'

                const headers = new Headers()
                const accept = request.headers.get('accept')
                if (accept) headers.set('accept', accept)

                const resp = await fetch(rawUrl.toString(), {
                    method: request.method,
                    headers,
                    cf: {
                        image: {
                            fit: 'scale-down',
                            width: w ?? undefined,
                            height: h ?? undefined,
                            quality: q,
                            format: f,
                        },
                    },
                })

                if (!resp.ok) return resp

                const outHeaders = new Headers(resp.headers)
                outHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')

                const out = new Response(resp.body, {
                    status: resp.status,
                    headers: outHeaders,
                })

                ctx.waitUntil(cache.put(cacheKey, out.clone()))
                return out
            }

            return new Response('Not Found', { status: 404 })
        } catch (err) {
            console.error('Worker error:', err)
            return new Response('Error processing request', { status: 500 })
        }
    },
}
