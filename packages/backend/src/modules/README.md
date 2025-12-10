# Azure API Backend Module

This backend module provides integration with an internal Azure API for creating and managing Azure resources. It uses Azure Service Principal authentication with client credentials flow.

## Features

- **Azure Authentication**: Uses Azure Service Principal (client ID, client secret, tenant ID) for secure API access
- **Key Vault Creation**: Endpoint to create Azure Key Vaults for systems via internal API
- **Configurable**: All connection details are configurable through environment variables
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

## API Endpoints

### Create Key Vault

**Endpoint**: `POST /api/azure-api/create-keyvault`

**Request Body**:
```json
{
  "systemName": "my-system"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "keyVaultName": "my-system-kv",
  "message": "Key Vault created successfully"
}
```

**Response** (Error - 400/500):
```json
{
  "success": false,
  "message": "Error description"
}
```

### Health Check

**Endpoint**: `GET /api/azure-api/health`

**Response** (200):
```json
{
  "status": "ok"
}
```

## Usage Examples

### cURL

```bash
curl -X POST http://localhost:7007/api/azure-api/create-keyvault \
  -H "Content-Type: application/json" \
  -d '{"systemName": "my-system"}'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:7007/api/azure-api/create-keyvault', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ systemName: 'my-system' }),
});

const result = await response.json();
console.log(result);
```

### From a Backstage Template

You can use this in your Backstage templates with the `http:backstage:request` action:

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: http:backstage:request
    input:
      method: POST
      path: '/api/azure-api/create-keyvault'
      body:
        systemName: ${{ parameters.systemName }}
```

## Architecture

### Components

1. **azure-api-client.ts** - Core client that handles Azure authentication and API calls
2. **azure-api-router.ts** - Express router that defines the API endpoints
3. **azure-api-module.ts** - Backstage backend module that registers the router

### Authentication Flow

1. The client initializes with Azure Service Principal credentials
2. When an API call is made, the client requests an access token from Azure AD
3. The token is used as a Bearer token in the Authorization header
4. The internal API validates the token and processes the request

## Development

### Running Locally

1. Set the required environment variables in your `.env` file
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the backend:
   ```bash
   yarn workspace backend start
   ```
4. Test the endpoint:
   ```bash
   curl http://localhost:7007/api/azure-api/health
   ```

### Testing

You can test the authentication and API calls by:

1. Checking the health endpoint
2. Making a test call to create-keyvault with a test system name
3. Reviewing the logs for any authentication or API errors

## Security Considerations

- **Secrets Management**: Never commit secrets to version control. Use environment variables or a secrets manager
- **Token Caching**: The Azure Identity library handles token caching and refresh automatically
- **Scope**: Adjust the token scope in `azure-api-client.ts` based on your API's requirements
- **HTTPS**: Always use HTTPS in production for the internal API URL
- **Network Security**: Ensure the internal API is only accessible from trusted networks

## Troubleshooting

### Authentication Errors

- Verify your Service Principal has the correct permissions
- Check that the tenant ID, client ID, and client secret are correct
- Ensure the API URL is accessible from your backend

### API Call Failures

- Check the logs for detailed error messages
- Verify the internal API is running and accessible
- Ensure the API endpoint `/create-keyvault` exists and accepts the expected payload

### Token Scope Issues

If you get 401/403 errors, you may need to adjust the token scope:

```typescript
// In azure-api-client.ts, modify the scope:
const tokenResponse = await this.credential.getToken([
  `api://your-api-app-id/.default`,
]);
```

## Extending the Module

To add more endpoints:

1. Add the method to `AzureApiClient` class in `azure-api-client.ts`
2. Add the route handler in `azure-api-router.ts`
3. Update this documentation

Example:

```typescript
// In azure-api-client.ts
async deleteKeyVault(systemName: string): Promise<DeleteResponse> {
  const token = await this.getAccessToken();
  const url = `${this.config.apiUrl}/delete-keyvault`;
  // ... implementation
}

// In azure-api-router.ts
router.delete('/delete-keyvault/:systemName', async (req, res) => {
  const { systemName } = req.params;
  const result = await azureClient.deleteKeyVault(systemName);
  res.json(result);
});
```
