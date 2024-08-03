const express = require("express");
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");
const { hostname } = require("node:os");
const { join } = require("node:path");
const fs = require("node:fs");
const PORT = process.env.PORT || 5000;
const app = express();
const http = createServer(app);
const wss = new WebSocketServer({ server: http });
const { Readable, Writable, Transform, pipeline } = require("node:stream");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));

app
  .get("/healthz", (req, res) => {
    res.status(200).send(`${hostname()} is healthy and running.`);
  })
  .get("/", (req, res) => {
    res.send("ok !!!");
  })
  .get("/videos/:name", async (req, res) => {
    console.log("req rec");

    const { name } = req.params;
    const filePath = join(__dirname, "public", "videos", `${name}.mp4`);

    try {
      const fileStat = fs.statSync(filePath);
      const { size: fileSize } = fileStat;
      const rangeHeader = req.headers.range;
      console.log(`fileSize: ${fileSize}`);
      console.log(`range: ${rangeHeader}`);

      if (rangeHeader) {
        const range = rangeHeader.split("=")[1].split("-");
        const start = parseInt(range[0], 10);
        const end = range[1] ? parseInt(range[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        };
        const videoReadStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, head);
        videoReadStream.pipe(res);
      } else {
        const head = {
          "Accept-Ranges": "bytes",
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        const videoReadStream = fs.createReadStream(filePath);
        videoReadStream.pipe(res);
      }
    } catch (error) {
      console.error(`Error accessing file ${filePath}:`, error);
      res.status(404).send("File not found");
    }
  });

wss.on("connection", (ws) => {
  console.log("A new client connected!");
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  const filePath = join(
    __dirname,
    "public",
    "videos",
    `Big-O Notation in 100 Seconds.mp4`
  );
  const videoReadStream = fs.createReadStream(filePath);
  videoReadStream.on("data", (data) => {
    if(ws.readyState == ws.OPEN){
      ws.send(data);
    }
  
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
