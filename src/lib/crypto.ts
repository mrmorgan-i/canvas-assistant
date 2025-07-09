import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Validate encryption secret exists and has minimum length
const secret = process.env.ENCRYPTION_SECRET;

if (!secret) {
  throw new Error('ENCRYPTION_SECRET environment variable is required for API key encryption');
}

if (secret.length < 32) {
  throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
}

/**
 * Derive encryption key from secret using PBKDF2
 */
const getKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512');
};

/**
 * Encrypt sensitive data (like OpenAI API keys)
 * Returns hex-encoded string containing salt, IV, auth tag, and encrypted data
 */
export function encrypt(text: string): string {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to encrypt must be a non-empty string');
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = getKey(salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'), 
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine all components: salt + iv + tag + encrypted data
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with encrypt() function
 * Takes hex-encoded string and returns original plaintext
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Encrypted text must be a non-empty string');
    }

    const data = Buffer.from(encryptedText, 'hex');
    
    // Validate minimum length
    const minLength = SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
    if (data.length < minLength) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Extract components
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key may be wrong');
  }
}

/**
 * Check if a string appears to be encrypted (hex format with correct length)
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Check if it's hex and has minimum length
  const minHexLength = (SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2; // * 2 for hex encoding
  return /^[0-9a-f]+$/i.test(text) && text.length >= minHexLength;
} 