const express = require('express');
const https = require('https');
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load private key from file (not hardcoded)
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const privateKeyPath = process.env.PRIVATE_KEY_PATH || path.join(__dirname, 'private-key.pem');

let privateKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
} catch (error) {
  console.error('Failed to load private key:', error.message);
  process.exit(1);
}

const cloudFront = new AWS.CloudFront.Signer(keyPairId, privateKey);

// SSL certificate options with fallback
let options = {};
try {
  options = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
  };
} catch (error) {
  console.warn('SSL certificates not found, falling back to HTTP');
}

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username && password === 'demo123') {
    const expireTime = Math.floor(new Date("2025-11-11").getTime() / 1000);
    const policy = JSON.stringify({
      Statement: [{
        Resource: "https://assets.sample.hyundonk.dev/restricted/*",
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": expireTime
          }
        }
      }]
    });

    try {
      const signedCookies = cloudFront.getSignedCookie({ policy });

      // Set cookies with proper security attributes
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.sample.hyundonk.dev',
        maxAge: expireTime * 1000 - Date.now()
      };

      res.cookie('CloudFront-Policy', signedCookies['CloudFront-Policy'], cookieOptions);
      res.cookie('CloudFront-Signature', signedCookies['CloudFront-Signature'], cookieOptions);
      res.cookie('CloudFront-Key-Pair-Id', signedCookies['CloudFront-Key-Pair-Id'], cookieOptions);

      res.json({ success: true, message: 'Login successful, cookies set!' });
    } catch (error) {
      console.error('Cookie signing error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate signed cookies' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/logout', (req, res) => {
  // Try multiple clearing approaches
  const clearOptions1 = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.sample.hyundonk.dev'
  };
  
  const clearOptions2 = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.sample.hyundonk.dev',
    maxAge: 0
  };
  
  // Clear with original options
  res.clearCookie('CloudFront-Policy', clearOptions1);
  res.clearCookie('CloudFront-Signature', clearOptions1);
  res.clearCookie('CloudFront-Key-Pair-Id', clearOptions1);
  
  // Also try with maxAge: 0
  res.clearCookie('CloudFront-Policy', clearOptions2);
  res.clearCookie('CloudFront-Signature', clearOptions2);
  res.clearCookie('CloudFront-Key-Pair-Id', clearOptions2);
  
  // Set expired cookies as fallback
  res.cookie('CloudFront-Policy', '', { ...clearOptions1, expires: new Date(0) });
  res.cookie('CloudFront-Signature', '', { ...clearOptions1, expires: new Date(0) });
  res.cookie('CloudFront-Key-Pair-Id', '', { ...clearOptions1, expires: new Date(0) });
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// Start server (HTTPS if certificates available, otherwise HTTP)
if (options.key && options.cert) {
  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running at https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running at http://localhost:${PORT}`);
  });
}
