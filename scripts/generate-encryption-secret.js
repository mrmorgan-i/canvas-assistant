const crypto = require('crypto');

/**
 * Generate a cryptographically secure encryption secret
 */
function generateEncryptionSecret() {
  console.log('Generating cryptographically secure encryption secret...\n');
  
  // Generate 64 bytes (512 bits) of random data and encode as base64
  const secret = crypto.randomBytes(64).toString('base64');
  
  console.log('=== ENCRYPTION SECRET GENERATED ===\n');
  
  console.log('Add this to your .env.local file:\n');
  console.log(`ENCRYPTION_SECRET="${secret}"`);
  
  console.log('\n=== SECURITY NOTES ===');
  console.log('1. This secret is used to encrypt OpenAI API keys in the database');
  console.log('2. Keep this secret secure and backed up safely');
  console.log('3. If this secret is lost, you will not be able to decrypt existing API keys');
  console.log('4. Never commit this secret to version control');
  console.log('5. Use different secrets for development, staging, and production');
  
  console.log(`\nSecret length: ${secret.length} characters`);
  console.log(`Entropy: ${crypto.randomBytes(64).length * 8} bits`);
  console.log('\nEncryption secret has been generated successfully!');
}

generateEncryptionSecret(); 