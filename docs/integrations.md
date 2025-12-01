# Integration Guide

## Overview

This IDP integrates with several external systems to provide seamless data product management, authentication, authorization, and resource provisioning. This document describes all integration points, their purpose, and implementation details.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backstage IDP                             │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Frontend (React)                         │  │
│  │  - Authentication redirects                           │  │
│  │  - Azure Portal deep links                            │  │
│  │  - User/Group display                                 │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │              Backend (Node.js)                        │  │
│  │  - Catalog API                                        │  │
│  │  - Template Engine (Scaffolder)                       │  │
│  │  - API Proxy                                          │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
└──────────────────┼───────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼────┐ ┌──▼──────┐ ┌▼─────────────┐
   │ Azure   │ │Microsoft│ │  REST APIs   │
   │ Portal  │ │  Graph  │ │ (Provisioning)│
   └─────────┘ └─────────┘ └──────────────┘
```

## Microsoft Azure Active Directory (Azure AD)

### Purpose

- **User Authentication**: Single sign-on (SSO) for platform access
- **Authorization**: Role-based access control via group membership
- **Identity Provider**: Source of truth for user identities

### Integration Type

**OAuth 2.0 / OpenID Connect**

### Configuration

**app-config.yaml**:
```yaml
auth:
  environment: development
  providers:
    microsoft:
      development:
        clientId: ${AZURE_CLIENT_ID}
        clientSecret: ${AZURE_CLIENT_SECRET}
        tenantId: ${AZURE_TENANT_ID}
```

**Environment Variables**:
| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_CLIENT_ID` | Azure AD application (client) ID | `a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d` |
| `AZURE_CLIENT_SECRET` | Client secret for authentication | `secret~value~here` |
| `AZURE_TENANT_ID` | Azure AD tenant (directory) ID | `e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b` |

### Azure AD Application Setup

**Required API Permissions**:
| Permission | Type | Purpose |
|------------|------|---------|
| `User.Read` | Delegated | Read user profile information |
| `GroupMember.Read.All` | Delegated | Read group memberships for authorization |
| `email` | Delegated | Access user email address |
| `openid` | Delegated | OpenID Connect authentication |
| `profile` | Delegated | Access user profile |

**Redirect URIs**:
- Development: `http://localhost:3000/api/auth/microsoft/handler/frame`
- Production: `https://idp.company.com/api/auth/microsoft/handler/frame`

**Token Configuration**:
- ID tokens: Enabled
- Access tokens: Enabled
- Token lifetime: 60 minutes (configurable)

### User Experience

1. User navigates to IDP
2. Not authenticated → Redirected to Azure AD login
3. User enters credentials (or SSO if already logged in)
4. Azure AD redirects back with token
5. Backstage validates token and creates session
6. User accesses IDP with their identity

### Security Features

- **Multi-Factor Authentication (MFA)**: Enforced at Azure AD level
- **Conditional Access**: Policies applied via Azure AD
- **Token Refresh**: Automatic token refresh for long sessions
- **Session Timeout**: Configurable session expiration

## Microsoft Graph API

### Purpose

- **User Synchronization**: Import user profiles into Backstage catalog
- **Group Synchronization**: Import groups and memberships for ownership
- **Profile Information**: Display user names, photos, emails

### Integration Type

**REST API with OAuth 2.0 authentication**

### Configuration

**app-config.yaml**:
```yaml
catalog:
  providers:
    microsoftGraphOrg:
      default:
        tenantId: ${AZURE_TENANT_ID}
        clientId: ${AZURE_CLIENT_ID}
        clientSecret: ${AZURE_CLIENT_SECRET}
        user:
          filter: accountEnabled eq true
        group:
          filter: securityEnabled eq true
        schedule:
          frequency: { hours: 1 }
          timeout: { minutes: 50 }
```

### Required API Permissions

**Application Permissions** (not delegated):
| Permission | Purpose |
|------------|---------|
| `User.Read.All` | Read all user profiles |
| `Group.Read.All` | Read all groups |
| `GroupMember.Read.All` | Read group memberships |

### Synchronization Process

**Schedule**: Runs every 1 hour

