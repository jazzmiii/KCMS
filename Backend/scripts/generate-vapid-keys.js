// scripts/generate-vapid-keys.js
/**
 * Generate VAPID keys for Web Push Notifications
 * Run with: npm run generate:keys
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID keys for Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('\nPublic Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('\n=======================================');

console.log('\n📝 Add these to your .env file:');
console.log('\nVAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:support@kmit.in');
console.log('\n⚠️  Keep the private key SECRET! Do not commit to Git.\n');
