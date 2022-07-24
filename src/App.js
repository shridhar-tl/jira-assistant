import React, { PureComponent, createContext } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import 'moment-timezone/builds/moment-timezone-with-data.min.js';
import registerServices, { inject } from './services';
import getLoader from './components/loader';
import 'font-awesome/css/font-awesome.min.css';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/bootstrap4-light-purple/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'jsd-report/build/css/style.css';
import './scss/style.scss';
import './App.scss';
import { validateIfWebApp } from './common/proxy';

// Layout
const DefaultLayout = React.lazy(() => import('./layouts/DefaultLayout'));

// Pages
const ChooseAuthType = React.lazy(() => import('./views/pages/authenticate/ChooseAuthType'));
const Integrate = React.lazy(() => import('./views/pages/integrate/Integrate'));
const Page401 = React.lazy(() => import('./views/pages/p401/Page401'));

export const AppContext = createContext({});

const isWebBuild = process.env.REACT_APP_WEB_BUILD === 'true';

class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { isLoading: true, needIntegration: false, authenticated: false };
    this.beginInit();
  }

  componentDidMount() { this._mounted = true; }

  contextProps = {
    switchUser: (userId) => {
      let url = document.location.hash.substring(2);
      url = url.substring(url.indexOf("/"));
      url = `/${userId}${url}`;
      this.authenticateUser(url, true);
    },
    navigate: (url, userbased) => {
      this.props.history.push(userbased ? `/${this.$session.userId}${url}` : url);
    }
  };

  getMessanger = () => <Toast ref={(el) => this.messenger = el} baseZIndex={3000} />;

  async beginInit() {
    let authType;
    if (isWebBuild) {
      authType = localStorage.getItem('authType');

      const newState = { isLoading: false, authType };
      if ((!authType || authType === '1') && await validateIfWebApp(newState)) {
        this.setState(newState);
      }
      if (!authType || !newState.authReady) {
        this.props.history.push(`/auth`);
        return;
      }
    }

    this.beginLoad(authType);
  }

  authTypeChosen = (authType) => {
    this.setState({ authType, needIntegration: false });
    this.beginLoad(authType);
  };

  async beginLoad(authType) {
    registerServices(authType);
    inject(this, "AnalyticsService", "SessionService", "AuthService", "MessageService", "SettingsService", "CacheService");
    this.props.history.listen((location) => this.$analytics.trackPageView(location.pathname));

    this.$message.onNewMessage((message) => {
      let { detail } = message;
      if (detail && typeof detail !== 'string') {
        detail = detail.toString();
        message = { ...message, detail };
      }
      if (this.messenger) { this.messenger.show(message); }
    });

    await this.$settings.migrateSettings();
    this.authenticateUser(this.props.location.pathname);
  }

  authenticateUser(pathname, forceNavigate) {
    const parts = pathname.split("/");
    let userId = parseInt(parts[1]);
    if (!userId || isNaN(userId) || pathname === '/401') {
      userId = null;
    }

    // For existing users who uses old UI have the menu saved as /dashboard
    if (pathname.endsWith("/dashboard")) {
      forceNavigate = true;
      pathname += "/0";
    }

    if (pathname.startsWith("/dashboard")) {
      forceNavigate = true;
    }

    if (parts[1] === "integrate") {
      this.setState({ isLoading: false });
    } else {
      this.$auth.authenticate(userId).then((result) => {
        this.$analytics.trackPageView();

        if (result) {
          if (!pathname || pathname === "/") {
            this.props.history.push(`/${this.$session.userId}/dashboard/0`);
          }
          else if (forceNavigate) {
            if (pathname.startsWith("/dashboard")) {
              pathname = `/${this.$session.userId}${pathname}`;
            }
            this.props.history.push(pathname);
          }
          else if (!userId) {
            this.props.history.push(`/${this.$session.userId}${pathname}`);
          }
        }
        else {
          this.props.history.push(this.$session.needIntegration ? "/integrate" : "/401");
        }

        const sessionUser = this.$session.userId || null;
        this.setState({ isLoading: false, authenticated: result, jiraUrl: this.$session.rootUrl, userId: sessionUser });

      }, () => {
        this.props.history.push(this.$session.needIntegration ? "/integrate" : "/401");
        this.setState({ isLoading: false, needIntegration: this.$session.needIntegration, jiraUrl: this.$session.rootUrl });
      });
    }
  }

  render() {
    const { isLoading, userId, isExtnValid, extnUnavailable, needIntegration } = this.state;

    if (isLoading) {
      return <>{this.getMessanger()}{getLoader('Loading... Please wait...')}</>;
    }

    return (
      <>
        {this.getMessanger()}

        <AppContext.Provider value={this.contextProps}>
          <React.Suspense fallback={getLoader()}>
            <Switch>
              <Route exact path="/auth" name="Authenticate Page" render={props => <ChooseAuthType {...props}
                isExtnValid={isExtnValid} extnUnavailable={extnUnavailable} needIntegration={needIntegration} onAuthTypeChosen={this.authTypeChosen} />} />
              <Route exact path="/integrate" name="Integrate Page" render={props => <Integrate {...props} />} />
              <Route exact path="/401" name="Page 401" render={props => <Page401 {...props} jiraUrl={this.state.jiraUrl} />} />
              <Route key={userId} path="/:userId" name="Home" render={props => <DefaultLayout {...props} />} />
            </Switch>
          </React.Suspense>
        </AppContext.Provider>
      </>
    );
  }
}

export default withRouter(App);
