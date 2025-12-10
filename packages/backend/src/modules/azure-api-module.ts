import { 
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './azure-api-router';

/**
 * Azure API backend plugin
 * 
 * This plugin provides an API endpoint for creating Azure resources
 * through an internal Azure-authenticated API.
 */
export const azureApiPlugin = createBackendPlugin({
  pluginId: 'azure-api',
  register(env) {
    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ http, logger, config }) {
        logger.info('Initializing Azure API plugin');
        
        const router = await createRouter({
          logger,
          config,
        });

        http.use(router);
        logger.info('Azure API plugin initialized and router mounted');
      },
    });
  },
});

export default azureApiPlugin;
