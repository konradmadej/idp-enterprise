import { Config } from '@backstage/config';
import { ClientSecretCredential } from '@azure/identity';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  AzureApiConfig,
  CreateKeyVaultRequest,
  CreateKeyVaultResponse,
} from './azure-api-types';

export class AzureApiClient {
  private readonly config: AzureApiConfig;
  private readonly logger: LoggerService;
  private credential: ClientSecretCredential;

  constructor(config: Config, logger: LoggerService) {
    this.logger = logger;
    
    // Read configuration
    const azureApiConfig = config.getOptionalConfig('azureApi');
    if (!azureApiConfig) {
      const errorMsg = 'Azure API configuration not found in app-config.yaml. Please add the azureApi section with apiUrl, clientId, clientSecret, and tenantId.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate all required fields
    const missingFields: string[] = [];
    const apiUrl = azureApiConfig.getOptionalString('apiUrl');
    const clientId = azureApiConfig.getOptionalString('clientId');
    const clientSecret = azureApiConfig.getOptionalString('clientSecret');
    const tenantId = azureApiConfig.getOptionalString('tenantId');

    if (!apiUrl) missingFields.push('apiUrl');
    if (!clientId) missingFields.push('clientId');
    if (!clientSecret) missingFields.push('clientSecret');
    if (!tenantId) missingFields.push('tenantId');

    if (missingFields.length > 0) {
      const errorMsg = `Azure API configuration is incomplete. Missing fields: ${missingFields.join(', ')}. Please check your app-config.yaml and environment variables.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.config = {
      apiUrl: apiUrl!,
      clientId: clientId!,
      clientSecret: clientSecret!,
      tenantId: tenantId!,
    };

    // Initialize Azure credential
    this.credential = new ClientSecretCredential(
      this.config.tenantId,
      this.config.clientId,
      this.config.clientSecret
    );

    this.logger.info('Azure API client initialized successfully', {
      apiUrl: this.config.apiUrl,
      tenantId: this.config.tenantId,
      clientId: this.config.clientId.substring(0, 8) + '...',
    });
  }

  /**
   * Get an access token for the Azure API
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Request token with appropriate scope for your API
      // Adjust the scope based on your API's requirements
      const tokenResponse = await this.credential.getToken([
        `${this.config.apiUrl}/.default`,
      ]);
      
      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('Failed to acquire access token');
      }

      return tokenResponse.token;
    } catch (error) {
      this.logger.error('Failed to get access token', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a Key Vault for the specified system
   */
  async createKeyVault(request: CreateKeyVaultRequest): Promise<CreateKeyVaultResponse> {
    try {
      this.logger.info('Creating Key Vault', { systemName: request.systemName });

      const token = await this.getAccessToken();
      const url = `${this.config.apiUrl}/create-keyvault`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ systemName: request.systemName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Failed to create Key Vault', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.info('Key Vault created successfully', { result });

      return result as CreateKeyVaultResponse;
    } catch (error) {
      this.logger.error('Error creating Key Vault', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
