import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createAzureKeyVaultAction } from './azure-api-actions';

/**
 * Module that registers CodeBlue Key Vault scaffolder action
 */
export const codeblueActionsModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'codeblue-keyvault-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        scaffolder.addActions(createAzureKeyVaultAction(config));
      },
    });
  },
});

export default codeblueActionsModule;
