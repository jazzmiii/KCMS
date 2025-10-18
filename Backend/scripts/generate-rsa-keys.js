/**
 * Generate RSA Key Pair for JWT RS256
 * Workplan Line 622: JWT signing (RS256)
 * 
 * This script generates RSA public/private key pair for JWT signing
 * RS256 is more secure than HS256 for distributed systems
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair (2048-bit recommended, 4096-bit for higher security)
const KEY_SIZE = 2048; // Can be changed to 4096 for higher security

console.log('🔐 Generating RSA Key Pair for JWT RS256...\n');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: KEY_SIZE,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Define output paths
const keysDir = path.join(__dirname, '..', 'keys');
const privateKeyPath = path.join(keysDir, 'jwt-private.pem');
const publicKeyPath = path.join(keysDir, 'jwt-public.pem');

// Create keys directory if it doesn't exist
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
  console.log('✅ Created keys directory');
}

// Write keys to files
fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 }); // Read/write for owner only
fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 }); // Read for everyone

console.log('✅ RSA Key Pair Generated Successfully!\n');
console.log('📝 Key Details:');
console.log(`   Key Size: ${KEY_SIZE} bits`);
console.log(`   Private Key: ${privateKeyPath}`);
console.log(`   Public Key: ${publicKeyPath}\n`);

console.log('🔒 Security Notes:');
console.log('   - Private key permissions: 600 (owner read/write only)');
console.log('   - Public key permissions: 644 (readable by all)');
console.log('   - NEVER commit private key to version control');
console.log('   - Add keys/ directory to .gitignore\n');

console.log('⚙️  Configuration:');
console.log('   Add to your .env file:');
console.log('   JWT_ALGORITHM=RS256');
console.log('   JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem');
console.log('   JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem\n');

console.log('🔄 Migration Steps:');
console.log('   1. Generate keys (this script) ✅');
console.log('   2. Update .env with key paths');
console.log('   3. Restart server with RS256 support');
console.log('   4. Old HS256 tokens will still work during migration');
console.log('   5. After all clients refresh tokens, disable HS256\n');

// Create .gitignore for keys directory
const gitignorePath = path.join(keysDir, '.gitignore');
fs.writeFileSync(gitignorePath, '# Ignore all key files\n*.pem\n*.key\n!.gitignore\n');
console.log('✅ Created .gitignore in keys directory\n');

// Create README for keys directory
const readmePath = path.join(keysDir, 'README.md');
const readme = `# JWT RSA Keys

## Security Notice

⚠️ **CRITICAL:** Never commit private keys to version control!

## Files

- \`jwt-private.pem\`: Private key for signing JWTs (RS256)
- \`jwt-public.pem\`: Public key for verifying JWTs (RS256)

## Key Rotation

To rotate keys:

1. Generate new key pair: \`npm run generate:rsa-keys\`
2. Keep old keys temporarily for backward compatibility
3. Update environment variables to use new keys
4. After migration period, remove old keys

## Permissions

- Private key: \`chmod 600 jwt-private.pem\` (owner read/write only)
- Public key: \`chmod 644 jwt-public.pem\` (readable by all)

## Generated

Keys generated on: ${new Date().toISOString()}
Key size: ${KEY_SIZE} bits
`;
fs.writeFileSync(readmePath, readme);
console.log('✅ Created README.md in keys directory\n');

console.log('🎉 Setup complete! You can now use RS256 for JWT signing.\n');
