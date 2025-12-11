import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { ClientSecretCredential } from '@azure/identity';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

/**
 * Module that registers a scheduled task to sync Key Vault provisioning status
 * from CodeBlue API to catalog entities
 */
export const codeblueStatusSyncModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'codeblue-status-sync',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        catalog: catalogServiceRef,
      },
      async init({ logger, config, scheduler, catalog }) {
        logger.info('Initializing CodeBlue status sync scheduled task');

        // Read configuration
        const codeblueConfig = config.getOptionalConfig('codeblue');
        if (!codeblueConfig) {
          logger.warn(
            'CodeBlue configuration not found. Status sync task will not run.'
          );
          return;
        }

        const apiUrl = codeblueConfig.getString('apiUrl');
        const apiScope = codeblueConfig.getString('apiScope');
        const clientId = codeblueConfig.getString('clientId');
        const clientSecret = codeblueConfig.getString('clientSecret');
        const tenantId = codeblueConfig.getString('tenantId');

        // Get schedule configuration (default: every 5 minutes)
        const scheduleConfig = codeblueConfig.getOptionalConfig('statusSync');
        const frequency = scheduleConfig?.getOptionalString('frequency') || '*/5 * * * *';
        const timeout = scheduleConfig?.getOptionalNumber('timeout') || 300000; // 5 minutes

        logger.info(
          `Scheduling CodeBlue status sync task with frequency: ${frequency}`
        );

        // Schedule the task
        await scheduler.scheduleTask({
          id: 'codeblue-status-sync',
          frequency: { cron: frequency },
          timeout: { milliseconds: timeout },
          fn: async () => {
            logger.info('Starting CodeBlue status sync task');

            try {
              // Initialize Azure credential
              const credential = new ClientSecretCredential(
                tenantId,
                clientId,
                clientSecret
              );

              // Get access token
              const tokenResponse = await credential.getToken([
                apiScope,
              ]);

              if (!tokenResponse || !tokenResponse.token) {
                logger.error('Failed to acquire access token for status sync');
                return;
              }

              // Query catalog for all keyvault components that are not provisioned
              const entities = await catalog.getEntities({
                filter: {
                  kind: 'Component',
                  'spec.type': 'keyvault',
                },
              });

              logger.info(
                `Found ${entities.items.length} keyvault components in catalog`
              );

              // Check each component's provisioning status
              let checkedCount = 0;
              let updatedCount = 0;

              for (const entity of entities.items) {
                // Skip if already marked as provisioned
                const currentStatus = entity.metadata.annotations?.['codeblue.com/provisioning-status'];
                if (currentStatus === 'provisioned') {
                  continue;
                }

                const vaultName = entity.metadata.annotations?.['azure.com/vault-name'];
                if (!vaultName) {
                  logger.debug(
                    `Skipping ${entity.metadata.name}: no vault-name annotation`
                  );
                  continue;
                }

                checkedCount++;
                logger.debug(`Checking status for Key Vault: ${vaultName}`);

                try {
                  // Call status check API
                  const url = `${apiUrl}/check-keyvault-status`;
                  const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${tokenResponse.token}`,
                    },
                    body: JSON.stringify({ keyVaultName: vaultName }),
                  });

                  if (!response.ok) {
                    logger.warn(
                      `Failed to check status for ${vaultName}: ${response.status}`
                    );
                    continue;
                  }

                  const statusBody = await response.json() as {
                    provisioned: boolean;
                    status: string;
                    message?: string;
                  };

                  // Update entity if provisioning status changed
                  if (statusBody.provisioned && currentStatus !== 'provisioned') {
                    logger.info(
                      `Key Vault ${vaultName} is now provisioned. Updating catalog entity.`
                    );

                    // Refresh the entity in the catalog to trigger re-processing
                    // The catalog will pick up the updated status from the external source
                    await catalog.refreshEntity(entity.metadata.uid!);
                    updatedCount++;
                    
                    logger.info(
                      `Refreshed entity ${entity.metadata.name} - provisioned status will be updated`
                    );
                  } else {
                    logger.debug(
                      `Key Vault ${vaultName} status: ${statusBody.status} ` +
                      `(provisioned: ${statusBody.provisioned})`
                    );
                  }
                } catch (error) {
                  logger.error(
                    `Error checking status for ${vaultName}: ${error}`
                  );
                }
              }

              logger.info(
                `CodeBlue status sync completed. ` +
                `Checked: ${checkedCount}, Updated: ${updatedCount}`
              );
            } catch (error) {
              logger.error(`CodeBlue status sync task failed: ${error}`);
            }
          },
        });

        logger.info('CodeBlue status sync task scheduled successfully');
      },
    });
  },
});

export default codeblueStatusSyncModule;
