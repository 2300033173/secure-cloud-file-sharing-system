const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

class AzureKeyVaultService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
  }

  initialize() {
    try {
      if (process.env.AZURE_KEY_VAULT_URL) {
        const credential = new DefaultAzureCredential();
        this.client = new SecretClient(process.env.AZURE_KEY_VAULT_URL, credential);
        this.isConfigured = true;
        console.log('Azure Key Vault initialized successfully');
      } else {
        console.warn('Azure Key Vault URL not configured, using environment variables');
      }
    } catch (error) {
      console.error('Azure Key Vault initialization failed:', error.message);
    }
  }

  async getSecret(secretName) {
    if (!this.isConfigured) {
      return process.env[secretName];
    }
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error.message);
      return process.env[secretName];
    }
  }
}

module.exports = new AzureKeyVaultService();
