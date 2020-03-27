## Contribute to Jira Assistant

Due to several work related commitments, the development / bug fixes are little slow and I apologize for that. However, I'm looking for voluntiers who could contribute and help me maintain this project.

## How to contribute?

Latest code is now available in develop branch.
Before starting to work on anything, please create a proper issue on Github and assign the issue to Shridhars TL. This ensures a smooth transition, once a pull request is created.

Please keep in mind that, any changes you make should work in all the browser and should be generic to all users.
No implementation is allowed which is specific to your requirements.

### Where can you contribute?
- Covering documentation for all the features available in Jira Assistent. I get lots of mails related to requirements of some features. But most of the times, those would be already available but will have to change some settings or do some little tweaks to get it working. If someone can go through all the features and document it along with steps, then such mails would get reduced and I can concentrate more in development rather than trying to answer such mails.
- Their is already a FAQ module available in Jira Assistant, but that does not cover all the modules / scenarios. Helping me in adding more scenarious / questions would serve the purpose same as that of documentation.
- Testing the existing features well and if their any bugs, then raise an issue with all the details including steps to reproduce. In most of the issue related mails I get, users do not provide sufficient information about the errors and everytime I had to ask for screenshots, console logs, etc.,
- Writing tests for existing components / pages. The time I get to allocate for this project is not sufficient enough to write unit test cases for the whole project and so far this project does not have any unit testcases written. So someone could contribute writing testcases, then it would make the application more stable when their are changes in future.
- If you have any new requirements related to Jira Assistant, then create an issue with all the required details.
- Can contribute in doing the analyses for the requirements listed below.

#### Requirements requiring analysis
Following are some of the requirements for which analysis is yet to be done. If anyone is willing to contribute for this, then please do the analysis and provide all the required details along with the required url, screenshots, prototype if any, etc..
- A free web service / api which would allow posting the queries and bugs from within Jira Assistant. This service is actually an alternate for GitHub's inbuilt bug tracking system as it lacks API to automatically log defects from within Jira Assistant. This should also support the following requirements:
    - If GitHub already provides an API to post issues without needing for the user to authenticate, then it should be the best option.
    - This should allow all the users to view the bugs and queries posted by other users without revealing the posters private informations like email id.
    - An UI is required to view the list of issues and should let the developers to proceed with workflow.
    - Should also support automatically posting the errors occured in browser so that it would let the developers to fix the issue before users start to raise issues regarding the same.
- Calendar integration with outlook and Jira.
- A free web service which would provide holiday related informations. Providing more than one api is also good so that we can support integration with multiple API's.
    - Should provide the list of holidays based on the users country.


**Note:** It is fine if the solution does not meet all the points mentioned, but should atleast meet the most necessary one.

### Guidelines to start with development
If you are planning to start with development / bug fix activity, then please follow these guidelines to avoid any issues:

- Do not develop a module which would serve only your purpose. Anything you build should be usable by all the users, irrrespective of the version of Jira they use.
- The module you develop should not expect a particular plugin (particularly paid one) to be installed in Jira to work.
- Do not use the name of any custom fields in Jira as it would differ in each instance of Jira. Instead let the user to select appropriate custom field so that it works for all users.
- Do not make use of any non-open source components / libraries.
- Do not checkin the code with any issues or warnings.
- Before you create a pull request see to that all the functionality developed by you is working fine and you do not break any existing functionality.
- Though it is not necessary, I would suggest providing a brief documentation about your module. This can also be added as part of FAQ module.
- I suggest you to create a unit test cases for your module and have a good coverage for all the scenarious. This is not necessary. Do it only if your timelines permits.

### Setup Environment
Please refer [development support](DEVELOPMENT.md) document to setup your local environment and starting the development.

Please refer [publishing guidelines](PUBLISH.md) document for the steps to build the package which can be used for final round of testing and publishing to webstore.