/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((request, response) => {
      Promise.resolve(handle(request, response)).catch((error) => {
        console.error("Request failed:", error);
        if (!response.headersSent) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
        }
        response.end("Internal Server Error");
      });
    });

    server.listen(port, () => {
      console.log(`CraftRoni listening on port ${port}`);
    });

    process.once("SIGTERM", () => {
      server.close(() => process.exit(0));
    });
  })
  .catch((error) => {
    console.error("Failed to start CraftRoni:", error);
    process.exit(1);
  });
