/**
 * Generate RSA Key Pair for JWT RS256
 * Run this script to generate private and public keys for JWT signing
 * 
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Save keys to files
const privateKeyPath = path.join(keysDir, 'jwt-private.key');
const publicKeyPath = path.join(keysDir, 'jwt-public.key');

fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

// Create .gitignore for keys directory
const gitignorePath = path.join(keysDir, '.gitignore');
fs.writeFileSync(gitignorePath, '# Ignore all key files\n*.key\n');

console.log('✅ RSA key pair generated successfully!');
console.log(`📁 Private key: ${privateKeyPath}`);
console.log(`📁 Public key: ${publicKeyPath}`);
console.log('\n⚠️  IMPORTANT:');
console.log('1. Keep your private key secure and never commit it to version control');
console.log('2. Add the following to your .env file:');
console.log(`\n   JWT_PRIVATE_KEY_PATH=./keys/jwt-private.key`);
console.log(`   JWT_PUBLIC_KEY_PATH=./keys/jwt-public.key`);
console.log(`   JWT_ALGORITHM=RS256\n`);
console.log('3. For production, use environment variables or a secure key management service');
console.log('4. The keys directory has been added to .gitignore automatically\n');

// Generate sample .env content
const envSample = `
# JWT Configuration (RS256)
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.key
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.key
JWT_ALGORITHM=RS256
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
`;

const envSamplePath = path.join(__dirname, '..', '.env.jwt-sample');
fs.writeFileSync(envSamplePath, envSample.trim());
console.log(`📄 Sample .env configuration saved to: ${envSamplePath}\n`);
