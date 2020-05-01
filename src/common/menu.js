import injectServices, { inject } from "../services";

injectServices();
const svc = {};
inject(svc, "AppBrowserService");

const $jaBrowserExtn = svc.$jaBrowserExtn;

const indexPageUrl = "/index.html";
const currentUserId = localStorage.getItem('CurrentUserId');

if (!localStorage.getItem('CurrentJiraUrl') || !currentUserId) {
  // Check and see if browser has activeTab permission. If not then redirect to integrate page
  $jaBrowserExtn.hasPermission({ permissions: ["activeTab"] }).then(hasPermission => {
    const integrateUrl = `${indexPageUrl}#/pages/integrate`;
    if (hasPermission) {
      document.location.href = integrateUrl;
    } else {
      $jaBrowserExtn.openTab(integrateUrl);
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
    url = `${indexPageUrl}#${url}`;

    $jaBrowserExtn.getCurrentUrl().then(curUrl => {
      if (!curUrl || replacePattern.indexOf(curUrl.toLowerCase()) > -1) {
        $jaBrowserExtn.replaceTabUrl(url);
        window.close();
        return;
      }

      $jaBrowserExtn.openTab(url);
      window.close();
    });
  }

  function bindEvents() {
    const links = document.getElementsByTagName("a");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', menuClicked);
    }
  }

  let menu = localStorage.getItem('menuAction');
  if (menu) {
    try {
      menu = JSON.parse(menu);
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
          document.location.href = `${indexPageUrl}?quick=true#/dashboard/${(menu.index || 0)}/1`;
          break;
      }
    } catch (err) { console.error(err); bindEvents(); }
  } else { bindEvents(); }
}
