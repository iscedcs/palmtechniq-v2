// // server.js
// const { createServer } = require("http");
// const next = require("next");
// const { initSocket } = require("./server/socket");

// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     handle(req, res);
//   });

//   // 🔌 Initialize Socket.IO
//   initSocket(server);

//   const port = process.env.PORT || 3000;
//   server.listen(port, (err) => {
//     if (err) throw err;
//     console.log(`🚀 Server ready on http://localhost:${port}`);
//   });
// });
