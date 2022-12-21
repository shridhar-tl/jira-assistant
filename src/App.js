import React, { PureComponent, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import 'moment-timezone/builds/moment-timezone-with-data.min.js';
import { UrlWatcher } from './pollyfills';
import { isPluginBuild } from './constants/build-info';
import { inject } from './services';
import withInitParams from './layouts/initialization/index';
import withAuthInfo from './layouts/authorization/index';
import Renderer from './layouts/renderer';
import 'font-awesome/css/font-awesome.min.css';
import 'primereact/resources/themes/bootstrap4-light-purple/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './scss/style.scss';
import './App.scss';

class App extends PureComponent {
  constructor(props) {
    super(props);
    inject(this, "AnalyticsService", "SessionService", "MessageService");
  }

  onRouteChanged = (location) => this.$analytics.trackPageView(location.pathname);

  render() {
    const { initValue, authInfo } = this.props;

    return (<>
      <MessageBox $message={this.$message} />
      {!isPluginBuild && <UrlWatcher onChange={this.onRouteChanged} />}

      <Renderer initValue={initValue} authInfo={authInfo}
        authTypeChosen={this.props.authTypeChosen} $session={this.$session}
      />
    </>);
  }
}

export default withInitParams(withAuthInfo(App));

const MessageBox = React.memo(function ({ $message }) {
  const toastRef = useRef();
  useEffect(() => {
    if (!$message) { return; }

    const callback = (message) => {
      let { detail } = message;
      if (detail && typeof detail !== 'string') {
        detail = detail.toString();
        message = { ...message, detail };
      }
      if (toastRef.current) { toastRef.current.show(message); }
    };
    $message.onNewMessage(callback);
  });

  return (<Toast ref={toastRef} baseZIndex={3000} />);
});