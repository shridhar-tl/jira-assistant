# Jira Assistant

The source code of Jira Assistant is publicly available on GitHub:
https://github.com/shridhar-tl/jira-assistant/tree/package

## Build environment

The published package is built automatically by GitHub Actions on:

- Ubuntu (latest)
- Node.js 24.x

Use the same environment to reproduce an identical output.

## Build steps

1. Install the exact package versions used for the published build (recorded in `package-lock.json`):

    ```
    npm ci --force
    ```

2. Build the extension:

    ```
    npm run build
    ```

## Output

The minified output is generated in the `dist` folder, with a separate package for each browser:

| Browser | Folder         |
| ------- | -------------- |
| Chrome  | `dist/chrome`  |
| Edge    | `dist/edge`    |
| Opera   | `dist/opera`   |
| Firefox | `dist/firefox` |

## Notes for reviewers

1. The extension includes a third-party library used to generate Excel documents, which contains a call to `eval`. The extension is not granted permission to run `eval`, so the call fails if it is ever reached, and the extension handles that failure with an appropriate message.
2. The extension can integrate with any Jira instance, so it requests access to all sites. It only accesses the Jira URL the user configures during integration.
