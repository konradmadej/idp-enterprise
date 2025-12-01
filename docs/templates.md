# Self-Service Templates

## Overview

Backstage templates enable self-service provisioning of infrastructure components for data products. Templates provide standardized forms that collect user input, extract metadata from the catalog, and trigger REST APIs to create Azure resources.

## Template Architecture

### Template Workflow

```
1. User navigates to "Create..." page
2. User selects template (e.g., "Request Key Vault")
3. User fills form with required parameters
4. Template fetches system entity from catalog
5. Template extracts governance metadata (CID, owners)
6. Template calls REST API with complete payload
7. API provisions Azure resource and creates catalog entity
8. User sees confirmation with links
```

### Template Components

**Input Parameters**: Form fields for user input (dropdowns, text fields, entity pickers)
**Steps**: Sequential actions to fetch data and call APIs
**Output**: Summary page with links and confirmation details

## Current Templates

### Request Key Vault for Data Product

**Template ID**: `keyvault-request`

**Purpose**: Request a new Azure Key Vault for an existing data product system.

**Location**: examples/templates/keyvault-request/template.yaml

#### Template Metadata

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: keyvault-request
  title: Request Key Vault for Data Product
  description: Request a new Azure Key Vault for an existing data product system
  tags:
    - azure
    - keyvault
    - data-product
spec:
  owner: group:default/idpadmins
  type: service
```

#### Input Parameters

**Section 1: Select Data Product**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `system` | EntityPicker | Yes | Select the parent data product system |

**UI Configuration**:
- Entity picker filtered to `kind: System`
- Displays only data products
- Shows system name and description

**Section 2: Key Vault Configuration**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `vaultName` | string | Yes | `^[a-zA-Z0-9-]{3,24}$` | Globally unique Key Vault name |
| `location` | enum | Yes | Predefined list | Azure region for deployment |
| `environment` | enum | Yes | dev/staging/prod | Environment lifecycle stage |
| `resourceGroup` | string | No | - | Azure resource group (auto-generated if empty) |

**Available Azure Regions**:
- East US (`eastus`)
- West US 2 (`westus2`)
- Central US (`centralus`)
- North Europe (`northeurope`)
- West Europe (`westeurope`)
- Southeast Asia (`southeastasia`)

**Section 3: Additional Information**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | textarea | No | Purpose of the Key Vault |

#### Template Steps

**Step 1: Fetch System Entity from Catalog**

```yaml
- id: fetch-system-entity
  name: Fetch System Entity from Catalog
  action: http:backstage:request
  input:
    method: GET
    path: '/api/catalog/entities/by-name/${{ parameters.system }}'
```

**Purpose**: Retrieves complete system entity to extract governance metadata
**Output**: Full entity object with metadata and annotations

**Step 2: Extract CID from System**

```yaml
- id: extract-cid
  name: Extract CID from System
  action: debug:log
  input:
    message: 'System CID: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/cid"] }}'
```

**Purpose**: Logs CID for debugging and audit trail
**Output**: Debug log entry

**Step 3: Call Key Vault Creation API**

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
      location: ${{ parameters.location }}
      environment: ${{ parameters.environment }}
      resourceGroup: ${{ parameters.resourceGroup || steps["fetch-system-entity"].output.body.spec.domain }}
      systemName: ${{ steps["fetch-system-entity"].output.body.metadata.name }}
      businessOwner: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/business-owner"] }}
      technicalOwner: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/technical-owner"] }}
      description: ${{ parameters.description }}
```

**Purpose**: Provisions Azure Key Vault via REST API
**Endpoint**: `POST /keyvault/create` (proxied through Backstage)
**Payload**:
- User-provided parameters (vaultName, location, environment, description)
- Auto-extracted metadata (CID, system name, owners)
- Auto-generated resource group (defaults to domain name if not provided)

**Expected API Response**:
```json
{
  "status": "success",
  "vaultName": "kv-customer360-prod",
  "vaultUri": "https://kv-customer360-prod.vault.azure.net/",
  "resourceId": "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{name}",
  "catalogEntityCreated": true
}
```

#### Template Output

**Links**:
- View Parent System: Deep link to parent system catalog page

**Summary Text**:
```markdown
## Key Vault Created Successfully

A Key Vault has been created with the following details:

- **Vault Name**: kv-customer360-prod
- **System**: customer-360
- **CID**: CID-30001
- **Location**: eastus
- **Environment**: production
- **Resource Group**: rg-sales-prod
```

#### API Integration

**Proxy Configuration** (app-config.yaml:58-64):
```yaml
proxy:
  endpoints:
    '/keyvault-api':
      target: 'https://someapi.com'
      changeOrigin: true
```

