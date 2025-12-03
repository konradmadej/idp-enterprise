import { createBackendModule } from '@backstage/backend-plugin-api';
import { 
  microsoftGraphOrgEntityProviderTransformExtensionPoint,
} from '@backstage/plugin-catalog-backend-module-msgraph';
import { customUserTransformer } from './msgraph-transformers';

/**
 * Custom Microsoft Graph module that includes our employee ID transformer
 */
export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'msgraph-transformer',
  register(env) {
    env.registerInit({
      deps: {
        microsoftGraphTransformers: microsoftGraphOrgEntityProviderTransformExtensionPoint,
      },
      async init({ microsoftGraphTransformers }) {
        console.log('Registering custom Microsoft Graph user transformer for employee ID');
        microsoftGraphTransformers.setUserTransformer(customUserTransformer);
      },
    });
  },
});
