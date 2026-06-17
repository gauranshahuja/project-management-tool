const crypto = require('crypto');

// AES-256-GCM at-rest encryption for chat messages.
// Key derived from MESSAGE_SECRET (or JWT_SECRET fallback) via SHA-256 -> 32 bytes.
const getKey = () => {
  const secret =
    process.env.MESSAGE_SECRET || process.env.JWT_SECRET || 'dev-fallback-secret';
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
};

const encryptMessage = (plaintext) => {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipher: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
};

const decryptMessage = ({ cipher, iv, tag }) => {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getKey(),
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipher, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '[unable to decrypt]';
  }
};

module.exports = { encryptMessage, decryptMessage };
