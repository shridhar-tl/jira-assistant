// Publishes a packaged extension as a new listed version on addons.mozilla.org using API v5.
// https://mozilla.github.io/addons-server/topics/api/addons.html
import { createHmac, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { getEnv, getOptionalEnv, poll, request, run } from './common.mjs';

const apiBase = 'https://addons.mozilla.org/api/v5';

const toBase64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

// AMO expects a fresh short-lived JWT on every request.
function authHeader() {
    const issuedAt = Math.floor(Date.now() / 1000);
    const unsigned = `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url({
        iss: getEnv('FIREFOX_JWT_ISSUER'),
        jti: randomUUID(),
        iat: issuedAt,
        exp: issuedAt + 60,
    })}`;
    const signature = createHmac('sha256', getEnv('FIREFOX_JWT_SECRET')).update(unsigned).digest('base64url');
    return { Authorization: `JWT ${unsigned}.${signature}` };
}

async function fileField(path) {
    return [new Blob([await readFile(path)]), basename(path)];
}

function validationErrors(validation) {
    const messages = validation?.messages ?? [];
    return messages
        .filter((message) => message.type === 'error')
        .map((message) => `${message.message}${message.file ? ` (${message.file})` : ''}`)
        .join('; ');
}

run(async () => {
    const addonGuid = getEnv('FIREFOX_ADDON_GUID');
    const packagePath = getEnv('PACKAGE_PATH');
    const sourcePath = getEnv('SOURCE_PATH');
    const approvalNotes = getOptionalEnv('FIREFOX_APPROVAL_NOTES');

    console.log(`Uploading ${packagePath}`);
    const uploadForm = new FormData();
    uploadForm.append('upload', ...(await fileField(packagePath)));
    uploadForm.append('channel', 'listed');
    const { body: upload } = await request('Firefox upload', `${apiBase}/addons/upload/`, {
        method: 'POST',
        headers: authHeader(),
        body: uploadForm,
    });

    const validated = await poll('Firefox validation', async () => {
        const { body: status } = await request('Firefox upload status', `${apiBase}/addons/upload/${upload.uuid}/`, {
            headers: authHeader(),
        });
        return status.processed ? status : undefined;
    });
    if (!validated.valid) {
        throw new Error(`Firefox validation failed: ${validationErrors(validated.validation) || 'see AMO developer hub'}`);
    }
    console.log(`Validated version ${validated.version}`);

    const versionForm = new FormData();
    versionForm.append('upload', upload.uuid);
    versionForm.append('source', ...(await fileField(sourcePath)));
    if (approvalNotes) {
        versionForm.append('approval_notes', approvalNotes);
    }
    const { body: version } = await request(
        'Firefox version create',
        `${apiBase}/addons/addon/${encodeURIComponent(addonGuid)}/versions/`,
        { method: 'POST', headers: authHeader(), body: versionForm }
    );
    console.log(`Submitted version ${version.version} for review`);
});
