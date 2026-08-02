/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const application = next({
  dev: false,
  port,
});
const handle = application.getRequestHandler();

application
  .prepare()
  .then(() => {
    createServer((request, response) => handle(request, response)).listen(port, () => {
      console.log(`BarberApp ready on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start BarberApp", error);
    process.exit(1);
  });