**User Sync**:
1. Query Microsoft Graph for all active users
2. Transform to Backstage User entities
3. Update catalog with new/changed users
4. Mark inactive users

**Group Sync**:
1. Query Microsoft Graph for security groups
2. Transform to Backstage Group entities
3. Query group members
4. Update catalog with groups and memberships

**Entity Mapping**:

**Microsoft Graph User** → **Backstage User**:
| Graph Field | Backstage Field | Example |
|-------------|-----------------|---------|
| `userPrincipalName` | `metadata.name` | `matthew.taylor@company.com` |
| `displayName` | `spec.profile.displayName` | `Matthew Taylor` |
| `mail` | `spec.profile.email` | `matthew.taylor@company.com` |
| `jobTitle` | `spec.profile.title` | `Senior Data Analyst` |
| `id` | `metadata.annotations['graph.microsoft.com/user-id']` | `a1b2c3d4-e5f6-...` |

**Microsoft Graph Group** → **Backstage Group**:
| Graph Field | Backstage Field | Example |
|-------------|-----------------|---------|
| `displayName` | `metadata.name` | `idpadmins` |
| `description` | `metadata.description` | `IDP Administrators` |
| `mail` | `spec.profile.email` | `idpadmins@company.com` |
| `id` | `metadata.annotations['graph.microsoft.com/group-id']` | `e5f6a7b8-c9d0-...` |

### Ownership Resolution

When a data product specifies:
```yaml
spec:
  owner: group:default/idpadmins
```

Backstage resolves:
1. Look up group `idpadmins` in catalog
2. Query group members from Microsoft Graph
3. Display group members on entity page
4. Use membership for authorization checks

## Azure Portal Integration

### Purpose

- **Resource Navigation**: Direct links to Azure resources from IDP
- **Unified Experience**: Seamless transition between IDP and Azure Portal
- **Operational Access**: Quick access to resource management

### Integration Type

**Deep linking via URL construction**

### Implementation

**AzurePortalLinksCard Component** (packages/app/src/components/catalog/AzurePortalLinksCard.tsx:29-36):

```typescript
const baseUrl = 'https://portal.azure.com/#@/resource';
const resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.KeyVault/vaults/${vaultName}`;

const overviewUrl = `${baseUrl}${resourceId}/overview`;
const secretsUrl = `${baseUrl}${resourceId}/secrets`;
const accessPoliciesUrl = `${baseUrl}${resourceId}/access_policies_list`;
const metricsUrl = `${baseUrl}${resourceId}/insights`;
```

### URL Patterns

**Key Vault Overview**:
```
https://portal.azure.com/#@/resource/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.KeyVault/vaults/{vaultName}/overview
```

**Key Vault Secrets**:
```
https://portal.azure.com/#@/resource/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.KeyVault/vaults/{vaultName}/secrets
```

**Key Vault Access Policies**:
```
https://portal.azure.com/#@/resource/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.KeyVault/vaults/{vaultName}/access_policies_list
```

**Key Vault Metrics**:
```
https://portal.azure.com/#@/resource/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.KeyVault/vaults/{vaultName}/insights
```

### Metadata Requirements

Components must have these annotations for Azure Portal links to work:
- `azure.com/vault-name`: Resource name
- `azure.com/resource-group`: Resource group name
- `azure.com/subscription-id`: Subscription UUID

### User Experience

1. User views KeyVault component in IDP
2. "Azure Portal Links" card displays with icons
3. User clicks link (e.g., "Secrets")
4. New browser tab opens to Azure Portal
5. User sees resource in Azure Portal (already authenticated via Azure AD SSO)

### Future Enhancements

- Embed Azure Portal views in IFrame (if supported)
- Display real-time metrics from Azure Monitor
- Show cost information from Azure Cost Management
- Trigger ARM template deployments from IDP

## REST API for Resource Provisioning

### Purpose

- **Infrastructure Provisioning**: Create Azure resources via templates
- **Catalog Management**: Register new components in catalog
- **Workflow Automation**: Orchestrate multi-step provisioning processes

### Integration Type

**REST API over HTTPS with proxy**

### Configuration

**app-config.yaml Proxy** (app-config.yaml:58-64):
```yaml
proxy:
  endpoints:
    '/keyvault-api':
      target: 'https://someapi.com'
      changeOrigin: true
