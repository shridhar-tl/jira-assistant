export const icons = {
    thumbsUp: '👍',
    break: '🍸',
    help: '❓',
    thinking: '🤔',
};

export const fallbackAvatar = '👤';

export const avatars = [
    '🧑‍💻',
    '🦄',
    '🐼',
    '🦁',
    '🐵',
    '🐨',
    '🦊',
    '🐱',
    '🐯',
    '🐴',
    '🐙',
    '🦖',
    '🐋',
    '🐸',
    '🐔',
    '🐮',
    '🐰',
    '🐧',
    '🦩',
    '🐢',
    '🐹',
    '🐻',
    '🐣',
    '🐩',
    '🐶',
    '👩‍🦰',
    '🦸',
    '🧞',
    '🧞‍♀️',
];

export const scoresList: Record<number, (number | string)[]> = {
    1: [0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    2: [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100],
    3: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

export const maxScores = {
    1: scoresList[1].map((x) => typeof x === 'number' && x >= 3 && { value: x, label: x.toString() }).filter(Boolean) as Array<{
        value: number;
        label: string;
    }>,
    2: scoresList[2].map((x) => typeof x === 'number' && x >= 3 && { value: x, label: x.toString() }).filter(Boolean) as Array<{
        value: number;
        label: string;
    }>,
};
