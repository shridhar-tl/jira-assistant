import js from '@eslint/js';
import importPluginX from 'eslint-plugin-import-x';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist'] },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                jsxPragma: null,
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
        plugins: {
            import: importPluginX,
            react: reactPlugin,
            'react-hooks': reactHooks,
        },
        rules: {
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    pathGroups: [
                        { pattern: 'react', group: 'external', position: 'before' },
                        { pattern: 'react-dom', group: 'external', position: 'before' },
                        { pattern: 'react-dom/**', group: 'external', position: 'before' },
                        { pattern: 'react-router**', group: 'external', position: 'before' },
                        { pattern: '@/**', group: 'internal', position: 'before' },
                        { pattern: '@services', group: 'internal', position: 'before' },
                        { pattern: '@services/**', group: 'internal', position: 'before' },
                        { pattern: '@components', group: 'internal', position: 'before' },
                        { pattern: '@components/**', group: 'internal', position: 'before' },
                        { pattern: '@utils', group: 'internal', position: 'before' },
                        { pattern: '@utils/**', group: 'internal', position: 'before' },
                        { pattern: '@pages/**', group: 'internal', position: 'before' },
                        { pattern: '@stores', group: 'internal', position: 'before' },
                        { pattern: '@stores/**', group: 'internal', position: 'before' },
                        { pattern: '@types', group: 'internal', position: 'before' },
                        { pattern: '@types/**', group: 'internal', position: 'before' },
                        { pattern: '@hooks', group: 'internal', position: 'before' },
                        { pattern: '@hooks/**', group: 'internal', position: 'before' },
                        { pattern: '@constants', group: 'internal', position: 'before' },
                        { pattern: '@constants/**', group: 'internal', position: 'before' },
                        { pattern: '@layouts/**', group: 'internal', position: 'before' },
                        { pattern: '@dialogs/**', group: 'internal', position: 'before' },
                        { pattern: '@controls', group: 'internal', position: 'before' },
                        { pattern: '@controls/**', group: 'internal', position: 'before' },
                        { pattern: '@assets/**', group: 'internal', position: 'before' },
                        { pattern: '**/*.css', group: 'index', position: 'after' },
                    ],
                    pathGroupsExcludedImportTypes: ['react', 'react-dom', 'react-router**'],
                    alphabetize: { order: 'asc', caseInsensitive: true },
                    'newlines-between': 'always',
                },
            ],
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            quotes: ['error', 'single'],
            'react/jsx-key': 'error',
            'react/no-danger': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]",
                    message: 'Do not assign HTML strings to the DOM. Render text, or use the SafeHtml display control for external HTML.',
                },
                {
                    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
                    message: 'Do not inject HTML strings into the DOM. Render text, or use the SafeHtml display control for external HTML.',
                },
                {
                    selector: "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
                    message: 'Do not inject HTML strings into the DOM. Render text, or use the SafeHtml display control for external HTML.',
                },
            ],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    reportUsedIgnorePattern: false,
                },
            ],
            '@typescript-eslint/no-unused-expressions': 'error',
            'import/no-duplicates': 'error',
            'import/no-self-import': 'error',
            'import/no-useless-path-segments': 'error',
            'no-unused-private-class-members': 'error',
            'no-unused-labels': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
