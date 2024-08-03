const express = require("express");
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");
const { hostname } = require("node:os");
const { join } = require("node:path");
const PORT = process.env.PORT || 5000;
const app = express();
const http = createServer(app);
const wss = new WebSocketServer({ server: http });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));

app
  .get("/healthz", (req, res) => {
    res.status(200).send(`${hostname()} is healthy and running.`);
  })
  .get("/", (req, res) => {
    res.send("ok !!!");
  });

wss.on("connection", (ws) => {
  console.log("A new client connected!");
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

http
  .listen(PORT)
  .on("listening", () => {
    console.log(`Server is listening at ${PORT}`);
  })
  .on("error", (error) => {
    console.log(`Server error: ${error}`);
  });
