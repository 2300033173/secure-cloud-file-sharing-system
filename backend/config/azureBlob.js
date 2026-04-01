const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require('@azure/storage-blob');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from((process.env.FILE_ENCRYPTION_KEY || 'a'.repeat(64)), 'hex');

class AzureBlobService {
  constructor() {
    this.client = null;
    this.containerName = process.env.AZURE_BLOB_CONTAINER || 'secure-files';
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT;
    this.accountKey = process.env.AZURE_STORAGE_KEY;
  }

  initialize() {
    try {
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connStr) {
        console.warn('[BlobStorage] Connection string not set — using local fallback');
        return;
      }
      this.client = BlobServiceClient.fromConnectionString(connStr);
      console.log('[BlobStorage] Azure Blob Storage initialized');
    } catch (err) {
      console.error('[BlobStorage] Init failed:', err.message);
    }
  }

  isReady() {
    return !!this.client;
  }

  // Encrypt buffer with AES-256-CBC
  encrypt(buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { iv: iv.toString('hex'), data: encrypted };
  }

  // Decrypt buffer
  decrypt(encryptedBuffer, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }

  async uploadFile(fileBuffer, blobName, mimetype) {
    if (!this.isReady()) throw new Error('Azure Blob Storage not configured');

    const { iv, data: encryptedData } = this.encrypt(fileBuffer);
    const containerClient = this.client.getContainerClient(this.containerName);
    await containerClient.createIfNotExists({ access: 'private' });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(encryptedData, encryptedData.length, {
      blobHTTPHeaders: { blobContentType: mimetype },
      metadata: { iv, encrypted: 'true' }
    });

    return { blobName, iv };
  }

  async downloadFile(blobName) {
    if (!this.isReady()) throw new Error('Azure Blob Storage not configured');

    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const props = await blockBlobClient.getProperties();
    const iv = props.metadata?.iv;

    const downloadResponse = await blockBlobClient.download(0);
    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    const encryptedBuffer = Buffer.concat(chunks);

    return iv ? this.decrypt(encryptedBuffer, iv) : encryptedBuffer;
  }

  async deleteFile(blobName) {
    if (!this.isReady()) throw new Error('Azure Blob Storage not configured');
    const containerClient = this.client.getContainerClient(this.containerName);
    await containerClient.getBlockBlobClient(blobName).deleteIfExists();
  }

  // Generate time-limited SAS URL (read-only)
  generateSASUrl(blobName, expiryMinutes = 15) {
    if (!this.accountName || !this.accountKey) return null;

    const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
    const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters({
      containerName: this.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn
    }, sharedKeyCredential).toString();

    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
  }
}

module.exports = new AzureBlobService();
