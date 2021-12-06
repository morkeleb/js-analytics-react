//require('isomorphic-fetch');

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export type JSAOptions = {
  host?: string,
  pid: string
};

export type HandledError =  Error & {hasBeenCaught: boolean}

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
      this.host.indexOf('localhost') === -1
        ? 'https://'
        : 'http://';
    this.endpoint =
      protocol + this.host + '/api/errors/v1/' + options.pid;
    // Add general error logging.
    process.on('unhandledRejection', (error:HandledError, promise) => {
      console.log('what 2?');
      this.report(error, 'Node unhandled promise rejection');
    });

    process.on('uncaughtException', (error:HandledError)=> {
      console.log('what?');
      
      this.report(error, 'Node unhandled exception');
    });
    this.report = this.report.bind(this);
    this.guard = this.guard.bind(this);
    this.guardAsync = this.guardAsync.bind(this);
    this.write_report_with_fetch = this.write_report_with_fetch.bind(this);
    this.write_report_with_beacon = this.write_report_with_beacon.bind(this);
  }

  write_report_with_beacon(error:JSAError){
    navigator.sendBeacon(this.endpoint, JSON.stringify(error));
  }

   write_report_with_fetch(error:JSAError) {
     console.log('doing error', error);
     
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
  async guardAsync(func:Function){
    try {
      await func();
    } catch (err) {
      this.report(err as HandledError, "Caught with guard");
    }
  }
}

export function setupJSAnalytics(settings:JSAOptions){
    // @ts-ignore: keeping the monitor on the process object if possible
   process.__jsamonitor = new Monitor(settings);
}