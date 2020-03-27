# Jira Assistant Publish Process

## How to prepare package for publish

Once development is completed and latest code is available in "develop" branch, same has to be merged to "package" branch. The package to be published would be built from "package" branch only. Before merging to package, ensure to have the version number in all the manifest.json files under "public" folder to be updated.

To build the package, follow the steps below:
1. Checkout package branch to your local if not done so far.
2. Delete the node_modules folder if it already exists as this sometimes cause issues in review process of webstore.
3. To pull the latest node modules, execute the command "npm install" and wait till it is completed.
4. Finally to build the package execute the following command: "npm run build". This will create a package for different browsers under "build" folder.

The package created from Step 4 above will be used to load the addon in browser or to publish in web store.

## How to publish the package to webstore?

As of now only Shridhar (developer) can publish the package to web store. This step may be automated in future based on feasibility or additional contributors would be given privilege to perform this action.

## How to load the package in browser for testing?

The build package generated from above step can be used to load the extension temporarily for testing. Use the appropriate version for individual browser like Chrome, Firefox, Edge. For Opera, as of today, same package as that of chrome can be used. Later, when necessary, a seperate folder for Opera would be created.

Note: Some browser like Firefox, would automatically remove the temporarily loaded addon when the browser is closed. Hence this option can only be used for testing and cannot be used as permenant option.