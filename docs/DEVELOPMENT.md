# Jira Assistant Development Guidelines and Best Practices

## Contributing to Jira Assistant

Before diving into development, please review the [Contribution Guidelines](CONTRIBUTE.md) to ensure a seamless collaboration experience.

## Starting the Development Process

To kickstart your development journey, follow these steps:

1. Familiarize yourself with the [Contribution Guidelines](CONTRIBUTE.md).
2. If you're planning to develop a new module, create a detailed issue and await approval from Shridhar TL.
3. Assign the relevant GitHub issue to yourself and maintain its status.
4. Create a new branch from the 'develop' branch and include informative commit comments.
5. Regularly sync your branch with 'develop' to facilitate merging later.

## Setting Up Your Local Development Environment

### Cloning and Preparing Jira Assistant Sources

Follow these commands to set up your local development environment:

```shell script
git clone https://github.com/shridhar-tl/jira-assistant.git
git checkout develop
npm install
npm start
```

After executing these commands, a local development service will launch, and your browser will load the plugin's login page. Here, you can integrate with an existing Jira instance for testing. If you don't have one, you can refer to the options below to set up an instance quickly.

Once development is complete, refer to the [Publishing Guidelines](PUBLISH.md) document for steps to package your work for final testing and webstore publication.

### Creating a Free Cloud Instance for Development

For easy development, use Jira's Cloud version, free for up to 5 users. You can also join Shridhar TL's shared development instance by reaching out to shridhar.tl@gmail.com. Sharing this instance enhances development by leveraging a large dataset. To learn more or set up your instance:

- To create a new account: http://go.atlassian.com/about-cloud-dev-instance
- To know more about this free instance: https://blog.developer.atlassian.com/cloud-ecosystem-dev-env/


### Setting Up a Local Jira Instance (30 Days Trial)

If you prefer local testing, Docker makes it straightforward. Run the following command to set up a Docker container with Jira:

**Note:** This command will download around 1GB of data for container setup.

```shell script
docker pull atlassian/jira-software
docker volume create --name jiraVolume
docker run -v jiraVolume:/var/atlassian/application-data/jira --name="jira" -d -p 9090:8080 atlassian/jira-software
```

For subsequent development sessions, simply start the existing container with:

```shell script
docker start jira
```

Access your personal Jira instance by opening "http://localhost:9090" in your browser and following the setup instructions.