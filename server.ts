import React, { ComponentProps } from "react";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { renderToString } from "react-dom/server";
import { readdir } from "fs";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const port = 9999;
const host = "localhost";
const pagesDir = "./src/pages";

const routes = new Map<string, Handler>();
const protectedRoutes = new Map<string, React.FC>();

// const NotFoundPage = import("./src/pages/_404");

const app = createServer((req, res) => {
  const handler = routes.get(req.url!);
  const notFound = async () => {
    const NotFoundPage = protectedRoutes.get("_404");
    const _404html = await render(NotFoundPage).catch((e) => {
      console.log('catch', e)
      return `<h1>404 Not found</h1>`;
    });
    res.end(createDocument(_404html));
  };
  res.setHeader("Content-type", "text/html");
  handler?.(req, res) || notFound();

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

async function createRoute(routePath: string, fileName?: string) {
  const { getProps, default: Component } = await import(
    `${pagesDir}/${fileName}`
  );
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const configs = await getProps?.();
    const props = configs?.props || {};

    let html: string;
    let document: string | undefined;

    try {
      html = await render(Component, props);
      document = createDocument(html);
    } catch {
      // if (process.env.NODE_ENV !== "production") {
      res.writeHead(404);
      res.end(
        createDocument(
          `<div style={{ color: '#f00' }}>
             Component is not defined or not exported as default at ${pagesDir}/${fileName}
           </div>`
        )
      );
      // }
    }
    res.end(document);
  };

  routes.set(routePath, handler);
}

const render = async (
  component: unknown,
  props: ComponentProps<any> = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof component === "function") {
      resolve(
        renderToString(React.createElement(component as React.FC, props))
      );
      return;
    }
    reject();
  });
};

readdir(pagesDir, async (err, files) => {
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
    } else {
      console.warn(
        `[${path}]: create files with only react-supported extentions in pages folder`
      );
    }

    if (path.startsWith("_")) {
      const { default: module } = await import(pagesDir + "/" + path);
      protectedRoutes.set(path, module);
    }
  }
});

app.listen(port, host, () => {
  console.log(`server running at ${host}:${port}`);
});
