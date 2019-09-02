const chrome = window["chrome"];
const browser = window["browser"];
const useNewUI = (localStorage.getItem("useNewUI") || false);

const indexPageUrl = useNewUI ? "/index.html" : "/old/index.html";

if (!localStorage.getItem('CurrentJiraUrl') || !localStorage.getItem('CurrentUserId')) { document.location.href = `${indexPageUrl}#/pages/integrate`; }
else {
  const isFirefox = typeof InstallTrigger !== 'undefined';
  const isChrome = !!chrome && (!!chrome.webstore || !!chrome.identity) && !isFirefox;

  const replacePattern = ['chrome://newtab/', 'chrome://tabs', 'about:newtab', 'about:tabs', 'about:blank'];

  function menuClicked(event) {
    openUrl(event.currentTarget.getAttribute('s-href'));
  }

  function openUrl(url) {
    url = `${indexPageUrl}#${url}`;

    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const tab = tabs[0];
        const curUrl = tab.url;

        if (!curUrl || replacePattern.indexOf(curUrl.toLowerCase()) > -1) {
          chrome.tabs.update(tab.id, { url: url });
          window.close();
          return;
        }
      }
      if (isChrome) {
        window.open(url);
      }
      else {
        browser.tabs.create({ url: url });
      }
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
