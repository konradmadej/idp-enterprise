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
        const apiScope = azureApiConfig.getString('apiScope');
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
        ctx.logger.info(`Acquiring access token from Azure AD for scope: ${apiScope}`);
        const tokenResponse = await credential.getToken([
          apiScope,
        ]);

        if (!tokenResponse || !tokenResponse.token) {
          throw new Error('Failed to acquire access token from Azure AD');
        }

        ctx.logger.info('Access token acquired successfully');

        // Decode token for debugging (only in non-production)
        try {
          const tokenParts = tokenResponse.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            ctx.logger.debug('Token claims:', {
              aud: payload.aud,
              roles: payload.roles,
              scp: payload.scp,
              appid: payload.appid,
            });
          }
        } catch (e) {
          ctx.logger.debug('Could not decode token for debugging');
        }

        // Make API call
        const url = `${apiUrl}/create-keyvault`;
        const requestBody = { 
          systemName,
          environment,
          region,
        };
        
        ctx.logger.info(`Calling API endpoint: ${url}`);
        ctx.logger.debug('Request body:', requestBody);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenResponse.token}`,
          },
          body: JSON.stringify(requestBody),
        });

        ctx.logger.info(`API response status: ${response.status} ${response.statusText}`);

        let responseBody: {
          success: boolean;
          keyVaultName?: string;
          message?: string;
        };

        try {
          responseBody = await response.json();
        } catch (e) {
          const responseText = await response.text();
          ctx.logger.error(`Failed to parse response as JSON. Status: ${response.status}, Body: ${responseText}`);
          throw new Error(`API request failed with status ${response.status}: ${responseText}`);
        }

        if (!response.ok) {
          ctx.logger.error(
            `API request failed with status ${response.status}`,
            {
              status: response.status,
              statusText: response.statusText,
              body: responseBody,
              headers: Object.fromEntries(response.headers.entries()),
            }
          );
          throw new Error(
            responseBody.message || `API request failed with status ${response.status}: ${JSON.stringify(responseBody)}`
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

/**
 * Custom scaffolder action to check Azure Key Vault provisioning status
 * This action polls the status endpoint with configurable retries
 */
export const checkAzureKeyVaultStatusAction = (config: Config) => {
  return createTemplateAction({
    id: 'codeblue:keyvault:check-status',
    description: 'Check the provisioning status of an Azure Key Vault with retry logic',
    schema: {
      input: {
        type: 'object',
        required: ['keyVaultName'],
        properties: {
          keyVaultName: {
            type: 'string',
            title: 'Key Vault Name',
            description: 'The name of the Key Vault to check status for',
          },
          maxAttempts: {
            type: 'number',
            title: 'Max Attempts',
            description: 'Maximum number of status check attempts',
            default: 10,
          },
          intervalSeconds: {
            type: 'number',
            title: 'Interval (seconds)',
            description: 'Time to wait between status checks in seconds',
            default: 30,
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          provisioned: {
            type: 'boolean',
            title: 'Provisioned Status',
          },
          status: {
            type: 'string',
            title: 'Current Status',
          },
          message: {
            type: 'string',
            title: 'Status Message',
          },
        },
      },
    },
    async handler(ctx) {
      const keyVaultName = ctx.input.keyVaultName as string;
      const maxAttempts = (ctx.input.maxAttempts as number | undefined) ?? 10;
      const intervalSeconds = (ctx.input.intervalSeconds as number | undefined) ?? 30;
      
      ctx.logger.info(
        `Checking status for Key Vault: ${keyVaultName} ` +
        `(max ${maxAttempts} attempts, ${intervalSeconds}s interval)`
      );

      try {
        // Read CodeBlue API configuration
        const codeblueConfig = config.getOptionalConfig('codeblue');
        if (!codeblueConfig) {
          throw new Error(
            'CodeBlue configuration not found in app-config.yaml. ' +
            'Please add the codeblue section with apiUrl, clientId, clientSecret, and tenantId.'
          );
        }

        const apiUrl = codeblueConfig.getString('apiUrl');
        const apiScope = codeblueConfig.getString('apiScope');
        const clientId = codeblueConfig.getString('clientId');
        const clientSecret = codeblueConfig.getString('clientSecret');
        const tenantId = codeblueConfig.getString('tenantId');

        // Initialize Azure credential
        const credential = new ClientSecretCredential(
          tenantId,
          clientId,
          clientSecret
        );

        // Get access token
        ctx.logger.info(`Acquiring access token from Azure AD for scope: ${apiScope}`);
        const tokenResponse = await credential.getToken([
          apiScope,
        ]);

        if (!tokenResponse || !tokenResponse.token) {
          throw new Error('Failed to acquire access token from Azure AD');
        }

        // Poll status endpoint
        let attempt = 0;
        let provisioned = false;
        let lastStatus = 'unknown';

        while (attempt < maxAttempts) {
          attempt++;
          ctx.logger.info(
            `Status check attempt ${attempt}/${maxAttempts} for ${keyVaultName}`
          );

          const url = `${apiUrl}/check-keyvault-status`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenResponse.token}`,
            },
            body: JSON.stringify({ keyVaultName }),
          });

          const responseBody = await response.json() as {
            provisioned: boolean;
            status: string;
            message?: string;
          };

          ctx.logger.info(
            `Status response: provisioned=${responseBody.provisioned}, ` +
            `status=${responseBody.status}`
          );

          lastStatus = responseBody.status;

          if (responseBody.provisioned) {
            provisioned = true;
            ctx.logger.info(`Key Vault ${keyVaultName} is provisioned!`);
            break;
          }

          // Wait before next attempt (unless it's the last one)
          if (attempt < maxAttempts) {
            ctx.logger.info(`Waiting ${intervalSeconds} seconds before next check...`);
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
          }
        }

        // Set outputs
        ctx.output('provisioned', provisioned);
        ctx.output('status', lastStatus);
        ctx.output('message', 
          provisioned 
            ? `Key Vault ${keyVaultName} provisioned successfully`
            : `Key Vault ${keyVaultName} not provisioned after ${maxAttempts} attempts`
        );

        if (!provisioned) {
          ctx.logger.warn(
            `Key Vault ${keyVaultName} was not provisioned within ` +
            `${maxAttempts * intervalSeconds} seconds. Last status: ${lastStatus}`
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.logger.error(`Failed to check Key Vault status: ${errorMessage}`);
        throw error;
      }
    },
  });
};
