export function createJiraClient(baseUrl, email, token) {
    const auth = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

    async function request(method, path, body, attempt = 0) {
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers: { Authorization: auth, Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if ((res.status === 429 || res.status >= 500) && attempt < 6) {
            const retryAfter = parseInt(res.headers.get('retry-after') || '', 10);
            await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
            return request(method, path, body, attempt + 1);
        }

        const text = await res.text();
        if (!res.ok) {
            const error = new Error(`${method} ${path} failed with ${res.status}: ${text.slice(0, 600)}`);
            error.status = res.status;
            throw error;
        }
        return text ? JSON.parse(text) : null;
    }

    return {
        get: (path) => request('GET', path),
        post: (path, body = {}) => request('POST', path, body),
        put: (path, body = {}) => request('PUT', path, body),
        delete: (path) => request('DELETE', path),
    };
}

export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

export async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (next < items.length) {
                const idx = next++;
                results[idx] = await worker(items[idx], idx);
            }
        }),
    );
    return results;
}

export function adf(text) {
    const paragraphs = text.split('\n').filter(Boolean);
    return {
        type: 'doc',
        version: 1,
        content: paragraphs.map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] })),
    };
}
