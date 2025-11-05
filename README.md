# CloudFront Signed Cookie Web Application

A Node.js Express web application that dynamically generates and sets CloudFront signed cookies for authentication across subdomains.

## Features

- **Dynamic Cookie Generation**: Server generates signed cookies on login
- **Secure Cookie Setting**: Uses `httpOnly: true`, `secure`, and `sameSite` attributes
- **Cross-Subdomain Authentication**: Cookies work across subdomains using parent domain
- **Session Management**: Login/logout functionality with comprehensive cookie clearing
- **Flexible SSL Support**: Runs HTTPS with certificates or HTTP fallback
- **Environment Configuration**: Supports environment variables for security

## Architecture

- **Web App Domain**: `www.sample.hyundonk.dev` (via Application Load Balancer)
- **Static Content**: `assets.sample.hyundonk.dev` (CloudFront distribution)
- **Cookie Domain**: `.sample.hyundonk.dev` (shared across subdomains)
- **CORS Configuration**: Response headers policy enables cross-subdomain requests

## Setup

### Prerequisites
- AWS CloudFront distribution with signed cookie configuration
- Application Load Balancer with SSL certificate
- Private key file for CloudFront signing
- CloudFront Response Headers Policy with CORS configuration

### 1. Install Dependencies
```bash
cd webapp
npm install
```

### 2. Configure Environment (Optional)
```bash
export CLOUDFRONT_KEY_PAIR_ID="your-key-pair-id"
export PRIVATE_KEY_PATH="/path/to/private-key.pem"
export PORT=3000
```

### 3. Private Key Setup
Place your CloudFront private key at `./private-key.pem` or set `PRIVATE_KEY_PATH`

### 4. Start Server
```bash
# Primary server file
node server.js

# Alternative (same functionality)
npm start
```

### 5. Access Application
- **Development**: `http://localhost:3000` (HTTP fallback)
- **Production**: `https://www.sample.hyundonk.dev`

## Usage

1. **Login**: Enter any username with password `demo123`
2. **Cookie Setting**: Server sets three signed cookies for parent domain
3. **Test Access**: Click "Test Restricted Content" to verify authentication
4. **Logout**: Clears all CloudFront cookies using multiple methods

## API Endpoints

- `GET /` - Serve main page
- `POST /login` - Authenticate and set signed cookies
- `POST /logout` - Clear signed cookies (comprehensive clearing)

## Cookie Configuration

### Login Cookies
- **Resource**: `https://assets.sample.hyundonk.dev/restricted/*`
- **Expiration**: November 11, 2025
- **Key Pair ID**: K3Q9LE95NK34FS
- **Domain**: `.sample.hyundonk.dev` (works across subdomains)
- **Security**: `httpOnly: true`, `secure: true`, `sameSite: 'none'`

### Logout Process
Uses three clearing methods for maximum reliability:
1. Standard `res.clearCookie()` with original options
2. `res.clearCookie()` with `maxAge: 0`
3. Setting expired cookies as fallback

## CloudFront Configuration

### Required CORS Headers (Response Headers Policy)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Headers: Cookie`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Origin: https://www.sample.hyundonk.dev`

### Distribution Setup
- **Behavior `/restricted/*`**: S3 origin with signed cookie requirement
- **Response Headers Policy**: CORS configuration for cross-subdomain requests
- **Alternate Domain Name**: `assets.sample.hyundonk.dev`

## Security Features

- **Private Key External**: Loaded from file, not hardcoded in source
- **Environment Variables**: Configurable key pair ID and paths
- **Secure Cookies**: `httpOnly: true` prevents XSS access
- **Domain Scoping**: Parent domain allows subdomain sharing
- **Error Handling**: Graceful fallbacks and proper error responses
- **HTTPS/HTTP Fallback**: Automatic protocol detection

## Advantages Over Static Cookies

- **Dynamic Expiration**: Server-controlled cookie lifetimes
- **Proper Security Attributes**: Server-side cookie configuration
- **Session Management**: Integrated login/logout flow
- **Cross-Subdomain Support**: Works seamlessly across subdomains
- **Environment Flexibility**: Configurable for different environments
- **No Client-Side Secrets**: Private keys never exposed to browser

## Troubleshooting

### Common Issues
- **CORS Errors**: Ensure CloudFront response headers policy is configured
- **Cookie Not Clearing**: Multiple clearing methods handle browser differences
- **SSL Certificate**: Server falls back to HTTP if certificates not found
- **Private Key**: Check file path and permissions
- **Domain Mismatch**: Ensure cookie domain matches CloudFront alternate domain

### Development vs Production
- **Development**: Uses localhost with HTTP fallback
- **Production**: Requires proper SSL certificates, ALB, and domain configuration

## File Structure
```
webapp/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── private-key.pem        # CloudFront private key (not in repo)
├── server.key            # SSL certificate key (optional)
├── server.crt            # SSL certificate (optional)
└── public/
    └── index.html        # Frontend application
```
