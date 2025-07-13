//
// This is the html boilerplate for the web application
//

import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every web page during static rendering.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Pickleball Sessions</title>
        <meta name="description" content="Organize and manage pickleball sessions with fair player rotation and team balancing." />

        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        <ScrollViewStyleReset />

        {/* Using raw CSS styles to allow for modular CSS */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #f9fafb;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #111827;
  }
}
`;
