const https = require('https');

https.get('https://shahnoza-erkinova.netlify.app/assets/index-D4_jmCKy.css', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('downloaded.css', data);
    console.log('CSS downloaded');
  });
});
