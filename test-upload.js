const http = require('http');
const fs = require('fs');
const path = require('path');

const dummyFile = path.join(__dirname, 'dummy.mp4');
if (!fs.existsSync(dummyFile)) {
  fs.writeFileSync(dummyFile, 'dummy content');
}

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="title"\r\n\r\n';
body += 'Test Course\r\n';

body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="description"\r\n\r\n';
body += 'Test Description\r\n';

body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="instructor"\r\n\r\n';
body += 'Test Instructor\r\n';

body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="durationMinutes"\r\n\r\n';
body += '5\r\n';

body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="video"; filename="dummy.mp4"\r\n';
body += 'Content-Type: video/mp4\r\n\r\n';
body += fs.readFileSync(dummyFile).toString() + '\r\n';
body += '--' + boundary + '--\r\n';

const options = {
  hostname: 'localhost',
  port: 5007,
  path: '/courses',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(body);
req.end();