**API Contract**:

**Request**:
```
POST /keyvault/create
Content-Type: application/json

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

**Expected Response**:
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "status": "success",
  "vaultName": "kv-customer360-prod",
  "vaultUri": "https://kv-customer360-prod.vault.azure.net/",
  "resourceId": "/subscriptions/c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f/resourceGroups/rg-sales-prod/providers/Microsoft.KeyVault/vaults/kv-customer360-prod",
  "subscriptionId": "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
  "resourceGroup": "rg-sales-prod",
  "location": "eastus",
  "catalogEntityCreated": true
}
```

**Error Response**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "status": "error",
  "message": "Key Vault name 'kv-customer360-prod' is already taken",
  "code": "VAULT_NAME_UNAVAILABLE"
}
```

#### Backend Implementation Expectations

The API endpoint should:

1. **Validate Input**:
   - Verify vault name is globally unique
   - Validate location is supported Azure region
   - Check CID format matches `CID-\d{5}`
   - Verify resource group exists or can be created

2. **Provision Azure Resource**:
   - Create Azure Key Vault with specified configuration
   - Apply tags: `CID`, `System`, `Environment`, `BusinessOwner`, `TechnicalOwner`, `ManagedBy`
   - Configure access policies for technical owner group
   - Enable Azure Monitor diagnostics
   - Enable soft delete and purge protection

3. **Create Catalog Entity**:
   - Generate Component entity YAML
   - Populate all Azure annotations
   - Link to parent system via `spec.system`
   - Register entity in Backstage catalog

4. **Return Response**:
   - Include vault URI for immediate use
   - Provide Azure resource ID for tracking
   - Confirm catalog entity creation

## Future Templates

### Request Azure SQL Database

**Planned Template**: `azure-sql-request`

**Purpose**: Provision Azure SQL Database for data product

**Key Parameters**:
- Parent system (EntityPicker)
- Database name
- Compute tier (serverless, provisioned)
- Storage size (GB)
- Backup retention (days)
- Azure region
- Environment

**Automated Actions**:
- Create database with specified configuration
- Store connection string in linked Key Vault
- Configure firewall rules for platform access
- Enable threat detection and auditing
- Create catalog component entity

### Request Azure Storage Account

**Planned Template**: `storage-account-request`

**Purpose**: Provision Azure Storage Account (Blob/Data Lake) for data product

**Key Parameters**:
- Parent system (EntityPicker)
- Storage account name
- Account type (StorageV2, BlockBlobStorage, DataLakeStorageGen2)
- Performance tier (Standard, Premium)
- Replication (LRS, GRS, ZRS, GZRS)
- Azure region
- Environment

**Automated Actions**:
- Create storage account with specified configuration
- Store access keys in linked Key Vault
- Configure lifecycle management policies
- Enable blob versioning and soft delete
- Create catalog component entity

### Request API Management API

**Planned Template**: `apim-api-request`

**Purpose**: Register API in Azure API Management

**Key Parameters**:
- Parent system (EntityPicker)
- API name and path
- Backend service URL
- OpenAPI specification (upload or URL)
- Rate limiting policy
- Environment

**Automated Actions**:
- Import OpenAPI spec into APIM
- Configure policies and rate limits
- Generate subscription keys
- Store keys in linked Key Vault
- Create catalog API entity and component entity

### Request Data Factory Pipeline

**Planned Template**: `adf-pipeline-request`

**Purpose**: Create Azure Data Factory pipeline for data processing

**Key Parameters**:
- Parent system (EntityPicker)
- Pipeline name
- Source component (EntityPicker - Storage/Database)
- Destination component (EntityPicker - Storage/Database)
- Schedule (cron expression)
- Transformation logic (optional)

**Automated Actions**:
- Create Data Factory pipeline
- Configure linked services to source and destination
- Set up schedule trigger
- Configure monitoring and alerts
- Create catalog component entity with dependencies

### Request Databricks Workspace

**Planned Template**: `databricks-workspace-request`

**Purpose**: Provision Azure Databricks workspace for data processing

**Key Parameters**:
- Parent system (EntityPicker)
- Workspace name
- Pricing tier (Standard, Premium)
- Azure region
- VNet integration (optional)

**Automated Actions**:
- Create Databricks workspace
- Configure access tokens
- Store tokens in linked Key Vault
- Set up integration with Data Lake
- Create catalog component entity

## Template Development Guidelines

### Template Structure

Every template must include:

1. **Metadata**: name, title, description, tags, owner
2. **Parameters**: Organized sections with clear labels
3. **Steps**: Logical sequence of actions
4. **Output**: Links and summary for user

### Parameter Best Practices

**Use Entity Pickers for References**:
```yaml
system:
  title: Data Product System
  type: string
  ui:field: EntityPicker
  ui:options:
    catalogFilter:
      - kind: System
