# Jira Assistant Publish Process

## Preparing the Package for Publishing

Once your development work is complete and the latest code is available in the "develop" branch, it needs to be merged into the "package" branch. The package to be published will be built from the "package" branch. Before merging, make sure to update the version number in all `manifest.json` files under the "public" folder.

To build the package, follow these steps:

### Local Build Option:

1. Checkout the "package" branch in your local repository if you haven't already.
2. If it exists, delete the `node_modules` folder, as it can sometimes cause issues during the webstore review process.
3. Retrieve the latest node modules by running `npm install --force` and wait for the process to complete.
4. Finally, build the package by executing the command `npm run build`. This will generate packages for various browsers under the "build" folder.

### Automated GitHub Build Option:

1. After merging your changes into the "package" branch, push the branch to GitHub.
2. Automated builds will be triggered by GitHub Actions. Wait for the build to complete.

**Steps to Download GitHub Automated Build Package:**

1. In your web browser, visit the following URL: [GitHub Actions - Build and Deploy JA](https://github.com/shridhar-tl/jira-assistant/actions/workflows/build-ja.yml).
2. Navigate to the "Artifacts" section of the latest completed build.
3. Download the ZIP file containing the build package.
4. Extract the downloaded ZIP file to access the build package.

## Publishing the Package to the Web Store

Currently, only Shridhar (the developer) has the privilege to publish the package to the web store. Automation of this step may be considered in the future, or additional contributors may be granted this privilege.

## Loading the Package for Testing

The build package generated from the above steps can be temporarily loaded for testing purposes. Use the appropriate version for each browser, such as Chrome, Firefox, Edge, and Opera.

**Steps for Loading the Temporary Extension:**

- **Google Chrome:**
  - Open Chrome and go to `chrome://extensions/`.
  - Enable "Developer mode" in the top-right corner.
  - Click "Load unpacked" and select the `chrome` folder from the build output directory.

- **Mozilla Firefox:**
  - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
  - Click "Load Temporary Add-on..." and select `manifest.json` file within the `firefox` folder from the build output directory.

- **Microsoft Edge:**
  - Open Edge and visit `edge://extensions/`.
  - Enable "Developer mode" in the bottom-left corner.
  - Click "Load unpacked" and select the `edge` folder from the build output directory.

- **Opera:**
  - Open Opera and navigate to `opera://extensions/`.
  - Enable "Developer mode" in the top-right corner.
  - Click "Load unpacked" and select the `opera` folder from the build output directory.

Please note that some browsers, like Firefox, will automatically remove temporarily loaded add-ons when the browser is closed. Therefore, this option is only suitable for testing and not a permanent solution.