```

**Purpose of Proxy**:
- Centralized API endpoint configuration
- SSL/TLS termination
- Request/response logging
- Rate limiting (future)
- Authentication token injection (future)

### Template Integration

Templates call API via `http:backstage:request` action:

```yaml
- id: create-keyvault
  name: Call Key Vault Creation API
  action: http:backstage:request
  input:
    method: POST
    path: '/api/proxy/keyvault-api/keyvault/create'
    headers:
      Content-Type: 'application/json'
    body:
      cid: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/cid"] }}
      vaultName: ${{ parameters.vaultName }}
      # ... other parameters
```

### API Contract

#### Create Key Vault Endpoint

**Request**:
```http
POST /keyvault/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "cid": "CID-30001",
  "vaultName": "kv-customer360-prod",
  "location": "eastus",
  "environment": "production",
  "resourceGroup": "rg-sales-prod",
  "systemName": "customer-360",
  "businessOwner": "matthew.taylor@company.com",
  "technicalOwner": "emma.rodriguez@company.com",
  "description": "Secrets for Customer 360 data product"
}
```

**Success Response** (201 Created):
```json
{
  "status": "success",
  "vaultName": "kv-customer360-prod",
  "vaultUri": "https://kv-customer360-prod.vault.azure.net/",
  "resourceId": "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{name}",
  "subscriptionId": "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
  "resourceGroup": "rg-sales-prod",
  "location": "eastus",
  "catalogEntityCreated": true,
  "catalogEntityRef": "component:default/customer-360-keyvault"
}
```

**Error Response** (400 Bad Request):
```json
{
  "status": "error",
  "message": "Key Vault name 'kv-customer360-prod' is already taken",
  "code": "VAULT_NAME_UNAVAILABLE",
  "details": {
    "field": "vaultName",
    "providedValue": "kv-customer360-prod"
  }
}
```

### API Implementation Requirements

The backend API must:

1. **Validate Request**:
   - Check all required fields are present
   - Validate CID format (`CID-\d{5}`)
   - Verify vault name availability
   - Validate Azure region
   - Check resource group exists or can be created

2. **Authorize Request**:
   - Verify user token (passed via Authorization header)
   - Check user is member of system's owner group
   - Ensure user has permissions in Azure subscription
   - Log authorization decision

3. **Provision Azure Resource**:
   - Call Azure Resource Manager (ARM) API
   - Create Key Vault with specified configuration
   - Apply tags: `CID`, `System`, `Environment`, `BusinessOwner`, `TechnicalOwner`, `ManagedBy=IDP`
   - Configure access policies for technical owner group
   - Enable diagnostics logging to Log Analytics
   - Enable soft delete and purge protection

4. **Register in Catalog**:
   - Generate Component entity YAML
   - Populate all required fields and annotations
   - Call Backstage Catalog API to register entity
   - Link to parent system via `spec.system`
   - Verify entity was created successfully

5. **Return Response**:
   - Include all resource details
   - Provide Azure Portal link
   - Indicate catalog entity creation status
   - Include any warnings or recommendations

### Error Handling

**Common Error Codes**:
| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `VAULT_NAME_UNAVAILABLE` | 400 | Vault name already exists | Choose different name |
| `INVALID_CID` | 400 | CID format invalid | Check system entity CID annotation |
| `UNAUTHORIZED` | 403 | User lacks permissions | Request access to system owner group |
| `QUOTA_EXCEEDED` | 429 | Subscription quota reached | Contact Azure admin |
| `PROVISIONING_FAILED` | 500 | Azure provisioning error | Check Azure Activity Log |
| `CATALOG_REGISTRATION_FAILED` | 500 | Failed to create entity | Check Backstage logs |

### Idempotency

API should support idempotent requests:
- If resource already exists with same parameters, return success
- If resource exists with different parameters, return conflict error
- Include `X-Idempotency-Key` header for request deduplication (future)

### Audit Logging

Every API call should log:
- Request timestamp
- User identity (from token)
- Request parameters (excluding secrets)
- CID of affected data product
- Provisioning result (success/failure)
- Azure resource ID created
- Catalog entity created

## Future Integrations

### Azure Resource Manager (ARM) Direct Integration

**Purpose**: Query Azure resources directly from IDP

**Benefits**:
- Real-time resource status
- Cost information display
- Compliance scanning
- Resource drift detection

**Implementation**:
- Backstage plugin for Azure
- Service principal with read-only access
- Scheduled synchronization of resource metadata

### Azure Monitor & Application Insights

**Purpose**: Display metrics and logs in IDP

**Benefits**:
- Performance monitoring
- Error tracking
- Usage analytics
- Cost trends

**Implementation**:
- Azure Monitor plugin
- Dashboard widgets in component pages
- Alert configuration via templates

### Azure DevOps / GitHub Actions

**Purpose**: Link CI/CD pipelines to data products

**Benefits**:
- Deployment status visibility
- Build history
- Test results
- Automated deployments

**Implementation**:
- GitHub/Azure DevOps plugin
- Pipeline annotations on components
- Trigger deployments from IDP

### Data Catalog Integration

**Purpose**: Link to enterprise data catalog for data lineage

**Benefits**:
- Data lineage visualization
- Schema browsing
- Data quality metrics
- Usage statistics

**Implementation**:
- Custom plugin or API integration
- Metadata sync between systems
- Deep links to catalog entries

### Service Now / Jira

**Purpose**: Incident and change management integration

**Benefits**:
- Link incidents to components
- Track change requests
- Service health status
- On-call rotation display

**Implementation**:
- ServiceNow/Jira plugin
- Webhook integration for updates
- Dashboard widgets for incidents

## Security Considerations

### Authentication & Authorization

- All integrations use OAuth 2.0 or API keys
- Tokens stored securely (never in source code)
- Service principals follow least privilege
- Regular credential rotation

### Network Security

- All connections over HTTPS
- API proxy adds security layer
- Rate limiting to prevent abuse
- IP allowlisting for production APIs

### Data Protection

- PII handled according to privacy policy
- Sensitive data not logged
- Encryption in transit and at rest
- Compliance with GDPR, SOX, etc.

### Audit & Compliance

- All integration calls logged
- User actions traceable
- Failed authentication attempts tracked
- Regular security reviews

## Troubleshooting

### Azure AD Authentication Issues

**Problem**: User cannot log in
- Check Azure AD application is configured correctly
- Verify redirect URIs match
- Check API permissions are granted
- Verify user has access to tenant

**Problem**: User lacks expected permissions
- Check Microsoft Graph group sync is running
- Verify user is member of correct groups in Azure AD
- Check group filter in configuration
- Trigger manual sync if needed

### Microsoft Graph Sync Issues

**Problem**: Users/groups not appearing
- Check Microsoft Graph API permissions
- Verify filters in configuration
- Check sync schedule and last run time
- Review logs for API errors

**Problem**: Group memberships incorrect
- Microsoft Graph may have replication delay
- Trigger manual sync
- Verify group type (security vs. distribution)

### Azure Portal Links Not Working

**Problem**: Links lead to error page
- Verify all Azure annotations are present
- Check subscription ID format (must be UUID)
- Ensure user has access to Azure subscription
- Verify resource exists in Azure

### API Provisioning Failures

**Problem**: Template fails to create resource
- Check API endpoint is accessible
- Verify proxy configuration
- Review API response in template logs
- Check Azure quota limits
- Verify user has required Azure permissions

**Problem**: Resource created but catalog entity missing
- Check Backstage catalog API logs
- Verify entity YAML format is valid
- Check entity doesn't conflict with existing entity
- Trigger manual entity registration

## Monitoring Integration Health

### Metrics to Track

- Azure AD authentication success rate
- Microsoft Graph sync completion time
- API provisioning success rate
- Azure Portal link click-through rate
- Average template execution time

### Health Checks

- Azure AD token validation endpoint
- Microsoft Graph API connectivity
- Provisioning API availability
- Catalog API responsiveness

### Alerts to Configure

- Authentication failures exceed threshold
- Microsoft Graph sync fails
- Provisioning API returns errors
- Catalog entity registration fails
- User without group membership (orphan)
