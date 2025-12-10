import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { AzureApiClient } from './azure-api-client';

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

/**
 * Create router for Azure API endpoints
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  logger.info('Creating Azure API router');

  const azureClient = new AzureApiClient(config, logger);
  const router = Router();
  router.use(express.json());

  logger.info('Azure API router created, registering endpoints');

  // Add a root endpoint to verify routing is working
  router.get('/', async (_req, res) => {
    res.json({ 
      service: 'Azure API',
      endpoints: [
        'GET /health',
        'POST /create-keyvault'
      ]
    });
  });

  /**
   * POST /api/azure-api/create-keyvault
   * 
   * Request body:
   * {
   *   "systemName": "my-system"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "keyVaultName": "my-system-kv",
   *   "message": "Key Vault created successfully"
   * }
   */
  router.post('/create-keyvault', async (req, res) => {
    logger.info('POST /create-keyvault endpoint hit');
    try {
      const { systemName } = req.body;

      if (!systemName) {
        return res.status(400).json({
          success: false,
          message: 'systemName is required in request body',
        });
      }

      logger.info('Received create-keyvault request', { systemName });

      const result = await azureClient.createKeyVault({ systemName });

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in create-keyvault endpoint', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * GET /api/azure-api/health
   * 
   * Health check endpoint
   */
  router.get('/health', async (_req, res) => {
    logger.info('GET /health endpoint hit');
    res.status(200).json({ status: 'ok' });
  });

  logger.info('All Azure API routes registered successfully');
  return router;
}
