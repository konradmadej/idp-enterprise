# Backend Modules

This directory contains custom backend modules and scaffolder actions for the Backstage application.

## Azure Key Vault Scaffolder Action

A custom scaffolder action that creates Azure Key Vaults through an internal Azure API using Azure Service Principal authentication.

### Features

- **Direct Integration**: Action calls Azure API directly from templates - no proxy needed
- **Azure Authentication**: Handles Azure AD authentication automatically using Service Principal
- **Simple to Use**: Just provide a system name in your template
- **Error Handling**: Comprehensive error handling and logging

## Configuration

Add the following configuration to your `app-config.yaml` (or `app-config.production.yaml` for production):

```yaml
azureApi:
  apiUrl: ${AZURE_INTERNAL_API_URL}
  clientId: ${AZURE_API_CLIENT_ID}
  clientSecret: ${AZURE_API_CLIENT_SECRET}
  tenantId: ${AZURE_API_TENANT_ID}
```

### Environment Variables

Set the following environment variables:

- `AZURE_INTERNAL_API_URL` - The base URL of your internal Azure API (e.g., `https://api.internal.company.com`)
- `AZURE_API_CLIENT_ID` - Azure Service Principal Client ID
- `AZURE_API_CLIENT_SECRET` - Azure Service Principal Client Secret
- `AZURE_API_TENANT_ID` - Azure Tenant ID

Example `.env` file:
```bash
AZURE_INTERNAL_API_URL=https://api.internal.company.com
AZURE_API_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_API_CLIENT_SECRET=your-client-secret-here
AZURE_API_TENANT_ID=87654321-4321-4321-4321-cba987654321
```

## Using in Templates

Add the action to your Backstage template:

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: azure:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}
```

### Action Outputs

| Output | Type | Description |
|--------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `keyVaultName` | string | Name of the created Key Vault |
| `message` | string | Success or error message |

### Access Outputs

```yaml
output:
  text:
    - title: Result
      content: |
        Key Vault: ${{ steps['create-keyvault'].output.keyVaultName }}
        Status: ${{ steps['create-keyvault'].output.success }}
```

## Files

- **azure-api-actions.ts** - Defines the `azure:keyvault:create` scaffolder action
- **azure-api-actions-module.ts** - Registers the action with the scaffolder plugin
- **msgraph-module.ts** - Custom Microsoft Graph module for user transformations
- **msgraph-transformers.ts** - Transformers for employee ID from Microsoft Graph

## How It Works

### Architecture

1. **Template Execution** - User runs a template that includes the `azure:keyvault:create` action
2. **Action Handler** - Action reads configuration from `app-config.yaml`
3. **Authentication** - Creates Azure Service Principal credential and acquires access token
4. **API Call** - Makes authenticated POST request to internal Azure API
5. **Response** - Returns success status, Key Vault name, and message to template

### Authentication Flow

1. Action initializes with Service Principal credentials from config
2. Requests access token from Azure AD using client credentials flow
3. Token is included as Bearer token in Authorization header
4. Internal API validates the token and creates the Key Vault

## Development

### Testing the Action

1. Create a test template in `examples/templates/`
2. Add the action to a step
3. Run the template from Backstage UI at `/create`
4. Check backend logs for action execution

### Local Development

1. Set environment variables in `.env`:
   ```bash
   AZURE_INTERNAL_API_URL=https://your-api.com
   AZURE_API_CLIENT_ID=your-client-id
   AZURE_API_CLIENT_SECRET=your-secret
   AZURE_API_TENANT_ID=your-tenant-id
   ```

2. Start the backend:
   ```bash
   yarn workspace backend start
   ```

3. The action will be available as `azure:keyvault:create`

## Security Considerations

- **Secrets Management**: Never commit secrets - use environment variables
- **Token Caching**: Azure Identity library handles token caching and refresh
- **Scope**: Token scope is `${apiUrl}/.default` - adjust if needed in `azure-api-actions.ts`
- **HTTPS**: Always use HTTPS in production for the API URL
- **Network Security**: Ensure internal API is only accessible from trusted networks
- **Credentials**: Service Principal credentials are read at action execution time

## Troubleshooting

### Action Not Registered

**Error**: `Template action with ID azure:keyvault:create is not registered`

**Solution**: 
- Verify `azure-api-actions-module` is imported in `packages/backend/src/index.ts`
- Restart the backend
- Check logs for module initialization errors

### Configuration Missing

**Error**: `Azure API configuration not found`

**Solution**:
- Add `azureApi` section to `app-config.yaml`
- Set all four required environment variables
- Restart the backend

### Authentication Failures

**Error**: `Failed to acquire access token`

**Solution**:
- Verify Service Principal credentials are correct
- Check Service Principal has required API permissions
- Ensure tenant ID matches the Service Principal's tenant

### API Call Failures

**Error**: `API request failed with status XXX`

**Solution**:
- Check backend logs for detailed error
- Verify internal API is accessible
- Ensure API accepts POST to `/create-keyvault` with `systemName` in body
- Check token scope matches API requirements

## Adding More Actions

To add more Azure API actions:

1. Add a new action function in `azure-api-actions.ts`:
   ```typescript
   export const createAzureStorageAction = (config: Config) => {
     return createTemplateAction({
       id: 'azure:storage:create',
       schema: { /* ... */ },
       async handler(ctx) {
         // Implementation
       },
     });
   };
   ```

2. Register it in `azure-api-actions-module.ts`:
   ```typescript
   scaffolder.addActions(
     createAzureKeyVaultAction(config),
     createAzureStorageAction(config)
   );
   ```

3. Use it in templates:
   ```yaml
   - action: azure:storage:create
     input:
       storageAccountName: ${{ parameters.name }}
   ```
