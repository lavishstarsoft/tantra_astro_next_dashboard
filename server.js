// Passenger startup file for Namecheap cPanel (custom Next.js server).
const { createServer } = require('http');
const next = require('next');
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000, () => {
    console.log('Thantra Next.js ready on port', process.env.PORT || 3000);
  });
});
