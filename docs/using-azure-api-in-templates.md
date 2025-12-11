# Using CodeBlue Key Vault Actions in Backstage Templates

This guide shows you how to create and check Azure Key Vaults from Backstage templates using the custom CodeBlue actions.

## Available Actions

### 1. `codeblue:keyvault:create`
Creates a new Azure Key Vault asynchronously.

### 2. `codeblue:keyvault:check-status`
Checks the provisioning status of a Key Vault with retry logic.

## Basic Usage

### Creating a Key Vault

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: codeblue:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}
      environment: ${{ parameters.environment }}
      region: ${{ parameters.region }}
```

The action handles everything automatically:
- **Azure AD Authentication** - Gets access token using Service Principal
- **API Call** - Makes authenticated request to your internal Azure API
- **Error Handling** - Provides clear error messages if something fails

### Checking Key Vault Status

```yaml
steps:
  - id: check-status
    name: Wait for Key Vault Provisioning
    action: codeblue:keyvault:check-status
    input:
      keyVaultName: ${{ steps['create-keyvault'].output.keyVaultName }}
      maxAttempts: 10  # Check up to 10 times (optional, default: 10)
      intervalSeconds: 30  # Wait 30 seconds between checks (optional, default: 30)
```

### Complete Example: Create and Wait

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: codeblue:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}
      environment: ${{ parameters.environment }}
      region: ${{ parameters.region }}

  - id: check-status
    name: Wait for Provisioning
    action: codeblue:keyvault:check-status
    input:
      keyVaultName: ${{ steps['create-keyvault'].output.keyVaultName }}
      maxAttempts: 20
      intervalSeconds: 30

  - id: log-result
    name: Log Result
    if: ${{ steps['check-status'].output.provisioned === true }}
    action: debug:log
    input:
      message: 'Key Vault successfully provisioned!'
```

## Input Properties

### `codeblue:keyvault:create`

| Property | Type | Description |
|----------|------|-------------|
| `systemName` | string | Name of the system that needs a Key Vault |
| `environment` | string | Environment (e.g., development, staging, production) |
| `region` | string | Azure region (e.g., eastus, westeurope) |

### `codeblue:keyvault:check-status`

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `keyVaultName` | Yes | string | Name of the Key Vault to check |
| `maxAttempts` | No | number | Maximum number of status checks (default: 10) |
| `intervalSeconds` | No | number | Seconds to wait between checks (default: 30) |

## Accessing the Response

The action outputs are available in subsequent steps:

```yaml
output:
  text:
    - title: Result
      content: |
        Status: ${{ steps['create-keyvault'].output.success }}
        Key Vault: ${{ steps['create-keyvault'].output.keyVaultName }}
        Message: ${{ steps['create-keyvault'].output.message }}
```

## Output Properties

The action provides these outputs:

| Property | Type | Description |
|----------|------|-------------|
| `success` | boolean | Whether the Key Vault was created successfully |
| `keyVaultName` | string | Name of the created Key Vault |
| `message` | string | Success or error message from the API |

## Error Handling

The action will throw an error if the Key Vault creation fails. You can handle this with conditional steps:

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: codeblue:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}

  - id: check-result
    name: Log Success
    if: ${{ steps['create-keyvault'].output.success === true }}
    action: debug:log
    input:
      message: 'Key Vault created: ${{ steps["create-keyvault"].output.keyVaultName }}'
```

## Advanced: Fetching System Data from Catalog

Combine with catalog lookup to enrich your workflow:

```yaml
steps:
  - id: fetch-system
    name: Get System from Catalog
    action: catalog:fetch
    input:
      entityRef: system:default/${{ parameters.systemName }}

  - id: create-keyvault
    name: Create Key Vault for System
    action: codeblue:keyvault:create
    input:
      systemName: ${{ steps['fetch-system'].entity.metadata.name }}

output:
  text:
    - title: Summary
      content: |
        Created Key Vault for system: ${{ steps['fetch-system'].entity.metadata.name }}
        Key Vault Name: ${{ steps['create-keyvault'].output.keyVaultName }}
        Domain: ${{ steps['fetch-system'].entity.spec.domain }}
