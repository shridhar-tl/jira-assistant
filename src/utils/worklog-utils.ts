/**
 * Worklog utility functions
 */

interface CommentNode {
    type?: string;
    text?: string;
    content?: CommentNode[];
}

interface CommentContent {
    content?: CommentNode[];
}

/**
 * Convert Jira comment object to plain text string
 */
export function stringifyComment(comment: string | CommentContent | undefined | null): string {
    if (!comment || typeof comment === 'string') {
        return comment || '';
    }

    if ('content' in comment && comment.content) {
        return extractDescription(comment.content);
    }

    return '';
}

/**
 * Extract text description from Jira's ADF (Atlassian Document Format) structure
 */
function extractDescription(content: CommentNode[] | CommentNode | undefined | null): string {
    if (!content) {
        return '';
    }

    // Handle nested content objects
    if (!Array.isArray(content) && typeof content === 'object' && 'content' in content) {
        return extractDescription(content.content);
    }

    if (!Array.isArray(content)) {
        return '';
    }

    const lines: string[] = [];

    function extractTextFromNode(node: CommentNode | undefined | null): string {
        if (!node) {
            return '';
        }

        if (node.type === 'text') {
            return node.text || '';
        }

        if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractTextFromNode).join('');
        }

        return '';
    }

    for (const block of content) {
        switch (block.type) {
            case 'paragraph':
            case 'blockquote':
            case 'panel':
            case 'heading':
            case 'codeBlock':
                lines.push(extractTextFromNode(block));
                break;

            case 'bulletList':
            case 'orderedList':
                if (block.content && Array.isArray(block.content)) {
                    for (const item of block.content) {
                        if (item.type === 'listItem') {
                            const itemText = item.content?.map(extractTextFromNode).join('') || '';
                            lines.push(itemText);
                        }
                    }
                }
                break;

            default:
                lines.push(extractTextFromNode(block));
                break;
        }
    }

    return lines
        .filter((line) => line.trim().length > 0)
        .join('\n')
        .trim();
}
