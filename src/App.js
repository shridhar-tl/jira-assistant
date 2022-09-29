import React, { PureComponent } from 'react';
import { Route, Routes } from 'react-router-dom';
import 'moment-timezone/builds/moment-timezone-with-data.min.js';
import { getWatcher, withRouter } from './pollyfills';
import registerServices, { inject } from './services';
import getLoader from './components/loader';
import { Toast } from 'primereact/toast';
import { getExtnLaunchUrl, validateIfWebApp } from './common/proxy';
import { getCurrentQueryParams } from './common/utils';
import { AppContextProvider } from './common/context';
import { isAppBuild, isExtnBuild, isWebBuild } from './constants/build-info';
import 'font-awesome/css/font-awesome.min.css';
import 'primereact/resources/themes/bootstrap4-light-purple/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './scss/style.scss';
import './App.scss';
import { CustomDialog } from './dialogs';

export const extnAuth = isWebBuild && document.location.href.indexOf('?authType=1') > 0;

// Layout
const DefaultLayout = React.lazy(() => import('./layouts/DefaultLayout/DefaultLayout'));

// Pages
const IntegrateExtn = !isAppBuild && React.lazy(() => import('./views/pages/integrate/Integrate'));
const IntegrateWeb = !isExtnBuild && React.lazy(() => import('./views/pages/authenticate/ChooseAuthType'));
const BasicAuth = React.lazy(() => import('./views/pages/authenticate/BasicAuth'));
const OptionsPage = React.lazy(() => import('./views/settings/global/GlobalSettings'));

const Page401 = React.lazy(() => import('./views/pages/p401/Page401'));
const Poker = React.lazy(() => import('./views/poker/Poker'));