```

**Provide Helpful Defaults**:
```yaml
location:
  title: Azure Region
  type: string
  default: eastus
```

**Add Validation Patterns**:
```yaml
vaultName:
  title: Key Vault Name
  type: string
  pattern: '^[a-zA-Z0-9-]{3,24}$'
```

**Include Help Text**:
```yaml
resourceGroup:
  title: Resource Group (Optional)
  type: string
  ui:help: 'Leave empty to auto-generate based on domain'
```

### Step Best Practices

**Fetch Required Context**:
```yaml
- id: fetch-system-entity
  name: Fetch System Entity from Catalog
  action: http:backstage:request
  input:
    method: GET
    path: '/api/catalog/entities/by-name/${{ parameters.system }}'
```

**Log for Debugging**:
```yaml
- id: log-parameters
  name: Log Request Parameters
  action: debug:log
  input:
    message: 'Creating resource for CID: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/cid"] }}'
```

**Handle Errors Gracefully**:
- Validate inputs before API calls
- Provide clear error messages
- Include troubleshooting guidance in output

### Output Best Practices

**Provide Navigation Links**:
```yaml
links:
  - title: View Parent System
    icon: dashboard
    entityRef: ${{ parameters.system }}
  - title: View Azure Portal
    icon: cloud
    url: https://portal.azure.com/#@/resource/${{ steps["create-resource"].output.body.resourceId }}
```

**Summarize What Happened**:
```yaml
text:
  - title: Resource Created Successfully
    content: |
      ## Summary

      Your request has been processed successfully.

      - **Resource Name**: ${{ parameters.resourceName }}
      - **CID**: ${{ steps["fetch-system-entity"].output.body.metadata.annotations["idp.company/cid"] }}
      - **Location**: ${{ parameters.location }}

      The resource will be available in approximately 5-10 minutes.
```

## Security Considerations

### Authentication

- Templates execute with user's identity
- User must be authenticated via Azure AD
- User's group membership determines authorization
- All API calls include user identity in audit logs

### Authorization

- Users can only create resources for systems they own
- Template validates user is member of system's owner group
- API enforces additional authorization checks
- Privileged operations require elevated roles

### Data Protection

- CID and owner information automatically applied
- Sensitive data (connection strings, keys) stored in Key Vault
- Template parameters logged for audit (excluding secrets)
- Azure resources tagged with governance metadata

### Audit Trail

Every template execution records:
- User identity (email, Azure AD object ID)
- Timestamp
- Selected system and extracted metadata
- Input parameters
- API responses
- Success or failure status

## Monitoring & Troubleshooting

### Template Execution Logs

View logs in Backstage:
1. Navigate to "Create..." page
2. Select "Task Activity" in sidebar
3. View recent template executions
4. Click execution to see detailed logs

### Common Issues

**Issue**: "Entity not found" error
- **Cause**: System entity doesn't exist or user lacks permission
- **Solution**: Verify system name and check ownership

**Issue**: "API timeout" error
- **Cause**: Azure resource provisioning takes longer than expected
- **Solution**: Check Azure portal directly, resource may still be creating

**Issue**: "Vault name already taken" error
- **Cause**: Key Vault names must be globally unique
- **Solution**: Choose a different vault name

**Issue**: "Missing CID annotation" error
- **Cause**: Parent system entity lacks required `idp.company/cid` annotation
- **Solution**: Update system entity to include CID

## Integration with CI/CD

### Future Enhancement: GitOps Workflow

**Planned Workflow**:
1. Template creates pull request with resource definition
2. PR triggers validation pipeline
3. Reviewers approve infrastructure change
4. Merge triggers deployment pipeline
5. Pipeline provisions resource and updates catalog

**Benefits**:
- Infrastructure as Code (IaC)
- Change history in Git
- Review and approval process
- Automated testing before deployment
- Rollback capability

## Template Governance

### Template Ownership

- All templates owned by `group:default/idpadmins`
- Changes to templates require review
- Template catalog maintains version history
- Deprecated templates marked with warning

### Template Review Process

Before deploying new templates:
1. **Security Review**: Validate authorization and data protection
2. **API Review**: Verify backend implementation
3. **UX Review**: Ensure form is clear and helpful
4. **Test Execution**: Verify end-to-end workflow in dev environment
5. **Documentation**: Update this guide with new template details

### Template Metrics

Track template usage to understand adoption:
- Execution count by template
- Success vs. failure rate
- Average execution time
- Most common errors
- User feedback ratings
