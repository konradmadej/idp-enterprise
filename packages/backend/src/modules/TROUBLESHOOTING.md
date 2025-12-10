# Azure API Plugin - Quick Start & Troubleshooting

## Quick Verification Steps

### 1. Check if the plugin loads

When you start the backend, you should see these log messages:

```
[azure-api] info: Initializing Azure API plugin
[azure-api] info: Creating Azure API router
[azure-api] info: Azure API client initialized successfully
[azure-api] info: Azure API router created, registering endpoints
[azure-api] info: Azure API plugin initialized and router mounted
```

### 2. Test the health endpoint

```bash
curl http://localhost:7007/api/azure-api/health
```

Expected response:
```json
{"status":"ok"}
```

### 3. Check configuration

Verify your environment variables are set:

```bash
echo $AZURE_INTERNAL_API_URL
echo $AZURE_API_CLIENT_ID
echo $AZURE_API_TENANT_ID
# Don't echo the secret!
```

## Common Issues

### Plugin doesn't load / No logs visible

**Problem**: The plugin is registered but doesn't initialize.

**Solutions**:
1. **Check the backend is running**: Make sure `yarn start` or `yarn dev` is running
2. **Check for errors**: Look for error messages in the terminal
3. **Verify the import**: Ensure `packages/backend/src/index.ts` has:
   ```typescript
   backend.add(import('./modules/azure-api-module'));
   ```
4. **Rebuild**: Try stopping and restarting the backend

### Configuration not found error

**Problem**: Error message: "Azure API configuration not found in app-config.yaml"

**Solutions**:
1. **Add configuration to app-config.yaml**:
   ```yaml
   azureApi:
     apiUrl: ${AZURE_INTERNAL_API_URL}
     clientId: ${AZURE_API_CLIENT_ID}
     clientSecret: ${AZURE_API_CLIENT_SECRET}
     tenantId: ${AZURE_API_TENANT_ID}
   ```

2. **Set environment variables**: Create a `.env` file in the root:
   ```bash
   AZURE_INTERNAL_API_URL=https://api.internal.company.com
   AZURE_API_CLIENT_ID=your-client-id
   AZURE_API_CLIENT_SECRET=your-client-secret
   AZURE_API_TENANT_ID=your-tenant-id
   ```

3. **For development**: You can temporarily hardcode values in app-config.yaml:
   ```yaml
   azureApi:
     apiUrl: 'https://api.internal.company.com'
     clientId: 'your-client-id'
     clientSecret: 'your-client-secret'
     tenantId: 'your-tenant-id'
   ```

### Health endpoint returns 404

**Problem**: `curl http://localhost:7007/api/azure-api/health` returns 404

**Possible causes**:
1. **Plugin not loaded**: Check the logs for initialization messages
2. **Wrong URL**: Ensure you're using the correct backend URL (default: `http://localhost:7007`)
3. **Router not mounted**: Look for "Azure API plugin initialized and router mounted" in logs

### Authentication errors

**Problem**: API calls fail with 401 or token acquisition errors

**Solutions**:
1. **Verify Service Principal permissions**: Ensure the Service Principal has access to the API
2. **Check credentials**: Verify client ID, secret, and tenant ID are correct
3. **Scope issues**: You may need to adjust the token scope in `azure-api-client.ts`:
   ```typescript
   const tokenResponse = await this.credential.getToken([
     `api://your-specific-api-id/.default`,
   ]);
   ```

## Testing Configuration

### Minimal test without Azure credentials

To test if the plugin loads without Azure credentials:

1. **Comment out Azure client initialization** temporarily in `azure-api-router.ts`:
   ```typescript
   export async function createRouter(
     options: RouterOptions,
   ): Promise<express.Router> {
     const { logger, config } = options;
     logger.info('Creating Azure API router');
     
     // Temporarily comment out to test routing
     // const azureClient = new AzureApiClient(config, logger);
     
     const router = Router();
     router.use(express.json());
   ```

2. **Restart the backend** and check if you see the initialization logs

3. **Test health endpoint**: This should work even without Azure config

### Full integration test

Once configuration is working:

```bash
# Test create-keyvault endpoint
curl -X POST http://localhost:7007/api/azure-api/create-keyvault \
  -H "Content-Type: application/json" \
  -d '{"systemName": "test-system"}'
```

## Debugging Tips

### Enable debug logging

Add this to your `app-config.yaml`:

```yaml
backend:
  # ... other config
  logger:
    level: debug
```

### Check plugin registration

In `packages/backend/src/index.ts`, verify:
```typescript
// Azure API module for internal resource management
backend.add(import('./modules/azure-api-module'));
```

### Verify dependencies are installed

```bash
cd packages/backend
yarn list @azure/identity express express-promise-router
```

### Check for TypeScript errors

```bash
cd packages/backend
yarn tsc --noEmit
```

## Step-by-Step Verification

Run through these steps in order:

1. ✅ **Dependencies installed**: `yarn install` completed successfully
2. ✅ **No TypeScript errors**: `yarn tsc --noEmit` shows no errors
3. ✅ **Plugin registered**: Check `index.ts` for the import
4. ✅ **Configuration present**: `azureApi` section in `app-config.yaml`
5. ✅ **Environment variables set**: All four Azure variables defined
6. ✅ **Backend running**: `yarn workspace backend start` or `yarn dev`
7. ✅ **Logs visible**: See "Initializing Azure API plugin" in output
8. ✅ **Health endpoint works**: `curl http://localhost:7007/api/azure-api/health`
9. ✅ **API endpoint works**: Test create-keyvault with valid systemName

If any step fails, that's where the issue is!

## Need Help?

If you're still having issues:

1. Check the full backend logs for error messages
2. Verify the module file exports correctly: `export default azureApiPlugin;`
3. Ensure no conflicting plugins are using the same routes
4. Try accessing from the Backstage frontend instead of curl
