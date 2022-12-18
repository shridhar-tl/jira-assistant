import injectServices, { inject } from "../services/index.menu";
import { JAWebRootUrl } from '../constants/urls';

(async function () {
  // ToDo: Use of localStorage has to be removed once the settings for all the user is migrated
  injectServices();
  const svc = {};
  inject(svc, 'AppBrowserService', 'SettingsService');

  const { $jaBrowserExtn, $settings } = svc;
  const switched = await $settings.get('useWebVersion');
  const indexHtml = "/index.html";
  const indexPageUrl = switched ? JAWebRootUrl : indexHtml;
  const currentUserId = (await $settings.get('CurrentUserId')) || localStorage.getItem('CurrentUserId');
  //const CurrentJiraUrl = (await $settings.get('CurrentJiraUrl')) || localStorage.getItem('CurrentJiraUrl');
  const hasTabAccess = () => {
    try {
      return $jaBrowserExtn.hasPermission({ permissions: ["activeTab"] });
    } catch {
      return Promise.resolve(false);
    }
  };

  if (!currentUserId) {//!CurrentJiraUrl || 
    // Check and see if browser has activeTab permission. If not then redirect to integrate page
    hasTabAccess().then(hasPermission => {
      if (hasPermission) {
        document.location.href = `${indexPageUrl}?quick=true#/integrate`;
      } else {
        $jaBrowserExtn.openTab(`${indexPageUrl}#/integrate`);
        window.close();
      }
    });
  }
  else {
    const replacePattern = ['chrome://newtab/', 'chrome://tabs', 'about:newtab', 'about:tabs', 'about:blank'];

    function menuClicked(event) {
      openUrl(event.currentTarget.getAttribute('s-href'));
    }

    function openUrl(url) {
      url = `${indexPageUrl}${switched ? '' : '#'}${url}`;
      const handleError = () => false;

      hasTabAccess().then(hasAccess => {
        if (hasAccess) {
          return $jaBrowserExtn.getCurrentUrl().then(curUrl =>
            (!curUrl || replacePattern.indexOf(curUrl.toLowerCase()) > -1), handleError);
        } else {
          return false;
        }
      }, handleError).then((replace) => {
        if (replace) {
          $jaBrowserExtn.replaceTabUrl(url);
        } else {
          $jaBrowserExtn.openTab(url);
        }
        setTimeout(() => window.close(), 600);
      });
    }

    function bindEvents() {
      const links = document.getElementsByTagName("a");
      for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', menuClicked);
      }
    }

    let menu = (await $settings.get('menuAction')) || localStorage.getItem('menuAction');
    if (menu) {
      try {
        if (typeof menu === 'string') {
          menu = JSON.parse(menu);
        }
        switch (menu.action || 1) {
          case 1:
            if (menu.menus && menu.menus.length > 0 && Array.isArray(menu.menus)) {
              const menus = document.getElementById('menus');
              let html = '';
              for (let i = 0; i < menu.menus.length; i++) {
                const m = menu.menus[i];
                html += `<li><a s-href="${m.url}">${m.name}</a></li>`;
              }
              menus.innerHTML = html;
            }
          // eslint-disable-next-line
          default:
            bindEvents();
            break;
          case 2: openUrl(menu.url || '/dashboard/0'); break;
          case 3:
            document.location.href = `${indexHtml}?quick=true#/dashboard/${(menu.index || 0)}`;
            break;
        }
      } catch (err) { console.error(err); bindEvents(); }
    } else { bindEvents(); }
  }
})();