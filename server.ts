import React from "react";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { renderToString } from "react-dom/server";
import { readdir } from "fs";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const port = 9999;
const host = "localhost";
const pagesDir = "./client/src/pages";

const routes = new Map<string, Handler>();

const app = createServer((req, res) => {
  const handler = routes.get(req.url!);
  res.setHeader("Content-type", "text/html");

  handler?.(req, res);
  console.log(req.url);
});

const createDocument = (content: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
      ${content}
    </div>
  </body>
</html>`;

function createRoute(routePath: string, fileName?: string) {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const { getProps, default: Component } = await import(
      `${pagesDir}/${fileName}`
    );

    if (typeof Component !== "function") {
      // if (process.env.NODE_ENV !== "production") {
      res.writeHead(404);
      res.end(
        createDocument(
          `<div style={{ color: '#f00' }}>Component is not defined or not exported as default at ${pagesDir}/${fileName}</div>`
        )
      );
      // }
    }

    const configs = await getProps?.();
    const props = configs?.props || {};

    let component: string;
    let document: string | undefined;

    try {
      component = renderToString(React.createElement(Component, props));
      document = createDocument(component);
    } catch {}

    res.end(document);
  };

  routes.set(routePath, handler);
}

readdir(pagesDir, (err, files) => {
  if (err) {
    throw err;
  }
  const allowedExtensions = ["jsx", "tsx", "js"];
  for (let path of files) {
    const [fileName, extenstion] = path.split(".");

    if (allowedExtensions.includes(extenstion)) {
      if (fileName === "index") {
        createRoute("/", path);
        continue;
      }
      createRoute("/" + fileName, path);
      continue;
    }
    console.warn(
      `[${path}]: create only react-supported extenstions in pages folder`
    );
  }
});

app.listen(port, host, () => {
  console.log(`server running at ${host}:${port}`);
});
