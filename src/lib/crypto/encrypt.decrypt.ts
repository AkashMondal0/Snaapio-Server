import {
  generateKeyPairSync,
  publicEncrypt,
  privateDecrypt,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  constants,
} from 'crypto';

// 1. Generate RSA key pair for a user
export function generateRSAKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  return { publicKey, privateKey };
}

// 2. Encrypt data using AES + RSA
export function encryptData(plaintext: string | Buffer, receiverPublicKey: string) {
  const aesKey = randomBytes(32); // AES-256
  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-cbc', aesKey, iv);
  const encryptedData = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  const encryptedKey = publicEncrypt(receiverPublicKey, aesKey);

  return {
    encryptedData: encryptedData.toString('base64'),
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
  };
}

// 3. Decrypt using AES + RSA
export function decryptData(
  encryptedDataB64: string,
  encryptedKeyB64: string,
  ivB64: string,
  recipientPrivateKey: string,
): string {
  const encryptedData = Buffer.from(encryptedDataB64, 'base64');
  const encryptedKey = Buffer.from(encryptedKeyB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');

  const aesKey = privateDecrypt(recipientPrivateKey, encryptedKey);

  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decrypted.toString();
}

export function encryptImage(imageBuffer: Buffer, receiverPublicKey: string) {
  const aesKey = randomBytes(32);
  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-cbc', aesKey, iv);
  const encryptedImage = Buffer.concat([cipher.update(imageBuffer), cipher.final()]);
  const encryptedKey = publicEncrypt(receiverPublicKey, aesKey);

  return {
    encryptedImage: encryptedImage.toString('base64'),
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decryptImage(
  encryptedImageB64: string,
  encryptedKeyB64: string,
  ivB64: string,
  receiverPrivateKey: string,
): Buffer {
  const encryptedImage = Buffer.from(encryptedImageB64, 'base64');
  const encryptedKey = Buffer.from(encryptedKeyB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');

  const aesKey = privateDecrypt(receiverPrivateKey, encryptedKey);
  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv);

  const decryptedImage = Buffer.concat([decipher.update(encryptedImage), decipher.final()]);
  return decryptedImage;
}

// --- 🔐 UTILITIES ---

export function encryptForParticipants(
  dataBuffer: Buffer, // text or image or file
  participantPublicKeys: Record<string, string>, // { userId: publicKeyPem }
) {
  const aesKey = randomBytes(32);
  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-cbc', aesKey, iv);
  const encryptedData = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

  const encryptedKeys = Object.entries(participantPublicKeys).reduce<Record<string, string>>(
    (acc, [userId, publicKey]) => {
      const encryptedKey = publicEncrypt(
        {
          key: publicKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
        },
        aesKey,
      );
      acc[userId] = encryptedKey.toString('base64');
      return acc;
    },
    {},
  );

  return {
    encryptedData: encryptedData.toString('base64'),
    iv: iv.toString('base64'),
    encryptedKeys,
  };
}

export function decryptForUser(
  encryptedDataB64: string,
  encryptedKeyB64: string,
  ivB64: string,
  privateKeyPem: string,
): Buffer {
  const encryptedData = Buffer.from(encryptedDataB64, 'base64');
  const encryptedKey = Buffer.from(encryptedKeyB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');

  const aesKey = privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    encryptedKey,
  );

  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}