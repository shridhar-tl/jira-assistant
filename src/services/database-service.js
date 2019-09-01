import Dexie from 'dexie';

class DatabaseService extends Dexie {
    static dependencies = ["MessageService"];

    constructor($message) {
        super("JiraAssist");
        this.$message = $message;

        this.version(1).stores({
            users: '++id,jiraUrl,userId',
            savedFilters: '++id,queryName,createdBy',
            settings: '[name+userId],name,userId',
            worklogs: '++id,createdBy,isUploaded,dateStarted,worklogId,ticketNo',
            events: '++id,createdBy,name,ticketNo,startTime,isEnabled,source,sourceId'
        });


        // Open the database
        this.open().catch((error) => {
            console.error(error);
        });

        // Database is being initialized for the first time
        this.users.get(1).then((user) => {
            if (!user) {
                this.transaction('rw', this.users, () => {
                    this.users.add({ jiraUrl: 'SystemUser', userId: 'SystemUser', dateCreated: new Date() });
                }).catch((e) => { console.error(`Unable to initialize the database:-${e.stack}`); });
            }
        });

        //window.addEventListener('unhandledrejection', (err) => { console.error("DB Error caught in listener: ", err); });
        //database.on("error", (err) => { console.error("DB Error caught in handler: ", err); });
        window.addEventListener('unhandledrejection', (event) => this.handleError(event));
        window.addEventListener("rejectionhandled", (event) => this.handleError(event)); // For firefox
        window.onerror = (msg, url, line, col, error) => {
            this.$message.error("An unknown error occured while processing your request", "Unhandled error", true);
            console.error(msg, url, line, col, error);
        };

        window.addEventListener("error", (e) => {
            this.$message.error("An unknown error occured while processing your request", "Unhandled error", true);
            console.error("Global handler:-", e);
        });
    }

    handleError(event) {
        const detail = event.detail || event;
        this.$message.error("One or more of the actions failed", "Action error", true);
        console.error('Unhandled rejection (promise: ', detail.promise || event.promise, ', reason: ', detail.reason || event.reason, ').');
    }
}

export default DatabaseService;