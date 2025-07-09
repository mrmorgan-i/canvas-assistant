const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate RSA key pair for LTI JWT signing
 */
function generateLTIKeys() {
  console.log('Generating RSA key pair for LTI...');
  
  // Generate RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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

  // Generate a unique key ID
  const kid = crypto.randomUUID();

  console.log('\n=== LTI JWT Keys Generated ===\n');
  
  console.log('Add these to your .env.local file:\n');
  
  console.log('# LTI JWT Keys');
  console.log(`LTI_KID="${kid}"`);
  console.log(`LTI_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
  console.log(`LTI_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`);
  
  console.log('\n=== Instructions ===');
  console.log('1. Copy the above environment variables to your .env.local file');
  console.log('2. Update your Canvas Developer Key configuration:');
  console.log('   - JWK Method: Public JWK URL');
  console.log(`   - Public JWK URL: http://localhost:3000/api/lti/jwks`);
  console.log('   - Or when deployed: https://yourdomain.com/api/lti/jwks');
  console.log('\nKeys have been generated successfully!');
  
  // Optionally save to files
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
  fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);
  fs.writeFileSync(path.join(keysDir, 'kid.txt'), kid);
  
  console.log(`\nKeys also saved to: ${keysDir}/`);
}

if (require.main === module) {
  generateLTIKeys();
}

module.exports = { generateLTIKeys }; 