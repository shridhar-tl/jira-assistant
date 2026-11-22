export function getEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
}

export function getOptionalEnv(name) {
    return process.env[name] || '';
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseBody(text) {
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function request(label, url, init) {
    const response = await fetch(url, init);
    const body = parseBody(await response.text());
    if (!response.ok) {
        const details = typeof body === 'string' ? body : JSON.stringify(body);
        throw new Error(`${label} failed with HTTP ${response.status}: ${details}`);
    }
    return { response, body };
}

export async function poll(label, check, { intervalMs = 5000, timeoutMs = 15 * 60 * 1000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await check();
        if (result !== undefined) {
            return result;
        }
        if (Date.now() > deadline) {
            throw new Error(`${label} did not finish within ${timeoutMs / 1000} seconds`);
        }
        await sleep(intervalMs);
    }
}

export async function run(main) {
    try {
        await main();
    } catch (err) {
        console.error(`::error::${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
    }
}
