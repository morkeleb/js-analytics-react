import React from 'react';
import { Monitor, JSAOptions, HandledError } from './Monitor';

export  class JSAMonitor extends React.Component<JSAOptions> {
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
