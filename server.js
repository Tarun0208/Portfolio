import http from 'http';
            import fs from 'fs';
            import path from 'path';

            const hostname = '127.0.0.1';
            const port = 1113;

            const server = http.createServer((req, res) => {
              let filePath = `.${req.url}`;
              if (filePath === './') {
                filePath = './index.html'; // Default file
              }

              const extname = String(path.extname(filePath)).toLowerCase();
             const mimeTypes = {
                  '.html': 'text/html',
                  '.js': 'text/javascript',
                  '.css': 'text/css',
                  '.json': 'application/json',
                  '.png': 'image/png',
                  '.jpg': 'image/jpg',
                  '.gif': 'image/gif',
                  '.svg': 'image/svg+xml',
                  '.wav': 'audio/wav',
                  '.mp4': 'video/mp4',
                  '.woff': 'application/font-woff',
                  '.ttf': 'application/font-ttf',
                  '.eot': 'application/vnd.ms-fontobject',
                  '.otf': 'application/font-otf',
                  '.wasm': 'application/wasm',
                  '.pdf': 'application/pdf',
                  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                };

                const contentType = mimeTypes[extname] || 'application/octet-stream';

                fs.readFile(filePath, (error, content) => {
                  if (error) {
                    if (error.code === 'ENOENT') {
                      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                      res.end('<h1>404 Not Found</h1>');
                    } else {
                      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                      res.end(`Server Error: ${error.code}`);
                    }
                    return;
                  }

                  // IMPORTANT: don't force an encoding here — it will corrupt binary files (e.g., .docx)
                  res.writeHead(200, { 'Content-Type': contentType });
                  res.end(content);
                });
});

            server.listen(port, hostname, () => {
              console.log(`Server running at http://${hostname}:${port}/`);
            });