```

## Full Template Example

Here's a complete template:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: create-keyvault
  title: Create Azure Key Vault
  description: Create a Key Vault for a system
spec:
  owner: group:default/platform
  type: service

  parameters:
    - title: System Information
      required:
        - systemName
      properties:
        systemName:
          title: System Name
          type: string
          description: Name of the system

  steps:
    - id: create-keyvault
      name: Create Key Vault
      action: codeblue:keyvault:create
      input:
        systemName: ${{ parameters.systemName }}
        environment: ${{ parameters.environment }}
        region: ${{ parameters.region }}

  output:
    links:
      - title: View in Azure Portal
        icon: cloud
        url: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults

    text:
      - title: Key Vault Created
        content: |
          ## Success! ✅

          Your Key Vault has been created:

          - **Name**: ${{ steps['create-keyvault'].output.keyVaultName }}
          - **System**: ${{ parameters.systemName }}
          - **Environment**: ${{ parameters.environment }}
          - **Region**: ${{ parameters.region }}
          - **Status**: ${{ steps['create-keyvault'].output.success ? '✅ Created' : '❌ Failed' }}

          ${{ steps['create-keyvault'].output.message }}
```

## Using OwnedEntityPicker

To let users select from existing systems in the catalog:

```yaml
parameters:
  - title: Select System
    required:
      - system
    properties:
      system:
        title: System
        type: string
        ui:field: OwnedEntityPicker
        ui:options:
          catalogFilter:
            kind: System
          defaultKind: System

steps:
  - id: create-keyvault
    name: Create Key Vault
    action: codeblue:keyvault:create
    input:
      # Extract just the name from the entity reference
      systemName: ${{ (parameters.system | parseEntityRef).name }}
      environment: ${{ parameters.environment }}
      region: ${{ parameters.region }}
```

## Debugging

Add logging to see what's happening:

```yaml
steps:
  - id: create-keyvault
    name: Create Key Vault
    action: codeblue:keyvault:create
    input:
      systemName: ${{ parameters.systemName }}

  - id: debug-response
    name: Debug Response
    action: debug:log
    input:
      message: |
        Success: ${{ steps['create-keyvault'].output.success }}
        Key Vault: ${{ steps['create-keyvault'].output.keyVaultName }}
        Message: ${{ steps['create-keyvault'].output.message }}
```

## Testing Your Template

1. Navigate to `/create` in Backstage
2. Find your template
3. Fill in the form
4. Click "Create"
5. Monitor the execution logs
6. Check the output for the result

## Automated Status Synchronization

### Background Sync Job

Backstage automatically runs a scheduled job that:
1. Scans all `keyvault` components in the catalog
2. Checks provisioning status for unprovisioned vaults
3. Updates catalog entities when provisioning completes

**Default Schedule**: Every 5 minutes

**Configuration** (`app-config.yaml`):
```yaml
codeblue:
  statusSync:
    frequency: '*/5 * * * *'  # Cron expression
    timeout: 300000  # Timeout in milliseconds
```

**Entity Annotations**:
- `codeblue.com/provisioning-status`: Current status (`provisioned` or empty)
- `codeblue.com/provisioning-status-updated`: ISO timestamp of last update

### When to Use Each Approach

**Use `codeblue:keyvault:check-status` action when:**
- Template needs to wait for provisioning before proceeding
- Immediate feedback is required
- Template performs additional steps after provisioning

**Rely on background sync job when:**
- Template can complete without waiting
- User can check status later in catalog
- Reducing template execution time is important

## Common Issues

### Action Not Found
**Error**: `Template action with ID codeblue:keyvault:create is not registered`

**Solution**: 
- Restart the Backstage backend
- Verify `azure-api-actions-module` is registered in `packages/backend/src/index.ts`
- Check backend logs for initialization errors

### Configuration Missing
**Error**: `CodeBlue configuration not found in app-config.yaml`

**Solution**:
- Add `codeblue` section to your `app-config.yaml`
- Set environment variables: `CODEBLUE_API_URL`, `CODEBLUE_CLIENT_ID`, `CODEBLUE_CLIENT_SECRET`, `CODEBLUE_TENANT_ID`

### Authentication Failed
**Error**: `Failed to acquire access token from Azure AD`

**Solution**:
- Verify Azure Service Principal credentials are correct
- Check Service Principal has required permissions
- Ensure tenant ID is correct

### API Call Failed
**Error**: `API request failed with status 500`

**Solution**:
- Check backend logs for detailed error
- Verify the internal API is accessible from the Backstage backend
- Ensure API URL is correct (no trailing slash)

## Next Steps

- Add validation for the systemName parameter
- Implement error handling and retry logic
- Display rich output with links to Azure Portal
- Register created resources in the Backstage catalog
