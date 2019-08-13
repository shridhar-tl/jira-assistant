# Jira Assistant Development Guidelines and Best Practices

## How to contribute?

Latest code is now available in develop branch.
Before starting to work on anything, please create a proper issue on Github, to inform Shridhars TL.
This ensures a smooth transition, once a pull request is created.

Please keep in mind that, any changes you make should work in all the browser and should be generic to all users.
No implementation is allowed which is specific to your requirements.


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

The best way is to have a local Jira for playing around.

```shell script
docker pull atlassian/jira-software
docker volume create --name jiraVolume
docker run -v jiraVolume:/var/atlassian/application-data/jira --name="jira" -d -p 9090:8080 atlassian/jira-software
```

Your personal Jira instance is up and running ... simply open "http://localhost:9090"
in your browser and follow the setup instructions.
Once you have created a user login and setup your first project, you need to get the **CORS headers** right,
to avoid your Browser complaining and can't login.
You need to add ```http://localhost:8080``` (where the Jira Assistant is running) to be added to th whitelist in Jira,
see also https://confluence.atlassian.com/adminjiraserver073/configuring-the-whitelist-861254007.html
