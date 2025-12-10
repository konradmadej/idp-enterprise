import { 
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { createRouter } from './azure-api-router';

/**
 * Azure API backend module
 * 
 * This module provides an API endpoint for creating Azure resources
 * through an internal Azure-authenticated API.
 */
export const azureApiModule = createBackendModule({
  pluginId: 'azureApi',
  moduleId: 'default',
  register(env) {
    env.registerInit({
      deps: {
        http: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ http, logger, config }) {
        logger.info('Initializing Azure API module');
        
        const router = await createRouter({
          logger,
          config,
        });

        http.use(router);
        logger.info('Azure API module initialized');
      },
    });
  },
});

export default azureApiModule;
