# Jira Assistant Development Guidelines and Best Practices

## How to contribute?

Please refer [contribution guidelines](CONTRIBUTE.md) prior to starting the development.

## How to start the development?

- First and formost, please follow all the points provided under [contribution guidelines](CONTRIBUTE.md).
- If you plan to develop a new module, please create an issue with all the details and start only after you get a go ahead from Shridhar TL.
- Assign the appropriate issue in GitHub to your name before starting the development activity and have the status updated always in GitHub.
- Create a branch out of develop and start the development and provide appropriate comment for each commits.

## Local development environment

### setup and prepare Jira Assistant sources for local development
```shell script
git clone https://github.com/shridhar-tl/jira-assistant.git
git checkout develop
npm install
npm start
```

At this point, a local development service will be started and your browser is loading the login page of the plugin.

### setup and prepare a local Jira instance

The best way is to have a local Jira for playing around. If you have Docker installed in your workstation, then run the following command to setup a docker container with Jira running on port 9090.

**Note:** The following command will download around 1GB of data to setup the container.

```shell script
docker pull atlassian/jira-software
docker volume create --name jiraVolume
docker run -v jiraVolume:/var/atlassian/application-data/jira --name="jira" -d -p 9090:8080 atlassian/jira-software
```

Above command need to be executed only once per workstation and from next time when you start your development activity, you can start your existing container by running just the following command:

```shell script
docker start jira
```

Your personal Jira instance is up and running ... simply open "http://localhost:9090"
in your browser and follow the setup instructions.
Once you have created a user login and setup your first project, you need to get the **CORS headers** right,
to avoid your Browser complaining and can't login.
You need to add ```http://localhost:8080``` (where the Jira Assistant is running) to whitelist in Jira,
see also https://confluence.atlassian.com/adminjiraserver073/configuring-the-whitelist-861254007.html

If you are planning to use the version of Jira which is already available in cloud and if you do not have control to whitelist the url then you can make use of any other browser extensions to remove the Origin & Referrer from the request. Also some of the "User-Agent" header string is not supported by Jira. If you get such issue then you will also have to change the "User-Agent" header. You can use the command in "start_chrome.bat" to launch chrome with all these settings.

**Note:** If you use the command in "start_chrome.bat" file, then ensure you are not using this instance of chrome for other sites as this command will launch chrome in unsecured mode and is not recommended while browsing the web. Also while you execute the command, you should not have any other instance of chrome already running (including, in tray) as it would cause this command to not have any effect.