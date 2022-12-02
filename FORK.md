# Customization
If you wanted to customize Jira Assistant, host it and use within your organization, follow this document.

## Assumptions
* This document assumes you already have an internal git repository created and ready to use
* The targetted repository should be empty and should have no commits for the first time.
* The steps listed in the document should work with any target repository like GitHub, BitBucket or any other git repository.
* <<target_repo_url>> is to be replaced with url of your internal git repository

## Steps to fork Jira Assistant
Follow the steps listed below to fork the repository for the first time or you already have the source code forked internally and would like to upgrade to the latest version of source available in public repository.

### Step 1: Clone your internal repository
* First you will have to clone your internal repository using the following command: "git clone <<target_repo_url>>"
* You should execute the above command from the folder where you would like to have the source code repository setup.
* If you already have your internal repository cloned, then skip this step.

### Step 2: Add JA Remote repo for sync
* Execute the following command to add JA source repository: "git remote add sync https://github.com/shridhar-tl/jira-assistant.git"
* This is a one time activity when ever you clone the repository.

### Step 3: Verify remote url's
* Extecute the following command and verify if both the public repository and your internal repository is configured: "git remote -v"
* You should see fetch and pull operations for both the remotes (repositories).

### Step 4: Fork / sync source code from public repo
* git pull sync package

### Step 5: Push the code to your internal repository
* git push -u origin develop

### Step 6: Start customizing
* You can now start customizing the code and push the changes to your internal repository.
* Remember to take updated code from public repository frequently to use the latest features and bug fixes.
* You can use "customize.js" from the root folder to control some build time customizations for your internal instance.
* If you wanted to develop a generic feature or fix some existing bugs, then you are requested to do it in public repository itself and raise a PR so that it is useful for others as well.
