/* global chrome */
import BrowserBase from "../common/BrowserBase";
import { CHROME_WS_URL } from "../constants/urls";

export default class ChromeBrowserService extends BrowserBase {
  // This class gets proxied when accessed as webapp
  // When new method is added or method name is changed in this class, availableMethods list in base class has to be updated
  constructor() {
    super();
    this.chrome = chrome;
    //https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
  }

  async getCurrentUrl() {
    const hasPermission = await this.hasPermission({
      permissions: ["activeTab"],
    });
    if (!hasPermission) {
      console.log(
        "Jira Assistant do not have access to retrieve the current url"
      );
      return "";
    }

    return new Promise((resolve, reject) => {
      this.chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        (tabs) => {
          if (tabs && tabs[0] && tabs[0].url) {
            resolve(tabs[0].url);
          } else {
            reject("Unable to fetch the url");
          }
        }
      );
    });
  }

  async getCurrentTab() {
    const hasPermission = await this.hasPermission({
      permissions: ["activeTab"],
    });
    if (!hasPermission) {
      console.log("Jira Assistant do not have access to retrieve current tab");
      return null;
    }

    return new Promise((resolve, reject) => {
      this.chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        (tabs) => {
          if (tabs && tabs[0]) {
            resolve(tabs[0]);
          } else {
            reject("Unable to fetch the tab");
          }
        }
      );
    });
  }

  hasPermission(permissions) {
    return new Promise((resolve) => {
      this.chrome.permissions.contains(permissions, resolve);
    });
  }

  async requestPermission(permissions, ...url) {
    try {
      const pObj = this.getPermissionObj(permissions, ...url);
      const result = await this.hasPermission(pObj);

      if (result) {
        return true;
      } else {
        console.log("Requesting permission for: ", pObj);
        return new Promise((resolve) => {
          this.chrome.permissions.request(pObj, resolve);
        });
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async registerContentScripts(id, js, matches) {
    return await this.chrome.scripting.registerContentScripts([
      {
        id,
        js,
        matches,
        runAt: "document_end",
        allFrames: true,
      },
    ]);
  }

  replaceTabUrl(url) {
    return this.getCurrentTab()
      .then((tab) => this.chrome.tabs.update(tab.id, { url: url }))
      .catch(() => this.openTab(url));
  }

  openTab(url, name, opts) {
    window.open(url, name, opts); // need to change
  }

  getAuthToken(options) {
    // need to change
    return new Promise((resolve, reject) => {
      this.chrome.identity.getAuthToken(options, (accessToken) => {
        if (this.chrome.runtime.lastError || !accessToken) {
          console.error(
            "GCalendar integration failed",
            accessToken,
            this.chrome.runtime.lastError.message
          );
          reject({ error: this.chrome.runtime.lastError, tokken: accessToken });
        } else {
          resolve(accessToken);
        }
      });
    });
  }

  getRedirectUrl(endpoint) {
    // need to change
    return this.chrome.identity.getRedirectURL(endpoint);
  }

  launchWebAuthFlow(options) {
    return new Promise((resolve) => {
      this.chrome.identity.launchWebAuthFlow(options, resolve);
    });
  }

  removeAuthTokken(authToken) {
    // need to change
    this.chrome.identity.removeCachedAuthToken({ token: authToken }, () => {
      /* Nothing to implement */
    });
  }

  getStoreUrl(forRating) {
    // need to change
    return CHROME_WS_URL + (forRating ? "/reviews" : "");
  }

  extractAccessToken(redirectUri) {
    const m = redirectUri.match(/[#?](.*)/);
    if (!m || m.length < 1) {
      return null;
    }
    const params = new URLSearchParams(m[1].split("#")[0]);
    return params.get("access_token");
  }

  getLaunchUrl(file) {
    return Promise.resolve(this.chrome.runtime.getURL(file));
  }

  // Listen for port and keep the connection open
  // This is workaround for keeping background service worker alive and listen to system lock / unlock events
  persistBackground(persist) {
    try {
      if (persist) {
        this.activePorts = this.activePorts || [];
        if (!this.listeningForPorts) {
          this.listeningForPorts = true;
          chrome.runtime.onConnect.addListener((port) => {
            this.activePorts.push(port);
            console.log(
              "New client connected. Total Alive:",
              this.activePorts?.length
            );
            port.onMessage.addListener((msg) => {
              console.log("Message on port:", msg);
            });
            port.onDisconnect.addListener(this.attachToClient);
            console.log(
              "Attached keep-alive listener",
              this.listeningForPorts,
              this.activePorts
            );
          });
          this.attachToClient();
        }
      }
    } catch (err) {
      console.error("Error trying to persist background pages:", err);
    }
  }

  attachToClient = (port) => {
    if (port && this.activePorts) {
      const index = this.activePorts.indexOf(port);
      if (~index) {
        this.activePorts.splice(index);
      }
    }

    // if (this.activePorts?.length) { return; }
    // ToDo: Find some pages and attach CScript to that page
  };

  connectAndKeepAlive(onChange) {
    try {
      if (this.clientPort) {
        this.clientPort.disconnect();
        this.clientPort = null;
      }
      const port = chrome.runtime.connect({ name: "keep-alive" });
      port.onMessage.addListener(() => {
        if (onChange) {
          onChange();
        }
      });
      this.clientPort = port;
      port.postMessage("keep-alive");
      port.onDisconnect.addListener(() =>
        setTimeout(() => this.connectAndKeepAlive(onChange), 20000)
      );
      console.log("Keeping SW alive", new Date());
    } catch (err) {
      console.log("Unable to keep-alive", err);
    }
  }

  /* Commented as no usage found
    getStorageInfo() {
        return navigator.storage.estimate().then((estimate) => {
            const usedSpace = estimate.usage;
            const totalSpace = estimate.quota;
            return {
                totalSpace: totalSpace,
                usedSpace: usedSpace,
                freeSpace: totalSpace - usedSpace,
                usedSpacePerc: Math.round(usedSpace * 100 / totalSpace)
            };
        });
    }

    getAppLongName() { // need to change
        return this.chrome.app.getDetails().name;
    }

    notify(id, title, message, ctxMsg, opts) {
        this.notSetting.init();
        this.notSetting.show(id, title, message, ctxMsg, opts);
    }

    addCmdListener(callback) { this.chrome.commands.onCommand.addListener(callback); }*/
}
