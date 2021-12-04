## Contribute to Jira Assistant

Due to several work related commitments, the development / bug fixes are a little slow, and I apologize for that. However, I'm looking for volunteers who could contribute and help me maintain this project.

## How to contribute?

Latest code is now available in the `develop` branch.
Before starting to work on anything, please create a proper issue on GitHub and assign the issue to Shridhars TL. This ensures a smooth transition, once a pull request is created.

Please keep in mind that any changes you make should work in all browsers and should be generic to all users.
No implementation is allowed which is specific to your requirements.

### Where can you contribute?
- Covering documentation for all the features available in Jira Assistant. I get lots of mails related to requirements of some features. But most of the time, those would be already available but will have to change some settings or do some little tweaks to get it working. If someone can go through all the features and document it along with steps, then such mails would get reduced, and I can concentrate more in development rather than trying to answer such mails.
- There is already a FAQ module available in Jira Assistant, but that does not cover all the modules / scenarios. Helping me in adding more scenarios / questions would serve the purpose same as that of documentation.
- Testing the existing features well and if there are any bugs, then raise an issue with all the details including steps to reproduce. In most of the issue related mails I get, users do not provide sufficient information about the errors and every time I had to ask for screenshots, console logs, etc.
- Writing tests for existing components / pages. The time I get to allocate for this project is not sufficient to write unit test cases for the whole project, and so far this project does not have any unit test cases written. So someone could contribute writing test cases, then it would make the application more stable when there are changes in the future.
- If you have any new requirements related to Jira Assistant, then create an issue with all the required details.
- Can contribute in doing the analyses for the requirements listed below.

#### Requirements requiring analysis
Following are some of the requirements for which analysis is yet to be done. If anyone is willing to contribute for this, then please do the analysis and provide all the required details along with the required URL, screenshots, prototype if any, etc.
- A free web service / API which would allow posting the queries and bugs from within Jira Assistant. This service is actually an alternate for GitHub's inbuilt bug tracking system, as it lacks an API to automatically log defects from within Jira Assistant. This should also support the following requirements:
    - If GitHub already provides an API to post issues without needing for the user to authenticate, then it should be the best option.
    - This should allow all the users to view the bugs and queries posted by other users without revealing the posters private information like email ID.
    - A UI is required to view the list of issues and should let the developers proceed with workflow.
    - Should also support automatically posting the errors that occurred in the browser so that it would let the developers fix the issue before users start to raise issues regarding the same.
- Calendar integration with outlook and Jira.
- A free web service which would provide holiday related information. Providing more than one API is also good so that we can support integration with multiple API's.
    - Should provide a list of holidays based on the user's country.


**Note:** It is fine if the solution does not meet all the points mentioned, but should at least meet the most necessary one.

### Guidelines to start with development
If you are planning to start with development / bug fix activity, then please follow these guidelines to avoid any issues:

- Do not develop a module which would serve only your purpose. Anything you build should be usable by all the users, irrespective of the version of Jira they use.
- The module you develop should not expect a particular plugin (particularly paid one) to be installed in Jira to work.
- Do not use the name of any custom fields in Jira, as it would differ in each instance of Jira. Instead, let the user select the appropriate custom field so that it works for all users.
- Do not make use of any non-open source components / libraries.
- Do not check in the code with any issues or warnings.
- Before you create a pull request, see to it that all the functionality developed by you is working fine, and you do not break any existing functionality.
- Though it is not necessary, I would suggest providing a brief documentation about your module. This can also be added as part of the FAQ module.
- I suggest you create unit test cases for your module and have a good coverage for all the scenarios. This is not necessary. Do it only if your timeline permits.

### Setup Environment
Please refer to the [development support](DEVELOPMENT.md) document to set up your local environment and start the development.

Please refer to the [publishing guidelines](PUBLISH.md) document for the steps to build the package which can be used for the final round of testing and publishing to the webstore.
