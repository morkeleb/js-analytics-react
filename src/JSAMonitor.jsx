import React from 'react';
require('isomorphic-fetch');

const settings = {};
function write_report_with_fetch(error) {
  fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // TODO: CORS HEADERS HERE?
    },
    body: JSON.stringify(error),
  });
}

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export const monitor = {
  report: function (err, capturePoint) {
    // TODO align window on error with try catch information
    // TODO add more info from node crashes here
    var error = {
      stack: err.stack,
      error_message: err.message,
      url: err.fileName || canUseDOM ? location.href : '',
      error_line: err.lineNumber,
      query_string: canUseDOM ? location.search : '',
      script_url: canUseDOM ? location.script_url : '',
      http_referrer: canUseDOM ? document.referrer : '',
      useragent: canUseDOM ? navigator.userAgent : 'Node',
      capturePoint,
    };

    if (fetch) {
      write_report_with_fetch(error);
    }
  },
  guard: function (func) {
    try {
      func();
    } catch (err) {
      this.report(err);
    }
  },
  setup: function (props = {}) {
    settings.host = props.host || 'js-analytics.com';
    settings.protocol =
      canUseDOM &&
      document.location.protocol &&
      settings.host.indexOf('localhost') == -1
        ? 'https://'
        : 'http://';
    settings.endpoint =
      settings.protocol + settings.host + '/api/errors/v1/' + props.pid;
    // Add general error logging.
    process.on('unhandledRejection', (error, promise) => {
      monitor.report(error, 'Node unhandled promise rejection');
    });

    process.on('uncaughtException', error => {
      monitor.report(error, 'Node unhandled exception');
    });

    // todo add react-native check here
  },
};

export default class JSAMonitor extends React.Component {
  constructor(props) {
    if (!props.pid) {
      throw 'No pid set in props';
    }
    monitor.setup(props);

    super(props);
    this.unpackPromise = this.unpackPromise.bind(this);
    this.reportEventError = this.reportEventError.bind(this);
  }
  static getDerivedStateFromError(error) {}

  async unpackPromise(event) {
    monitor.report(event.reason, 'Browser unhandled rejection');
  }
  reportEventError(event) {
    if (event.type === 'unhandledrejection') {
      this.unpackPromise(event);
      return;
    }
    if (event.error && event.error.hasBeenCaught === true) {
      return false;
    }
    monitor.report(event.error, 'Browser ' + event.type);
    if (event.error) {
      event.error.hasBeenCaught = true;
    }
  }

  componentDidMount() {
    window.addEventListener('error', this.reportEventError);
    window.addEventListener('unhandledrejection', this.reportEventError);
    window.addEventListener('uncaughtException', this.reportEventError);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.reportEventError);
    window.removeEventListener('unhandledrejection', this.reportEventError);
    window.removeEventListener('uncaughtException', this.reportEventError);
  }

  componentDidCatch(error, { componentStack }) {
    if (error.hasBeenCaught === true) {
      return false;
    }
    monitor.report({ ...error, stack: componentStack }, 'React error boundary');

    error.hasBeenCaught = true;
  }

  render() {
    return this.props.children;
  }
}
