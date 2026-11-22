// Publishes a packaged extension to Microsoft Edge Add-ons using the Update REST API v1.1.
// https://learn.microsoft.com/microsoft-edge/extensions/update/api/addons-api-reference
import { readFile } from 'node:fs/promises';

import { getEnv, poll, request, run } from './common.mjs';

function getOperationId(response, label) {
    const location = response.headers.get('location');
    if (!location) {
        throw new Error(`${label} did not return an operation ID`);
    }
    return location.split('/').filter(Boolean).pop();
}

function waitForOperation(label, url, headers) {
    return poll(label, async () => {
        const { body: operation } = await request(label, url, { headers });
        if (operation.status === 'InProgress') {
            return undefined;
        }
        if (operation.status !== 'Succeeded') {
            const errors = operation.errors ? ` ${JSON.stringify(operation.errors)}` : '';
            throw new Error(`${label} failed (${operation.errorCode || operation.status}): ${operation.message}${errors}`);
        }
        return operation;
    });
}

run(async () => {
    const productUrl = `https://api.addons.microsoftedge.microsoft.com/v1/products/${getEnv('EDGE_PRODUCT_ID')}`;
    const packagePath = getEnv('PACKAGE_PATH');
    const authHeaders = {
        Authorization: `ApiKey ${getEnv('EDGE_API_KEY')}`,
        'X-ClientID': getEnv('EDGE_CLIENT_ID'),
    };

    console.log(`Uploading ${packagePath}`);
    const { response: uploadResponse } = await request('Edge upload', `${productUrl}/submissions/draft/package`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/zip' },
        body: await readFile(packagePath),
    });
    const uploadOperationId = getOperationId(uploadResponse, 'Edge upload');
    const uploaded = await waitForOperation(
        'Edge upload processing',
        `${productUrl}/submissions/draft/package/operations/${uploadOperationId}`,
        authHeaders
    );
    console.log(uploaded.message);

    const { response: publishResponse } = await request('Edge publish', `${productUrl}/submissions`, {
        method: 'POST',
        headers: authHeaders,
    });
    const publishOperationId = getOperationId(publishResponse, 'Edge publish');
    const published = await waitForOperation(
        'Edge publish',
        `${productUrl}/submissions/operations/${publishOperationId}`,
        authHeaders
    );
    console.log(published.message);
});
