// Publishes a packaged extension to the Chrome Web Store using API v2.
// https://developer.chrome.com/docs/webstore/using-api
import { readFile } from 'node:fs/promises';

import { getEnv, poll, request, run } from './common.mjs';

const apiBase = 'https://chromewebstore.googleapis.com';

async function getAccessToken() {
    const { body } = await request('Chrome access token', 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: getEnv('CHROME_CLIENT_ID'),
            client_secret: getEnv('CHROME_CLIENT_SECRET'),
            refresh_token: getEnv('CHROME_REFRESH_TOKEN'),
            grant_type: 'refresh_token',
        }),
    });
    return body.access_token;
}

run(async () => {
    const itemPath = `publishers/${getEnv('CHROME_PUBLISHER_ID')}/items/${getEnv('CHROME_EXTENSION_ID')}`;
    const packagePath = getEnv('PACKAGE_PATH');
    const authHeader = { Authorization: `Bearer ${await getAccessToken()}` };

    console.log(`Uploading ${packagePath}`);
    const { body: upload } = await request('Chrome upload', `${apiBase}/upload/v2/${itemPath}:upload`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/zip' },
        body: await readFile(packagePath),
    });

    let uploadState = upload.uploadState;
    if (uploadState === 'IN_PROGRESS') {
        uploadState = await poll('Chrome upload processing', async () => {
            const { body: status } = await request('Chrome fetch status', `${apiBase}/v2/${itemPath}:fetchStatus`, {
                headers: authHeader,
            });
            return status.lastAsyncUploadState === 'IN_PROGRESS' ? undefined : status.lastAsyncUploadState;
        });
    }
    if (uploadState !== 'SUCCEEDED') {
        throw new Error(`Chrome upload ended with state ${uploadState}: ${JSON.stringify(upload)}`);
    }
    console.log(`Uploaded version ${upload.crxVersion}`);

    const { body: published } = await request('Chrome publish', `${apiBase}/v2/${itemPath}:publish`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishType: 'DEFAULT_PUBLISH' }),
    });
    if (published.warningInfo) {
        console.log(`::warning::Chrome publish warnings: ${JSON.stringify(published.warningInfo)}`);
    }
    console.log(`Submitted for review. Current state: ${published.state}`);
});
