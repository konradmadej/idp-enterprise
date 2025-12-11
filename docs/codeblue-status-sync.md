# CodeBlue Key Vault Actions - Implementation Summary

## Overview

Two complementary mechanisms for managing Azure Key Vault provisioning status:

1. **Scaffolder Action** (`codeblue:keyvault:check-status`) - For immediate status checking within templates
2. **Scheduled Job** (Background sync) - For automated catalog updates

## 1. Status Check Scaffolder Action

### Action: `codeblue:keyvault:check-status`

**Purpose**: Poll the CodeBlue API to check if a Key Vault has been provisioned, with configurable retry logic.

**Input Parameters**:
- `keyVaultName` (required): Name of the Key Vault to check
- `maxAttempts` (optional, default: 10): Maximum number of status checks
- `intervalSeconds` (optional, default: 30): Seconds between checks

**Output**:
- `provisioned` (boolean): Whether the Key Vault is provisioned
- `status` (string): Current provisioning status
- `message` (string): Status message

**Usage Example**:
```yaml
steps:
  - id: create-keyvault
    action: codeblue:keyvault:create
    input:
      systemName: customer-360
      environment: production
      region: eastus

  - id: check-status
    action: codeblue:keyvault:check-status
    input:
      keyVaultName: ${{ steps['create-keyvault'].output.keyVaultName }}
      maxAttempts: 20
      intervalSeconds: 30
```

**API Endpoint**: `POST ${apiUrl}/check-keyvault-status`

**Expected Response**:
```json
{
  "provisioned": true|false,
  "status": "string",
  "message": "string (optional)"
}
```

## 2. Scheduled Status Sync Job

### Module: `codeblue-status-sync-module`

**Purpose**: Automatically scan catalog for unprovisioned Key Vaults and update their status.

**Schedule**: Configurable via cron expression (default: every 5 minutes)

**Workflow**:
1. Query catalog for all `Component` entities with `spec.type: keyvault`
2. Filter out entities already marked as `provisioned`
3. For each unprovisioned vault:
   - Extract `azure.com/vault-name` annotation
   - Call CodeBlue API status endpoint
   - If provisioned, update entity annotations:
     - `codeblue.com/provisioning-status: provisioned`
     - `codeblue.com/provisioning-status-updated: <timestamp>`
   - Refresh entity in catalog

**Configuration** (`app-config.yaml`):
```yaml
codeblue:
  apiUrl: ${CODEBLUE_API_URL}
  clientId: ${CODEBLUE_CLIENT_ID}
  clientSecret: ${CODEBLUE_CLIENT_SECRET}
  tenantId: ${CODEBLUE_TENANT_ID}
  statusSync:
    frequency: '*/5 * * * *'  # Every 5 minutes
    timeout: 300000  # 5 minutes in milliseconds
```

**Catalog Entity Annotations**:
```yaml
metadata:
  annotations:
    azure.com/vault-name: kv-customer360-prod
    codeblue.com/provisioning-status: provisioned
    codeblue.com/provisioning-status-updated: '2025-12-10T14:30:00Z'
```

## Architecture

### Files Created/Modified

**New Files**:
1. `packages/backend/src/modules/codeblue-status-sync-module.ts` - Scheduled job implementation
2. `examples/templates/keyvault-with-status-check/template.yaml` - Example template

**Modified Files**:
1. `packages/backend/src/modules/azure-api-actions.ts` - Added `checkAzureKeyVaultStatusAction`
2. `packages/backend/src/modules/azure-api-actions-module.ts` - Registered new action
3. `packages/backend/src/index.ts` - Added sync module
4. `app-config.yaml` - Added `statusSync` configuration
5. `docs/using-azure-api-in-templates.md` - Comprehensive documentation

### Registration

**Backend Index** (`packages/backend/src/index.ts`):
```typescript
// Add custom CodeBlue actions
backend.add(import('./modules/azure-api-actions-module'));
// Add CodeBlue status sync scheduled task
backend.add(import('./modules/codeblue-status-sync-module'));
```

## Use Cases

### Use Case 1: Template Waits for Provisioning
Template needs to perform additional steps after Key Vault is ready.

**Solution**: Use `codeblue:keyvault:check-status` action
- Max wait time: `maxAttempts × intervalSeconds` (e.g., 20 × 30 = 10 minutes)
- Template execution blocks until provisioned or timeout
- Immediate feedback to user

### Use Case 2: Fire-and-Forget with Later Updates
User initiates creation and can check back later.

**Solution**: Skip status check, rely on scheduled sync job
- Template completes immediately
- Background job updates catalog within ~5 minutes
- User checks entity page for current status

### Use Case 3: Hybrid Approach
Quick initial check, then background monitoring.

**Solution**: Use both
- Action checks a few times (e.g., 3 attempts × 30s = 90s)
- If not ready, complete template anyway
- Background job continues monitoring

## API Requirements

The CodeBlue internal API must implement:

### 1. Create Endpoint
`POST /create-keyvault`

**Request**:
```json
{
  "systemName": "string",
  "environment": "string",
  "region": "string"
}
```

**Response**:
```json
{
  "success": true,
  "keyVaultName": "kv-system-env-region",
  "message": "Key Vault creation initiated"
}
```

### 2. Status Check Endpoint
`POST /check-keyvault-status`

**Request**:
```json
{
  "keyVaultName": "kv-system-env-region"
}
```

**Response**:
```json
{
  "provisioned": true,
  "status": "Succeeded|Creating|Failed",
  "message": "Optional status message"
}
```

## Benefits

1. **Flexibility**: Templates can choose to wait or not
2. **Reliability**: Background job ensures catalog stays in sync
3. **User Experience**: Clear feedback on provisioning status
4. **Scalability**: Scheduled job handles bulk updates efficiently
5. **Observability**: Logging at each step for debugging

## Monitoring

**Scaffolder Action Logs**:
```
[codeblue:keyvault:check-status] Checking status for Key Vault: kv-customer360-prod (max 20 attempts, 30s interval)
[codeblue:keyvault:check-status] Status check attempt 1/20 for kv-customer360-prod
[codeblue:keyvault:check-status] Status response: provisioned=false, status=Creating
[codeblue:keyvault:check-status] Waiting 30 seconds before next check...
...
[codeblue:keyvault:check-status] Key Vault kv-customer360-prod is provisioned!
```

**Scheduled Job Logs**:
```
[codeblue-status-sync] Starting CodeBlue status sync task
[codeblue-status-sync] Found 12 keyvault components in catalog
[codeblue-status-sync] Checking status for Key Vault: kv-customer360-prod
[codeblue-status-sync] Key Vault kv-customer360-prod is now provisioned. Updating catalog entity.
[codeblue-status-sync] Updated entity customer-360-keyvault with provisioned status
[codeblue-status-sync] CodeBlue status sync completed. Checked: 3, Updated: 1
```

## Next Steps

1. Deploy updated backend
2. Configure `codeblue.statusSync` in `app-config.yaml`
3. Test with example template: `keyvault-with-status-check`
4. Monitor logs to verify scheduled job runs
5. Update existing templates to use status check if needed
