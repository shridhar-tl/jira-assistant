import { memo, type ReactNode } from 'react';

import { getGitHubIssueUrl } from '@/constants/urls';

interface TextParserProps {
    message: string;
}

const textParserRegex = /#\d+|(https?):\/\/(www\.)?[a-z0-9.:].*?(?<!\.\.?)(?=\s|[.]$|$)/gi;

function parseText(msg: string): ReactNode[] | string {
    if (!msg || typeof msg !== 'string') {
        return msg;
    }

    const msgArr: ReactNode[] = [];
    let testResult: RegExpExecArray | null = null;
    let startIdx = 0;

    textParserRegex.lastIndex = 0;

    while ((testResult = textParserRegex.exec(msg))) {
        const str = testResult[0];
        const idx = testResult.index;
        msgArr.push(msg.substring(startIdx, idx));
        const url = str.startsWith('#') ? getGitHubIssueUrl(str) : str;
        msgArr.push(
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                {str}
            </a>,
        );
        startIdx = idx + str.length;
    }

    if (startIdx < msg.length) {
        msgArr.push(msg.substring(startIdx));
    }

    return msgArr.length ? msgArr : msg;
}

function TextParser({ message }: TextParserProps) {
    return <>{parseText(message)}</>;
}

export default memo(TextParser);
