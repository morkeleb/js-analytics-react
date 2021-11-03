import React from 'react';
require('isomorphic-fetch');

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

type JSAOptions = {
  host?: string,
  pid: string
};

type HandledError =  Error & {hasBeenCaught: boolean}

type JSAError = {
  stack: string,
  error_message: string,
  url: string,
  query_string: string,
  http_referrer: string,
  useragent: string,
  capturePoint: string,
};

export class Monitor {
  host: string;
  endpoint: string;
  constructor(options:JSAOptions){
    this.host = options.host || 'js-analytics.com';
    const protocol =
      canUseDOM &&
      document.location.protocol &&
      this.host.indexOf('localhost') == -1
        ? 'https://'
        : 'http://';
    this.endpoint =
      protocol + this.host + '/api/errors/v1/' + options.pid;
    // Add general error logging.
    process.on('unhandledRejection', (error:HandledError, promise) => {
      this.report(error, 'Node unhandled promise rejection');
    });

    process.on('uncaughtException', (error:HandledError)=> {
      this.report(error, 'Node unhandled exception');
    });
    this.report = this.report.bind(this);
    this.guard = this.guard.bind(this);
    this.write_report_with_fetch = this.write_report_with_fetch.bind(this);
    this.write_report_with_beacon = this.write_report_with_beacon.bind(this);
  }

  write_report_with_beacon(error:JSAError){
    navigator.sendBeacon(this.endpoint, JSON.stringify(error));
  }

   write_report_with_fetch(error:JSAError) {
    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // TODO: CORS HEADERS HERE?
      },
      body: JSON.stringify(error),
    });
  }

  report(err:Error, capturePoint: string){

    // TODO align window on error with try catch information
    // TODO add more info from node crashes here
    var error : JSAError = {
      stack: err.stack||'',
      error_message: err.message,
      url: canUseDOM ? location.href : '',
      query_string: canUseDOM ? location.search : '',
      http_referrer: canUseDOM ? document.referrer : '',
      useragent: canUseDOM ? navigator.userAgent : 'Node',
      capturePoint,
    };

    // @ts-ignore: Need to check for navigator and beacon to send with beacon
    if(navigator && navigator.sendBeacon){
      this.write_report_with_beacon(error)
    } else {
      this.write_report_with_fetch(error);
    }
    
  }

  guard(func:Function){
    try {
      func();
    } catch (err) {
      this.report(err as HandledError, "Caught with guard");
    }
  }
}

export function setupJSAnalytics(settings:JSAOptions){
  new Monitor(settings);
}

export default class JSAMonitor extends React.Component<JSAOptions> {
  monitor: Monitor;
  constructor(props:JSAOptions) {
    if (!props.pid) {
      throw 'No pid set in props';
    }

    super(props);
    this.monitor = new Monitor(props);
    this.unpackPromise = this.unpackPromise.bind(this);
    this.reportEventError = this.reportEventError.bind(this);
  }

  async unpackPromise(event:any) {
    this.monitor.report(event.reason, 'Browser unhandled rejection');
  }
  reportEventError(event:any) {
    if (event.type === 'unhandledrejection') {
      this.unpackPromise(event);
      return;
    }
    if (event.error && event.error.hasBeenCaught === true) {
      return false;
    }
    this.monitor.report(event.error, 'Browser ' + event.type);
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

  componentDidCatch(error:HandledError, { componentStack }:{componentStack: string}) {
    if (error.hasBeenCaught === true) {
      return false;
    }
    this.monitor.report({ ...error, stack: componentStack } as HandledError, 'React error boundary');

    error.hasBeenCaught = true;
  }

  render() {
    return this.props.children;
  }
}
