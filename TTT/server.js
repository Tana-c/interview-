// server.js
import serveStatic from 'serve-static';
import express from 'express';
import path from 'path';

const app = express();
app.use(serveStatic('public', { index: ['index.html', 'index.htm'] }))
app.listen(3000)

