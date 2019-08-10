import React, { PureComponent } from 'react';

class GeneralSettings extends PureComponent {
    constructor($jaFacade, $jaBrowserExtn, $jira, $jaAnalytics, $session, $jaCalendar, message, $cache) {
        this.$jaFacade = $jaFacade;
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$jira = $jira;
        this.$jaAnalytics = $jaAnalytics;
        this.$session = $session;
        this.$jaCalendar = $jaCalendar;
        this.message = message;
        this.$cache = $cache;
        this.WeekDaysArray = ['Default', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.noDonations = true;
        this.settings = {};
        this.spaceInfo = {};
    }
    ngOnInit() {
        this.$jaBrowserExtn.getStorageInfo().then((info) => {
            this.spaceInfo = info;
            var progressClass = 'progress-bar-';
            if (info.usedSpacePerc < 50) {
                progressClass += 'green';
            }
            else if (info.usedSpacePerc <= 75) {
                progressClass += 'yellow';
            }
            else {
                progressClass += 'red';
            }
            this.spaceInfo.progressClass = progressClass;
        });
        this.$jaFacade.getUserSettings().then(res => {
            this.parseSettings(res);
            this.$jira.getRapidViews().then((views) => {
                this.rapidViews = views.orderBy((d) => { return d.name; }).map((d) => {
                    return { name: d.name, id: d.id };
                });
                //if (this.settings.rapidViews && this.settings.rapidViews.length > 0) {
                //  this.settings.rapidViews = this.rapidViews
                //}
            });
            this.$jira.getProjects().then((projects) => {
                this.projects = projects.map((d) => { return { name: d.name, id: d.id, key: d.key }; }).orderBy((d) => d.name);
            });
            this.$jira.getCustomFields().then(cfList => {
                this.numericFields = cfList.filter(cf => cf.custom && cf.schema.type === "number")
                    .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                    .orderBy(cf => cf.name);
                this.stringFields = cfList.filter(cf => cf.custom && (cf.schema.type === "any" || cf.schema.type === "string"))
                    .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                    .orderBy(cf => cf.name);
            });
            this.menus = [];
            this.launchMenus = [];
            let lastGroup = null;
            var launchAct = this.settings.launchAction;
            var selMenus = launchAct.selectedMenu || ['D-0', 'R-UD', 'R-SP', 'R-CG', 'CAL', 'S-GE'];
            this.selectedLaunchPage = launchAct.autoLaunch;
            this.selectedDashboard = launchAct.quickIndex;
            navigation.forEach(menu => {
                if (menu.name) {
                    this.menus.push({
                        id: menu.id, isHead: menu.title, name: menu.name, icon: menu.icon,
                        url: menu.url, selected: selMenus.indexOf(menu.id) > -1
                    });
                    if (menu.title) {
                        lastGroup = this.launchMenus.push({ label: menu.name, items: [] });
                    }
                    else {
                        lastGroup.items.push({ value: menu.id, label: menu.name, icon: menu.icon });
                    }
                }
            });
            this.dashboards = this.launchMenus[0].items;
        });
    }
    searchRapidView($event) {
        var query = ($event.query || '').toLowerCase();
        this.filteredRapidViews = this.rapidViews.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && (!this.settings.rapidViews || !this.settings.rapidViews.some(v => v.id === r.id)));
    }
    searchProject($event) {
        var query = ($event.query || '').toLowerCase();
        this.filteredProjects = this.projects.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.key.toLowerCase().startsWith(query) || r.id.toString().startsWith(query))
            && (!this.settings.projects || !this.settings.projects.some(v => v.id === r.id)));
    }
    saveSettings() {
        var setting = { action: parseInt(this.settings.menuAction) };
        var launchSetting = { action: setting.action };
        this.settings.launchAction = setting;
        switch (this.settings.menuAction) {
            case '1':
                launchSetting.menus = this.menus.map(menu => {
                    if (menu.selected && !menu.isHead) {
                        return { name: menu.name, url: menu.url };
                    }
                });
                setting.selectedMenus = this.menus.map(menu => {
                    if (menu.selected && !menu.isHead) {
                        return menu.id;
                    }
                });
                break;
            case '2':
                if (this.selectedLaunchPage) {
                    var selLPage = this.menus.first(menu => menu.id === this.selectedLaunchPage);
                    if (selLPage) {
                        launchSetting.url = selLPage.url;
                        setting.autoLaunch = this.selectedLaunchPage;
                    }
                }
                break;
            case '3':
                if (this.selectedDashboard) {
                    launchSetting.index = parseInt((this.selectedDashboard || '0').replace('D-', ''));
                    setting.quickIndex = this.selectedDashboard;
                }
                break;
        }
        var validateTicket = () => {
            let tickets = (this.settings.meetingTicket || "").trim();
            if (tickets) {
                tickets = tickets.replace(';', ',').replace(' ', ',');
                tickets = tickets.split(',').map(t => t.trim() || null);
                this.settings.meetingTicket = tickets.join();
                return this.$jaFacade.getTicketDetails(tickets).then(res => {
                    var list = tickets.map(t => res[t.toUpperCase()] || t);
                    var invalidTickets = list.filter(t => typeof t === "string");
                    if (invalidTickets.length > 0) {
                        this.message.warning("Invalid default ticket number(s) specified for meetings: " + invalidTickets.join());
                        return false;
                    }
                    this.settings.meetingTicket = list.map(t => t.key).join();
                    return true;
                }, e => {
                    var msgs = ((e.error || {}).errorMessages || []);
                    if (msgs.some(m => m.toLowerCase().indexOf("'key' is invalid") > -1 || m.toLowerCase().indexOf("does not exist") > -1)) {
                        this.message.warning("Invalid default ticket number specified for meetings!");
                    }
                    return false;
                });
            }
            else {
                return Promise.resolve(true);
            }
        };
        validateTicket().then((result) => {
            if (result === false) {
                this.currentTabIndex = 1;
                return;
            }
            if (!this.settings.storyPointField) {
                // Find the field with exact match
                var spF = this.numericFields.first(cf => cf.name.toLowerCase() === "story points");
                // IF exact match is not available then find a field with both the words
                if (!spF) {
                    this.numericFields.first(cf => {
                        var name = cf.name.toLowerCase();
                        return name.indexOf('story') > -1 && ~name.indexOf('points') > -1;
                    });
                }
                if (spF) {
                    this.settings.storyPointField = spF;
                }
            }
            if (!this.settings.epicNameField) {
                // Find the field with exact match
                var enF = this.stringFields.first(cf => cf.name.toLowerCase() === "epic link");
                // IF exact match is not available then find a field with both the words
                if (!enF) {
                    this.stringFields.first(cf => {
                        var name = cf.name.toLowerCase();
                        return name.indexOf('epic') > -1 && ~name.indexOf('link') > -1;
                    });
                }
                if (enF) {
                    this.settings.epicNameField = enF;
                }
            }
            if (!(this.settings.startOfWeek > 0)) {
                delete this.settings.startOfWeek;
            }
            this.$jaFacade.saveUserSettings(this.settings).then(res => {
                this.$cache.set("menuAction", launchSetting, false, true);
                this.parseSettings(res);
            });
        });
    }
    parseSettings(result) {
        var cUser = this.$session.CurrentUser;
        var sett = this.settings = result.settings;
        this.dateFormats = result.dateFormats;
        this.timeFormats = result.timeFormats;
        cUser.dateFormat = sett.dateFormat;
        cUser.timeFormat = sett.timeFormat;
        cUser.workingDays = sett.workingDays;
        cUser.gIntegration = sett.googleIntegration;
        cUser.maxHours = sett.maxHours;
        cUser.meetingTicket = sett.meetingTicket;
        cUser.hasGoogleCreds = sett.hasGoogleCredentials;
        cUser.allowClosedTickets = sett.allowClosedTickets;
        cUser.pruneInterval = parseInt(sett.pruneInterval || 4);
        cUser.projects = sett.projects;
        cUser.rapidViews = sett.rapidViews;
        cUser.storyPointField = sett.storyPointField;
        cUser.epicNameField = sett.epicNameField;
        cUser.commentLength = parseInt(sett.commentLength || 0);
        cUser.startOfWeek = parseInt(sett.startOfWeek || 0);
        this.noDonations = cUser.noDonations;
        cUser.hideDonateMenu = this.noDonations || sett.hideDonateMenu;
        if (cUser.hideDonateMenu) {
            $('body').addClass('no-donation');
        }
        else {
            $('body').removeClass('no-donation');
        }
        if (!sett.launchAction) {
            sett.launchAction = {};
            sett.menuAction = '1';
        }
        else {
            sett.menuAction = '' + sett.launchAction.action;
        }
        sett.autoLaunch = "" + (sett.autoLaunch || "0");
        sett.notifyBefore = "" + (sett.notifyBefore || "0");
        sett.checkUpdates = "" + (sett.checkUpdates || "15");
        cUser.team = sett.teamMembers;
        if (sett.startOfDay) {
            var temp = sett.startOfDay.split(':');
            cUser.startOfDay = temp[0] + ':' + temp[1];
        }
        if (sett.endOfDay) {
            var temp = sett.endOfDay.split(':');
            cUser.endOfDay = temp[0] + ':' + temp[1];
        }
        this.removedIntg = false;
    }
    googleSignIn() {
        this.$jaCalendar.authenticate(true).then((result) => {
            this.settings.hasGoogleCredentials = true;
            this.$session.CurrentUser.hasGoogleCreds = true;
            this.$jaAnalytics.trackEvent("Signedin to Google Calendar");
            this.message.success("Successfully integrated with google account.");
        }, (err) => { this.message.warning("Unable to integrate with Google Calendar!"); });
    }
    selectSubMenus(menu, event) {
        event.stopPropagation();
        menu = menu.value;
        for (var i = this.menus.indexOf(menu) + 1; i < this.menus.length; i++) {
            var subMenu = this.menus[i];
            if (subMenu.isHead) {
                return;
            }
            subMenu.selected = menu.selected;
        }
    }

    render() {
        return (<>
            <TabView styleclass="query-tab" activeindex={currentTabIndex} onOnchange={() => currentTabIndex = $event.index}>
                <TabPanel header="General" lefticon="fa-filter" selected="true">
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Display Date and Time format</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <select className="form-control select" value={settings.dateFormat} onChange={(val) => { settings.dateFormat = val }} style={{ width: 180, display: 'inline-block' }}>
                                    {dateFormats.map(format => <option selected={format.selected} value={format.value}>{format.text}</option>)}
                                </select>
                                <select className="form-control select" value={settings.timeFormat} onChange={(val) => { settings.timeFormat = val }} style={{ width: 150, display: 'inline-block' }}>
                                    {timeFormats.map(format => <option selected={format.selected} value={format.value}>{format.text}</option>)}
                                </select>
                                <span className="help-block">Select your preferred date and time format to be displayed throughout the application</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Working hours</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <InputMask mask="99:99" value={settings.startOfDay} onChange={(val) => { settings.startOfDay = val }} placeholder="00:00" maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                                <InputMask mask="99:99" value={settings.endOfDay} onChange={(val) => { settings.endOfDay = val }} placeholder="00:00" maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                                <span className="help-block">Select your working hours range between 00:00 to 23:00 (24 hours format)</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Working days</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <div jadaysinweek days={settings.workingDays} />
                                <span className="help-block">Select the days in week you would be working.</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Start of week</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <select className="form-control select" value={settings.startOfWeek} onChange={(val) => { settings.startOfWeek = val }} style={{ width: 180, display: 'inline-block' }}>
                                    {WeekDaysArray.map((day, i) => <option selected={settings.startOfWeek === i} value={i}>{day}</option>)}
                                </select>
                                <span className="help-block">Select the starting day of your week. If nothing is selected then default will be taken.</span>
                            </div>
                        </div>
                        {!noDonations && <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Donate / contribute to us</strong>
                        </div>}
                        {!noDonations && <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10" >
                            <div className="form-group">
                                <div>
                                    <p-checkbox value={settings.hideDonateMenu} onChange={(val) => { settings.hideDonateMenu = val }} label="Hide Donate button in header" binary="true" />
                                </div>
                                <div>
                                    <a href="#/contribute" title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more">
                                        <img src="/assets/donate.png" width={145} className="Donate us" />
                                    </a>
                                </div>
                                <span className="help-block">
                                    You can choose to hide the donate button / menu displayed in the tool using this option. But before hiding it consider donating
                                    a small amount of your wish.
                                </span>
                            </div>
                        </div>}
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Space consumed</strong>
                        </div>
                        <div className="ui-g-12 ui-md-5 ui-lg-5 ui-xl-4">
                            <div className="form-group">
                                <p-progressbar value={spaceInfo.usedSpacePerc} />
                                <span className="help-block">
                                    You have used
                                    <strong>{spaceInfo.usedSpace | bytes}</strong> of
                                    <strong>{spaceInfo.totalSpace | bytes}</strong> allocated by browser.
                                    <span hidden={spaceInfo.usedSpacePerc < 80}>
                                        Once the remaining
                                        <strong>{spaceInfo.freeSpace | bytes}</strong> is used you will not be able to use the tool to generate worklog.
                                        {/*Hence it is necessary to prune your old worklogs using the above option.*/}
                                    </span>
                                    <span hidden={spaceInfo.freeSpace > 0}>
                                        <strong>Note:</strong> It looks like all the space allocated is being consumed. See if you are running out of free
                                        space in your OS Drive (generally your C drive).
                                        <a href="https://github.com/shridhar-tl/jira-assistant/issues/18" target="_blank" rel="noopener noreferrer">Read more about it here.</a>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Worklog" lefticon="fa-clock-o">
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Max hours to log</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <ja-time-picker timevalue={settings.maxHours} valuemode="Hours" />
                                <span className="help-block">Specify the maximum number of hours to be logged per day</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Auto upload worklog</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <label className="check">
                                    <input type="checkbox" className="icheckbox" value={settings.autoUpload} onChange={(val) => { settings.autoUpload = val }} /> Enable auto upload by default
                                </label>
                                <span className="help-block">All the worklogs will be automatically uploaded when created</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Worklog for closed tickets</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <label className="check">
                                    <input type="checkbox" className="icheckbox" value={settings.allowClosedTickets} onChange={(val) => { settings.allowClosedTickets = val }} /> Allow logging work on closed tickets
                                </label>
                                <span className="help-block">This feature will work only if your Jira server is configured to support it</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Min length for worklog comments</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <TextBox className="form-control" value={settings.commentLength} onChange={(val) => { settings.commentLength = val }} filter="int" maxLength={3} style={{ width: 150, display: 'inline-block' }} />
                                <span className="help-block">Provide the minimum count of characters to be used for worklog comments</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Default meeting ticket for worklog</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <input id="txtTicketNo" type="text" className="form-control" value={settings.meetingTicket}
                                    onChange={(val) => { settings.meetingTicket = val }} maxLength={100} style={{ width: 150, display: 'inline-block' }} />
                                <span className="help-block">Provide the list of meeting tickets seperated by ',' for which you would add worklog.</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Notify for missing worklog</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <label className="check">
                                    <input type="checkbox" className="icheckbox" value={settings.notifyWL}
                                        onChange={(val) => { settings.notifyWL = val }} /> Enable worklog notification
                                </label>
                                <span className="help-block">Notify you to add worklog for previous day if not added</span>
                            </div>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Default values" lefticon="fa-clock-o">
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Projects</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <AutoComplete value={settings.projects} onChange={(val) => { settings.projects = val }}
                                    suggestions={filteredProjects} dropdown={true} multiple={true} forceselection="true" field="name"
                                    placeholder="start typing the project name here" completemethod={() => searchProject($event)} size={35}
                                    autohighlight="true" maxLength={25} styleclass="autocomplete-350" scrollheight="300px"
                                    disabled={!projects || projects.length === 0} />
                                <span className="help-block">Add one or more projects which you are interested in</span>
                            </div>
                        </div>
                    </div>
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Rapid board</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <AutoComplete value={settings.rapidViews} onChange={(val) => { settings.rapidViews = val }}
                                    suggestions={filteredRapidViews} dropdown={true} multiple={true} forceselection="true" field="name"
                                    placeholder="start typing the board name here" completemethod={() => searchRapidView($event)}
                                    size={35} autohighlight="true" maxLength={25} styleclass="autocomplete-350" scrollheight="300px"
                                    disabled={!rapidViews || rapidViews.length === 0} />
                                <span className="help-block">Add one or more rapid view board which you are interested in</span>
                            </div>
                        </div>
                    </div>
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Story Points field</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <Dropdown options={numericFields} value={settings.storyPointField} onChange={(val) => { settings.storyPointField = val }}
                                    style={{ 'width': '200px' }} placeholder="Choose a storypoint field" filter="true" disabled={!numericFields} optionlabel="name" emptyfiltermessage="No fields found" resetfilteronhide="true" filterplaceholder="Type the field name to filter" />
                                <span className="help-block">Story points field is a custom field in each jira instance and for some functionality to work,
                                you will have to select appropriate field.</span>
                            </div>
                        </div>
                    </div>
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Epic name field</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <Dropdown options={stringFields} value={settings.epicNameField} onChange={(val) => { settings.epicNameField = val }}
                                    style={{ 'width': '200px' }} placeholder="Choose a epic name field" filter="true" disabled={!stringFields}
                                    optionlabel="name" emptyfiltermessage="No fields found" resetfilteronhide="true" filterplaceholder="Type the field name to filter" />
                                <span className="help-block">Epic name field is a custom field in each jira instance and for some functionality to work,
                                 you will have to select appropriate field.</span>
                            </div>
                        </div>
                    </div>
                </TabPanel >
                <TabPanel header="Meetings" lefticon="fa-calendar">
                    <p>
                        This page allows you to integrate your calendar from external sources like Google. Worklog will be automatically created
                        for the events in your calendar based on your preferences
                    </p>
                    <div className="block">
                        <h4>Google Calendar</h4>
                        <div className="ui-g ui-fluid">
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Enable Google calendar</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <label className="check">
                                        <input type="checkbox" className="icheckbox" value={settings.googleIntegration} onChange={(val) => { settings.googleIntegration = val }} /> Allow integration
                                    </label>
                                    <span className="help-block">Select this checkbox if you would wish to view meetings in your calendar</span>
                                </div>
                            </div>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Integration Status</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group" hidden={settings.hasGoogleCredentials || removedIntg}>
                                    <label className="link" onClick={googleSignIn}>Click here to sign in with your google account</label>
                                    <span className="help-block">You will have to sign-in to chrome with your google account to use the calendar.</span>
                                </div>
                                <div className="form-group" hidden={!(settings.hasGoogleCredentials && !removedIntg)}>
                                    <label>(Already integrated with an account)</label>
                                    <label className="link" onClick={() => { settings.hasGoogleCredentials = false; removedIntg = true }}>Remove integration</label>
                                </div>
                                <div className="form-group" hidden={!removedIntg}>
                                    <label>(You will be signed out from Google once you save your changes)</label>
                                    <label className="link" onClick={() => { settings.hasGoogleCredentials = true; removedIntg = false }}> Undo signout</label>
                                    <span className="help-block">Note: You will have to authenticate with google again to use the calendar</span>
                                </div>
                            </div>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Check for updates</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <select className="form-control select" value={settings.checkUpdates} onChange={(val) => { settings.checkUpdates = val }} style={{ width: 180, display: 'inline-block' }}>
                                        <option value={5}>Every 5 minutes</option>
                                        <option value={10}>Every 10 minutes</option>
                                        <option value={15}>Every 15 minutes</option>
                                        <option value={20}>Every 20 minutes</option>
                                        <option value={30}>Every 30 minutes</option>
                                        <option value={45}>Every 45 minutes</option>
                                        <option value={60}>Every 60 minutes</option>
                                    </select>
                                    <span className="help-block">Refresh the meeting invites for notification regularly in given interval</span>
                                </div>
                            </div>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Show meeting notification</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <select className="form-control select" value={settings.notifyBefore} onChange={(val) => { settings.notifyBefore = val }} style={{ width: 180, display: 'inline-block' }}>
                                        <option value={0}>Disable notification</option>
                                        <option value={1}>Before 1 minute</option>
                                        <option value={2}>Before 2 minutes</option>
                                        <option value={3}>Before 3 minutes</option>
                                        <option value={4}>Before 4 minutes</option>
                                        <option value={5}>Before 5 minutes</option>
                                        <option value={10}>Before 10 minutes</option>
                                        <option value={10}>Before 15 minutes</option>
                                    </select>
                                    <span className="help-block">Show notification before the selected time of meeting</span>
                                </div>
                            </div>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Auto launch hangout</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <select className="form-control select" value={settings.autoLaunch} onChange={(val) => { settings.autoLaunch = val }} style={{ width: 180, display: 'inline-block' }}>
                                        <option value={0}>Never launch</option>
                                        <option value={1}>Before 1 minute</option>
                                        <option value={2}>Before 2 minutes</option>
                                        <option value={3}>Before 3 minutes</option>
                                        <option value={4}>Before 4 minutes</option>
                                        <option value={5}>Before 5 minutes</option>
                                        <option value={10}>Before 10 minutes</option>
                                    </select>
                                    <span className="help-block">Automatically launch hangout Url before the selected time of meeting</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel >
                <TabPanel header="Menu options" lefticon="fa-calendar">
                    <p>This page allows you to set what is displayed when you click on JA icon in your browser</p>
                    <div className="block">
                        <div className="ui-g ui-fluid">
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>What should happen when clicking on JA icon?</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <label className="check">
                                        <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={1} /> Show menus
                    </label>
                                    <label className="check">
                                        <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={2} /> Auto launch
                    </label>
                                    <label className="check">
                                        <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={3} /> Show quickview dashboard
                    </label>
                                    <span className="help-block">Select appropriate option what you would expect to happen when you click on JA icon</span>
                                </div>
                            </div>
                            <div hidden={settings.menuAction !== '1'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Menus to display</strong>
                            </div>
                            <div hidden={settings.menuAction !== '1'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <div style={{ display: 'inline-block', height: 300, overflow: 'auto' }}>
                                        <p-listbox options={menus} value={selectedMenus} onChange={(val) => this.setState({ selectedMenus: val })} multiple="multiple" optionlabel="name" style={{ width: '300px', height: '300px' }}>
                                            <ng-template let-menu ptemplate="item">
                                                {menu.value.isHead && <div onClick={() => { menu.value.selected = !menu.value.selected; selectSubMenus(menu, $event) }}>
                                                    <Checkbox value={menu.value.selected} onChange={(val) => { menu.value.selected = val }} label={menu.label} binary="true" onClick={() => selectSubMenus(menu, $event)} />
                                                </div>}
                                                {!menu.value.isHead && <div style={{ marginLeft: 20 }} onClick={() => menu.value.selected = !menu.value.selected}>
                                                    <Checkbox value={menu.value.selected} onChange={(val) => { menu.value.selected = val }} label={menu.label} binary="true" onClick={(e) => e.stopPropagation} />
                                                </div>}
                                            </ng-template>
                                            <p />
                                        </p-listbox></div>
                                    <span className="help-block">Choose the list of menus you would like to be displayed</span>
                                </div>
                            </div>
                            <div hidden={settings.menuAction !== '2'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Auto launch page</strong>
                            </div>
                            <div hidden={settings.menuAction !== '2'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <Dropdown options={launchMenus} value={selectedLaunchPage} onChange={(val) => this.setState({ selectedLaunchPage: val })} style={{ 'width': '200px' }} group={true}>
                                        {(item) => (<>
                                            <i className="fa" ngclass={menu.icon} />
                                            <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                        </>)}
                                        {(group) => <>
                                            <div style={{ height: '200px' }}>
                                                <span style={{ verticalAlign: 'middle' }}>{group.label}</span>
                                            </div>
                                            <p />
                                            <span className="help-block">Select the page to be launched when clicking on the JA icon</span>
                                        </>}
                                    </Dropdown>
                                </div>
                            </div>
                            <div hidden={settings.menuAction !== '3'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Quick view board</strong>
                            </div>
                            <div hidden={settings.menuAction !== '3'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <Dropdown options={dashboards} value={selectedDashboard} onChange={(val) => this.setState({ selectedDashboard: val })} style={{ 'width': '200px' }}>
                                        {(item) => <>
                                            <i className="fa" ngclass={menu.icon} />
                                            <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                        </>}
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p />
                    <p />
                    <div className="pnl-footer">
                        <Button pbutton className="ui-button-primary pull-right" icon="fa fa-floppy-o" label="Save Changes" onClick={saveSettings} />
                    </div>
                </TabPanel ></TabView >
        </>
        );
    }
}

export default GeneralSettings;