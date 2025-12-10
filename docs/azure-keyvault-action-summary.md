# Azure Key Vault Scaffolder Action - Summary

## What Was Built

A custom Backstage scaffolder action that creates Azure Key Vaults by calling an internal Azure API with Azure AD authentication - **no proxy or separate API plugin needed**.

## Architecture

```
Template → azure:keyvault:create Action → Azure AD (get token) → Internal API → Azure
```

The action is self-contained and handles:
1. Reading configuration from `app-config.yaml`
2. Authenticating with Azure AD using Service Principal
3. Making authenticated API calls
4. Returning results to the template

## Files Created

### Backend Module
- `packages/backend/src/modules/azure-api-actions.ts` - The scaffolder action implementation
- `packages/backend/src/modules/azure-api-actions-module.ts` - Module registration
- `packages/backend/src/index.ts` - (updated) Registers the module

### Templates
- `examples/templates/simple-azure-api-example/template.yaml` - Simple example
- `examples/templates/keyvault-request/template.yaml` - (updated) Full-featured template

### Documentation
- `docs/using-azure-api-in-templates.md` - Template usage guide
- `packages/backend/src/modules/README.md` - Module documentation

## Configuration Required

### app-config.yaml
```yaml
azureApi:
  apiUrl: ${AZURE_INTERNAL_API_URL}
  clientId: ${AZURE_API_CLIENT_ID}
  clientSecret: ${AZURE_API_CLIENT_SECRET}
  tenantId: ${AZURE_API_TENANT_ID}
```

### Environment Variables
```bash
AZURE_INTERNAL_API_URL=https://your-internal-api.com
AZURE_API_CLIENT_ID=your-client-id
AZURE_API_CLIENT_SECRET=your-secret
AZURE_API_TENANT_ID=your-tenant-id
```

## Usage in Templates

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: azure:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}

output:
  text:
    - title: Result
      content: |
        Key Vault: ${{ steps['create-keyvault'].output.keyVaultName }}
        Success: ${{ steps['create-keyvault'].output.success }}
```

## Benefits of This Approach

1. **Simpler**: No separate API plugin or proxy to maintain
2. **Direct**: Action calls API directly from template execution
3. **Secure**: Azure authentication handled automatically
4. **Extensible**: Easy to add more actions for other Azure resources
5. **Testable**: Can be tested directly from templates

## Dependencies Added

- `@backstage/plugin-scaffolder-node` - For creating custom actions
- `@azure/identity` - For Azure authentication
- `node-fetch` - For making HTTP requests (already available in Node)

## Next Steps

To add more Azure resource provisioning:

1. Create new action functions in `azure-api-actions.ts`
2. Register them in `azure-api-actions-module.ts`
3. Use them in your templates

Example actions you could add:
- `azure:storage:create` - Create storage accounts
- `azure:database:create` - Create databases
- `azure:appservice:create` - Create app services
