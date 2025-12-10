import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ClientSecretCredential } from '@azure/identity';
import { Config } from '@backstage/config';

/**
 * Custom scaffolder action to create Azure Key Vault via internal API
 * This action handles Azure authentication and makes the API call directly
 */
export const createAzureKeyVaultAction = (config: Config) => {
  return createTemplateAction({
    id: 'codeblue:keyvault:create',
    description: 'Create an Azure Key Vault for a system using the internal Azure API',
    schema: {
      input: {
        type: 'object',
        required: ['systemName', 'environment', 'region'],
        properties: {
          systemName: {
            type: 'string',
            title: 'System Name',
            description: 'The name of the system that needs a Key Vault',
          },
          environment: {
            type: 'string',
            title: 'Environment',
            description: 'The environment for the Key Vault (e.g., dev, staging, production)',
          },
          region: {
            type: 'string',
            title: 'Azure Region',
            description: 'The Azure region where the Key Vault will be created',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            title: 'Success Status',
          },
          keyVaultName: {
            type: 'string',
            title: 'Key Vault Name',
          },
          message: {
            type: 'string',
            title: 'Response Message',
          },
        },
      },
    },
    async handler(ctx) {
      const { systemName, environment, region } = ctx.input;
      
      ctx.logger.info(`Creating Key Vault for system: ${systemName} in ${region} (${environment})`);

      try {
        // Read Azure API configuration
        const azureApiConfig = config.getOptionalConfig('codeblue');
        if (!azureApiConfig) {
          throw new Error(
            'CodeBlue configuration not found in app-config.yaml. ' +
            'Please add the codeblue section with apiUrl, clientId, clientSecret, and tenantId.'
          );
        }

        const apiUrl = azureApiConfig.getString('apiUrl');
        const clientId = azureApiConfig.getString('clientId');
        const clientSecret = azureApiConfig.getString('clientSecret');
        const tenantId = azureApiConfig.getString('tenantId');

        ctx.logger.info(`Using Azure API at ${apiUrl}`);

        // Initialize Azure credential
        const credential = new ClientSecretCredential(
          tenantId,
          clientId,
          clientSecret
        );

        // Get access token
        ctx.logger.info('Acquiring access token from Azure AD');
        const tokenResponse = await credential.getToken([
          `${apiUrl}/.default`,
        ]);

        if (!tokenResponse || !tokenResponse.token) {
          throw new Error('Failed to acquire access token from Azure AD');
        }

        ctx.logger.info('Access token acquired successfully');

        // Make API call
        const url = `${apiUrl}/create-keyvault`;
        ctx.logger.info(`Calling API endpoint: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenResponse.token}`,
          },
          body: JSON.stringify({ 
            systemName,
            environment,
            region,
          }),
        });

        const responseBody = await response.json() as {
          success: boolean;
          keyVaultName?: string;
          message?: string;
        };

        ctx.logger.info(`API response status: ${response.status}`);

        if (!response.ok) {
          ctx.logger.error(
            `API request failed with status ${response.status}`,
            responseBody
          );
          throw new Error(
            responseBody.message || `API request failed with status ${response.status}`
          );
        }

        // Set outputs
        ctx.output('success', responseBody.success);
        ctx.output('keyVaultName', responseBody.keyVaultName);
        ctx.output('message', responseBody.message);

        ctx.logger.info(
          `Key Vault created successfully: ${responseBody.keyVaultName}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.logger.error(`Failed to create Key Vault: ${errorMessage}`);
        throw error;
      }
    },
  });
};
