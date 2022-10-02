export const Icons = {
    thumbsUp: '👍',
    break: '🍸',
    help: '❓',
    thinking: '🤔'
};

export const FallbackAvarar = '👤';

//https://www.rerail.io/TestingRoom
//https://tools.picsart.com/text/emojis
export const Avatars = [
    '🧑‍💻', '🦄', '🐼', '🦁', '🐵',
    '🐨', '🦊', '🐱', '🐯', '🐴',
    '🐙', '🦖', '🐋', '🐸', '🐔',
    '🐮', '🐰', '🐧', '🦩', '🐢',
    '🐹', '🐻', '🐣', '🐩', '🐶',
    '👩‍🦰', '🦸', '🧞', '🧞‍♀️'
];

export const scoresList = {
    1: [0, .5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    2: [0, .5, 1, 2, 3, 5, 8, 13, 20, 40, 100],
    3: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
};

export const maxScores = {
    1: scoresList[1].map(x => x >= 3 && ({ value: x, label: x })).filter(Boolean),
    2: scoresList[2].map(x => x >= 3 && ({ value: x, label: x })).filter(Boolean)
};