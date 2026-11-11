export function createRng(seed) {
    let state = seed >>> 0;

    const next = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const int = (min, max) => Math.floor(min + next() * (max - min + 1));

    return {
        next,
        int,
        chance: (p) => next() < p,
        float: ([min, max]) => min + next() * (max - min),
        intIn: ([min, max]) => int(min, max),
        pick: (arr) => arr[Math.floor(next() * arr.length)],
        pickMany(arr, count) {
            const copy = [...arr];
            const result = [];
            while (copy.length && result.length < count) {
                result.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
            }
            return result;
        },
        shuffle(arr) {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        },
        weighted(weights) {
            const entries = Object.entries(weights).filter(([, w]) => w > 0);
            const total = entries.reduce((sum, [, w]) => sum + w, 0);
            let r = next() * total;
            for (const [key, w] of entries) {
                r -= w;
                if (r <= 0) return key;
            }
            return entries[entries.length - 1][0];
        },
    };
}
