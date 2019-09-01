import React, { PureComponent } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import 'moment-timezone/builds/moment-timezone-with-data.min.js';
import registerServices, { inject } from './services';
import 'font-awesome/css/font-awesome.min.css';
import { Growl } from 'primereact/growl';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'jsd-report/build/css/style.css';
import './scss/style.scss';

import './App.scss';
import { isNumber } from 'util';

const loading = () => (
  <div style={{ position: "fixed", top: "0px", left: "0px", height: "100%", minHeight: "600px", width: "100%", minWidth: "700px", zIndex: 3000, backgroundColor: "#f1f5f9" }}>
    <div className="center-block" style={{ width: "200px", marginTop: "150px" }}>
      <h4 className="animated fadeIn text-center">
        <i className="fa fa-refresh fa-spin" style={{ fontSize: "150px", fontWeight: "bold" }}></i>
        <br /><br />
        Loading... Please wait...
      </h4>
    </div>
  </div>);

// Layout
const DefaultLayout = React.lazy(() => import('./layouts/DefaultLayout'));

// Pages
const Integrate = React.lazy(() => import('./views/pages/integrate/Integrate'));
const Page401 = React.lazy(() => import('./views/pages/p401/Page401'));

class App extends PureComponent {
  constructor(props) {
    super(props);
    registerServices();
    inject(this, "SessionService", "AuthService", "MessageService");
    this.state = { isLoading: true, needIntegration: false, authenticated: false };
  }

  getMessanger = () => <Growl ref={(el) => this.messenger = el} baseZIndex={3000} />

  UNSAFE_componentWillMount() {
    this.$message.onNewMessage((message) => {
      if (this.messenger) { this.messenger.show(message); }
    });

    const { pathname } = this.props.location;
    const parts = pathname.split("/");
    let userId = parseInt(parts[1]);
    if (!userId || !isNumber(userId)) {
      userId = null;
    }
    if (parts[1] === "integrate") {
      this.setState({ isLoading: false });
    } else {
      this.$auth.authenticate(userId).then((result) => {
        this.setState({ isLoading: false, authenticated: result, jiraUrl: this.$session.rootUrl });

        if (result) {
          if (!pathname || pathname === "/") {
            this.props.history.push(`/${this.$session.userId}/dashboard/1`);
          }
          else if (!userId) {
            this.props.history.push(`/${this.$session.userId}${pathname}`);
          }
        }
        else {
          this.props.history.push(this.$session.needIntegration ? "/integrate" : "/401");
        }
      }, () => {
        this.props.history.push(this.$session.needIntegration ? "/integrate" : "/401");
        this.setState({ isLoading: false, needIntegration: this.$session.needIntegration, jiraUrl: this.$session.rootUrl });
      });
    }
  }

  render() {
    const { isLoading } = this.state;

    if (isLoading) {
      return <>{this.getMessanger()}{loading()}</>;
    }

    return (
      <>
        {this.getMessanger()}

        <React.Suspense fallback={loading()}>
          <Switch>
            <Route exact path="/integrate" name="Integrate Page" render={props => <Integrate {...props} />} />
            <Route exact path="/401" name="Page 401" render={props => <Page401 {...props} jiraUrl={this.state.jiraUrl} />} />
            <Route path="/:userId" name="Home" render={props => <DefaultLayout {...props} />} />
          </Switch>
        </React.Suspense>
      </>
    );
  }
}

export default withRouter(App);
