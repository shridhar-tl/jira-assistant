import { memo, useEffect } from 'react';

import { showSnackbar } from '@components';

import type MessageService from '@services/message-service';

interface MessageBoxProps {
    $message: MessageService;
}

const MessageBox = memo(function MessageBox({ $message }: MessageBoxProps) {
    useEffect(() => {
        if (!$message) {
            return;
        }

        $message.onNewMessage(({ detail, summary, severity, life }) => {
            showSnackbar(detail, summary || '', {
                type: severity === 'warn' ? 'warning' : severity,
                timeout: life,
                showCloseButton: true,
            });
        });
    }, [$message]);

    return null;
});

export default MessageBox;
