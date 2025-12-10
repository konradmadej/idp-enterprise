/**
 * Type definitions for Azure API module
 */

export interface AzureApiConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export interface CreateKeyVaultRequest {
  systemName: string;
}

export interface CreateKeyVaultResponse {
  success: boolean;
  keyVaultName?: string;
  message?: string;
}

export interface AzureApiError {
  success: false;
  message: string;
  statusCode?: number;
}
