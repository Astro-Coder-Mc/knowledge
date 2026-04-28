const https = require('https');

https.get('https://shahnoza-erkinova.netlify.app/assets/index-iqn5zIAh.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // Extract readable strings
    const strings = data.match(/(?:"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g);
    if (strings) {
      const longStrings = strings
        .map(s => s.slice(1, -1)) // remove quotes
        .filter(s => s.length > 10 && !s.includes('function') && !s.includes('return') && !s.match(/^[A-Za-z0-9+/=]+$/))
        .slice(0, 100);
      console.log(JSON.stringify(longStrings, null, 2));
    }
  });
});