class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { isLoading: true, needIntegration: false, authenticated: false };
  }

  componentDidMount() {
    if (isWebBuild) {
      this.beginInit();
    } else {
      this.beginLoad();
    }
  }

  contextProps = {
    switchUser: (userId) => {
      let url = document.location.hash.substring(2);
      url = url.substring(url.indexOf("/"));
      url = `/${userId}${url}`;
      this.authenticateUser(url, true, true);
    },
    navigate: (url, userbased) => {
      this.props.navigate(userbased ? `/${this.$session.userId}${url}` : url);
    }
  };

  getMessanger = () => <Toast ref={(el) => this.messenger = el} baseZIndex={3000} />;

  async processJiraOAuthForExtn(code) {
    registerServices('1'); // Register proxy services
    inject(this, 'JiraAuthService', 'MessageService');
    const { success, message, userId: uid } = await this.$jAuth.integrate(code);
    if (success) {
      const url = await getExtnLaunchUrl(uid, this.$message);
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
    } else {
      this.$message.error(message);
    }
  }

  async processOutlookOAuth(code, state) {
    registerServices(state.authType); // Register services
    inject(this, 'OutlookOAuthService', 'MessageService');
    const token = await this.$msoAuth.getAndSaveToken(code, undefined, state.userId);
    if (window.opener) {
      window.opener.postMessage({ type: 'mso_auth', result: !!token }, "*");
    }
    window.close();
  }

  async beginInit() {
    let authType;
    const { oauth, code, state } = getCurrentQueryParams();

    if (oauth === 'jc') {
      if (state) {
        const { forWeb, authType: selAuthType } = JSON.parse(atob(state));
        if (forWeb && selAuthType) {
          authType = selAuthType;
          registerServices(authType || '1');
        } else if (!forWeb) {
          await this.processJiraOAuthForExtn(code);
          return;
        }
      }
    } else if (oauth === 'ol') {
      await this.processOutlookOAuth(code, JSON.parse(atob(state)));
      return;
    }

    authType = await this.initWeb(authType, oauth);

    this.beginLoad(authType, oauth, code);
  }

  async initWeb(authType, oauth) {
    if (isWebBuild && !oauth) {
      authType = localStorage.getItem('authType');

      const newState = { authType };
      const pathname = this.props.location?.pathname;
      if ((!authType || authType === '1' || pathname === '/integrate') && await validateIfWebApp(newState)) {
        if (extnAuth && !authType && newState.authReady) {
          localStorage.setItem('authType', 1);
          authType = '1';
          newState.authType = '1';
        }
      }

      this.setState(newState);

      if (!authType || (authType === '1' && !newState.authReady)) {
        this.setState({ isLoading: false });
        this.props.navigate(`/integrate`);
        return;
      }
    }

    return authType;
  }

  authTypeChosen = (authType) => {
    localStorage.setItem('authType', authType);
    this.setState({ authType, needIntegration: false });
    this.props.navigate('/');
    this.beginLoad(authType);
  };

  async beginLoad(authType, oauth, code) {
    registerServices(authType || '1');
    inject(this, "AnalyticsService", "SessionService", "AuthService", "MessageService", "SettingsService", "CacheService", "JiraAuthService");

    this.urlWatcher = getWatcher((location) => this.$analytics.trackPageView(location.pathname));

    this.$message.onNewMessage((message) => {
      let { detail } = message;
      if (detail && typeof detail !== 'string') {
        detail = detail.toString();
        message = { ...message, detail };
      }
      if (this.messenger) { this.messenger.show(message); }
    });

    await this.$settings.migrateSettings();

    if (oauth === 'jc') { // When Jira OAuth integration is done, save the user using authCode
      const { success, message, userId: uid } = await this.$jAuth.integrate(code);
      if (success) { // ToDo: if its extension handle it differently
        localStorage.setItem('authType', authType);
        document.location.href = `/${isWebBuild ? '' : 'index.html#'}/${uid}/dashboard/0`;
        return;
      } else {
        const newState = {};
        await validateIfWebApp(newState); // This function would not have got called as its a oauth request.
        this.setState(newState);
        this.$message.error(message, 'Jira Cloud Integration Failed');
      }
    }

    this.authenticateUser(this.props.location.pathname);
  }

  authenticateUser(pathname, forceNavigate, switchUser) {
    const parts = pathname.split("/");
    let userId = parseInt(parts[1]);
    if (!userId || isNaN(userId) || pathname === '/401') {
      userId = null;
    }

    if (pathname.endsWith("/dashboard")) {
      forceNavigate = true;
      pathname += "/0"; // Load the default dashboard if their is no dashboard id in url
    } else if (userId && pathname.includes(`/poker`)) {
      userId = null;
      pathname = pathname.substring(pathname.indexOf('/poker'));
      this.props.navigate(pathname);
    }

    if (pathname.startsWith("/dashboard")) {
      forceNavigate = true;
    }

    if (parts[1] === "integrate" || parts[1] === "options") {
      this.setState({ isLoading: false });
    } else {
      this.tryAuthenticate(userId, pathname, forceNavigate, switchUser);
    }
  }

  navigatePostLogin(userId, result, pathname, forceNavigate, switchUser, sessionUser) {
    if (result) {
      if (!pathname || pathname === "/") {
        this.props.navigate(`/${this.$session.userId}/dashboard/0`);
      }
      else if (forceNavigate) {
        if (pathname.startsWith("/dashboard")) {
          pathname = `/${this.$session.userId}${pathname}`;
        }

        this.props.navigate(pathname);
      }
      else if (!userId) {
        this.props.navigate(`/${this.$session.userId}${pathname}`);
      }
      try {
        if (switchUser && sessionUser) {
          (async () => {
            await this.$settings.set("CurrentJiraUrl", this.$session.rootUrl);
            await this.$settings.set("CurrentUserId", sessionUser);
          })();
        }
      } catch (err) {
        console.error('Unable to save default user:', err);
      }
    }
    else {
      this.props.navigate(this.$session.needIntegration ? "/integrate" : "/401");
    }
  }

  tryAuthenticate(userId, pathname, forceNavigate, switchUser) {
    this.$auth.authenticate(userId).then((result) => {
      this.$analytics.trackPageView();

      const sessionUser = this.$session.userId || null;

      if (!pathname?.startsWith('/poker')) {
        this.navigatePostLogin(userId, result, pathname, forceNavigate, switchUser, sessionUser);
      }

      this.setState({ isLoading: false, authenticated: result, jiraUrl: this.$session.rootUrl, userId: sessionUser });

    }, () => {
      this.props.navigate(this.$session.needIntegration ? "/integrate" : "/401");
      this.setState({ isLoading: false, needIntegration: this.$session.needIntegration, jiraUrl: this.$session.rootUrl });
    });
  }

  render() {
    const { isLoading, userId, isExtnValid, extnUnavailable, needIntegration, authType } = this.state;

    if (isLoading) {
      return <>{this.getMessanger()}{getLoader('Loading... Please wait...')}</>;
    }

    const UrlWatcher = this.urlWatcher;

    return (
      <>
        {this.getMessanger()}
        {!!UrlWatcher && <UrlWatcher />}

        <AppContextProvider value={this.contextProps}>
          <React.Suspense fallback={getLoader()}>
            <Routes>
              {!isExtnBuild && <Route exact path="/integrate" name="Authenticate Page" element={<IntegrateWeb
                isWebBuild={isWebBuild} isExtnValid={isExtnValid} extnUnavailable={extnUnavailable}
                needIntegration={needIntegration} onAuthTypeChosen={this.authTypeChosen} />} />}

              {!isAppBuild && <Route exact path={isWebBuild ? "/integrate/extn" : "/integrate"} name="Integrate Page"
                element={<IntegrateExtn isWebBuild={isWebBuild} setAuthType={isWebBuild ? this.authTypeChosen : undefined} />} />}

              <Route exact path="/integrate/basic" name="Basic Auth Page"
                element={<BasicAuth isWebBuild={isWebBuild} setAuthType={isWebBuild ? this.authTypeChosen : undefined} />}>
                <Route exact path=":store" name="Basic Auth Page"
                  element={<BasicAuth isWebBuild={isWebBuild} setAuthType={isWebBuild ? this.authTypeChosen : undefined} />} />
              </Route>

              <Route exact path="/options" name="Options Page" element={<OptionsPage />} />
              <Route exact path="/401" name="Page 401" element={<Page401 jiraUrl={this.state.jiraUrl} />} />

              <Route path="/poker/*" name="Planning Poker" element={<Poker hasExtensionSupport={!isWebBuild || isExtnValid} />} />

              {(!isWebBuild || !!authType) && <Route path="/:userId/*" name="Home" element={<DefaultLayout key={userId} />} />}
            </Routes>
            <CustomDialog />
          </React.Suspense>
        </AppContextProvider>
      </>
    );
  }
}

export default withRouter(App);
