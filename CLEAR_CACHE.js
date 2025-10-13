/**
 * Clear Redis Cache for Club Listings
 * Run this after manually changing club data in MongoDB
 */

const Redis = require('ioredis');

const REDIS_URL = 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

async function clearCache() {
  try {
    console.log('🔄 Connecting to Redis...');
    console.log(`   URL: ${REDIS_URL}\n`);

    // Clear club list cache
    console.log('🔍 Finding cached club lists...');
    const keys = await redis.keys('clubs:list:*');
    
    if (keys.length === 0) {
      console.log('   No cached club lists found\n');
    } else {
      console.log(`   Found ${keys.length} cached entries:`);
      keys.forEach((key, i) => {
        console.log(`   ${i + 1}. ${key}`);
      });
      
      console.log('\n🗑️  Deleting cached entries...');
      await redis.del(...keys);
      console.log(`✅ Deleted ${keys.length} cache entries\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Cache cleared successfully!');
    console.log('   Refresh your frontend to see updated clubs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await redis.quit();
    console.log('🔒 Redis connection closed');
    process.exit(0);
  }
}

clearCache();
