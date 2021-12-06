# @js-analytics/react

@js-analytics/react is a TypeScript library for collecting and reporting errors to https://js-analytics.com.

## Installation

Use the package manager npm or yarn to install @js-analytics/react.

```bash
npm install -S @js-analytics/react
```

or

```bash
yarn add @js-analytics/react
```

## Usage

The monitor works with react error boundaries. By wrapping your react app with the code you want the monitor to keept rack of you can have all errors reported back to js-analytics. Allowing you to fix them according to how often they occur.

```typescript

import JSAMonitor from '@js-analytics/react';

// more code here

// in your render
return (
  <JSAMonitor
      pid="<<YOUR JS-ANALYTICS PROJECT ID>>"
    >
    your react code goes here
    </JSAMonitor>
)

```

in Next.js I recommend placing is in the `pages/_app.tsx` file:
```typescript

import JSAMonitor from '@js-analytics/react';

function MyApp({ Component, pageProps, router }) {
return (
  <JSAMonitor
      pid="<<YOUR JS-ANALYTICS PROJECT ID>>"
    >
    your react code goes here
    </JSAMonitor>
  );
}

export default MyApp;
```
This will capture all errors that occur during server-side render and client-side executions and report them to JS-Analytics.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)