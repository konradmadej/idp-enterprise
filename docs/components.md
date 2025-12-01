# Infrastructure Components

## Overview

Infrastructure components represent the technical resources that make up a data product. Each component is linked to a parent System (data product) and inherits governance metadata like CID and ownership.

## Component Architecture

### Component Lifecycle

```
1. Request       → User submits template request
2. Provisioning  → API creates Azure resource
3. Registration  → Component entity created in catalog
4. Management    → Monitored and maintained through IDP
5. Decommission  → Deprecated and eventually removed
```

### Component-System Relationship

```
System: customer-360 (Data Product)
├── Component: customer-360-keyvault (Secrets Management)
├── Component: customer-360-db (future - Data Storage)
├── Component: customer-360-api (future - Data Access)
└── Component: customer-360-storage (future - File Storage)
```

## Current Component Types

### Azure Key Vault (type: keyvault)

**Purpose**: Secure storage and management of secrets, keys, and certificates for data products.

**Use Cases**:
- Database connection strings
- API keys and tokens
- Service principal credentials
- Encryption keys
- TLS/SSL certificates

#### Entity Structure

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-keyvault
  description: Key Vault for Customer 360 data product
  annotations:
    # Azure Resource Identification
    azure.com/vault-name: kv-customer360-prod
    azure.com/vault-uri: https://kv-customer360-prod.vault.azure.net/
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    azure.com/location: centralus

    # Governance
    idp.company/cid: CID-30001
spec:
  type: keyvault
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
```

#### Required Annotations

| Annotation | Purpose | Example | Notes |
|------------|---------|---------|-------|
| `azure.com/vault-name` | Azure Key Vault resource name | `kv-customer360-prod` | Must be globally unique, 3-24 chars |
| `azure.com/vault-uri` | HTTPS endpoint for Key Vault | `https://kv-customer360-prod.vault.azure.net/` | Used by applications |
| `azure.com/resource-group` | Azure Resource Group | `rg-sales-prod` | Organizational grouping |
| `azure.com/subscription-id` | Azure Subscription ID | `c3d4e5f6-...` | UUID format |
| `azure.com/location` | Azure region | `centralus` | Data residency |
| `idp.company/cid` | Cost/Compliance ID | `CID-30001` | Inherited from parent system |

#### Naming Convention

**Format**: `{system-name}-keyvault[-{environment}]`

**Examples**:
- `customer-360-keyvault` (production implied)
- `revenue-analytics-keyvault-dev` (explicit development)
- `employee-performance-kv-prod` (explicit production)

**Azure Resource Naming**:
- Format: `kv-{system}-{env}`
- Examples: `kv-customer360-prod`, `kv-revenue-dev`
- Constraints: 3-24 characters, alphanumeric and hyphens only

#### Access Control

**RBAC Roles** (via Azure):
- **Key Vault Administrator**: Full access to vault and contents (IdpAdmins group)
- **Key Vault Secrets User**: Read-only access to secrets (Application service principals)
- **Key Vault Certificates Officer**: Manage certificates
- **Key Vault Crypto Officer**: Manage keys

**Access Policies**:
- Assigned based on group membership
- Technical owner group has administrative access
- Application identities get least-privilege access
- Audit logs track all access

#### UI Integration

**KeyVault Metadata Card**:
Displays Azure-specific information:
- Vault Name
- Vault URI
- Resource Group
- Subscription ID
- Azure Region
- CID
- Lifecycle stage (with badge)

**Azure Portal Links Card**:
Provides one-click navigation to:
- **Overview**: General vault information
- **Secrets**: Secret management interface
- **Access Policies**: Permission configuration
- **Metrics & Monitoring**: Usage and audit logs

Location: packages/app/src/components/catalog/KeyVaultMetadataCard.tsx:72-79

#### Monitoring & Compliance

**Azure Monitor Integration**:
- Secret access events
- Failed authentication attempts
- Certificate expiration warnings
- Vault capacity metrics

**Compliance Tracking**:
- All secrets encrypted at rest and in transit
- Access audit logs retained for 90 days
- CID tag applied to Azure resource for cost tracking
- Automatic compliance scanning (future)

## Future Component Types

### Database (type: database)

**Planned Support**:
- Azure SQL Database
- Azure PostgreSQL
- Azure Cosmos DB
- Azure Synapse dedicated SQL pools

**Entity Structure** (Planned):
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-db
  description: PostgreSQL database for Customer 360 data product
  annotations:
    azure.com/server-name: psql-customer360-prod
    azure.com/database-name: customer360db
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    azure.com/location: centralus
    idp.company/cid: CID-30001
    idp.company/data-classification: Confidential
    idp.company/backup-retention-days: "30"
spec:
  type: database
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
```

**Planned Features**:
- Connection string storage in linked Key Vault
- Automated backup configuration
- Schema migration tracking
- Query performance monitoring
- Data lineage visualization

### API Gateway (type: api)

**Planned Support**:
- Azure API Management
- Azure Function Apps
- Azure App Service

**Entity Structure** (Planned):
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-api
  description: REST API for Customer 360 data access
  annotations:
    azure.com/apim-name: apim-customer360-prod
    azure.com/api-path: /customer360/v1
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    idp.company/cid: CID-30001
    idp.company/sla-uptime: "99.9"
spec:
  type: api
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
  providesApis:
    - customer-360-rest-api
```

**Planned Features**:
- OpenAPI/Swagger spec integration
- API consumer tracking
- Rate limiting configuration
- API key management via Key Vault
- Performance metrics dashboard

### Storage Account (type: storage)

**Planned Support**:
- Azure Blob Storage
- Azure Data Lake Storage Gen2
- Azure Files

**Entity Structure** (Planned):
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-storage
  description: Data Lake for Customer 360 raw and processed data
  annotations:
    azure.com/storage-account: stcustomer360prod
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    azure.com/location: centralus
    idp.company/cid: CID-30001
    idp.company/data-classification: Confidential
    idp.company/retention-days: "365"
spec:
  type: storage
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
```

**Planned Features**:
- Storage access key management
- Lifecycle policy configuration
- Data retention enforcement
- Cost optimization recommendations
- Data classification scanning

### Data Processing (type: processing)

**Planned Support**:
- Azure Databricks
- Azure Data Factory
- Azure Synapse Pipelines

**Entity Structure** (Planned):
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-pipeline
  description: Data processing pipeline for Customer 360
  annotations:
    azure.com/adf-name: adf-customer360-prod
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    idp.company/cid: CID-30001
    idp.company/schedule: "0 2 * * *"
spec:
  type: processing
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
  dependsOn:
    - component:default/customer-360-storage
    - component:default/customer-360-db
```

**Planned Features**:
- Pipeline run history
- Data lineage tracking
- Error notification configuration
- Schedule management
- Resource utilization metrics

## Component Provisioning

### Request Workflow

1. **User selects template** in Backstage UI (e.g., "Request Key Vault")
2. **User fills form**:
   - Select parent system (data product)
   - Provide resource-specific parameters
   - Choose environment (dev/staging/prod)
3. **Template extracts CID** from selected system entity
4. **Template calls REST API** with parameters including CID
5. **API provisions Azure resource** with proper tags
6. **API creates catalog entity** for the new component
7. **User receives confirmation** with link to new component

### Automation

**CID Propagation**: Automatically extracted from parent system
**Ownership Inheritance**: Technical owner group inherited from system
**Tagging**: Azure resources automatically tagged with:
- `CID`: Cost/compliance tracking
- `System`: Parent data product name
- `Owner`: Technical owner group
- `Environment`: Lifecycle stage
- `ManagedBy`: IDP platform identifier

## Component Management

### Lifecycle States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| `experimental` | POC/testing phase | Full access, no SLA |
| `development` | Active development | Modify configuration, no production data |
| `staging` | Pre-production testing | Production-like, limited modifications |
| `production` | Live, serving production workloads | Change control required, SLA applies |
| `deprecated` | Scheduled for removal | Read-only, migration timeline set |

### Operations

**Component Update**:
- Configuration changes tracked in catalog
- Azure resource changes tracked in Activity Log
- Change approval workflow (future)

**Component Monitoring**:
- Azure Monitor metrics displayed in IDP
- Alert configuration via templates
- Incident correlation with catalog entity

**Component Decommissioning**:
1. Mark as `deprecated` in catalog
2. Set decommission date in annotations
3. Notify stakeholders
4. Migrate dependent systems
5. Delete Azure resource
6. Archive catalog entity

## Security & Compliance

### Access Control

**Principle of Least Privilege**:
- Components inherit ownership from parent system
- Application identities get minimal required permissions
- Human access requires MFA and justification
- Privileged operations require approval

**Audit Trail**:
- All Azure resource access logged
- Catalog changes tracked with user identity
- Template executions logged with parameters
- Access reviews conducted quarterly

### Data Classification

Components will support data classification tags:
- **Public**: No restrictions
- **Internal**: Company employees only
- **Confidential**: Restricted to authorized personnel
- **Restricted**: Highest security, regulatory compliance required

### Compliance Automation

**Planned Features**:
- Automatic encryption validation
- Access policy compliance scanning
- Certificate expiration monitoring
- Unused secret detection
- Cost anomaly alerts

## Best Practices

### Naming

1. **Be Descriptive**: Include parent system name in component name
2. **Be Consistent**: Follow established naming patterns
3. **Include Environment**: When multiple environments exist
4. **Use Lowercase**: With hyphens as separators
5. **Keep It Short**: Azure resources have length constraints

### Configuration

1. **Use Key Vault for Secrets**: Never hardcode credentials
2. **Tag Everything**: Ensure CID and owner tags are applied
3. **Document Purpose**: Clear description in catalog entity
4. **Link Components**: Use catalog relationships to show dependencies
5. **Set Lifecycle**: Accurately reflect environment stage

### Operations

1. **Monitor Actively**: Set up alerts for critical resources
2. **Review Access**: Regularly audit who has access
3. **Rotate Secrets**: Follow security policies for rotation
4. **Track Costs**: Monitor spending against budget
5. **Plan Capacity**: Anticipate growth and scale accordingly

## Integration Points

### Azure Portal

- Direct links from IDP to Azure resources
- Consistent navigation experience
- Deep linking to specific resource views

### Azure Resource Manager

- Resource tagging for cost allocation
- RBAC integration for access control
- Activity logs for audit trail

### Microsoft Graph

- Group membership for ownership
- User profile information
- Authentication and authorization

### REST APIs

- Component provisioning
- Configuration updates
- Status reporting
- Metrics collection

## Future Roadmap

### Short Term (Next 3-6 months)

1. **Database Components**: Add support for Azure SQL and PostgreSQL
2. **Enhanced Monitoring**: Integrate Azure Monitor dashboards
3. **Cost Tracking**: Display per-component cost information
4. **Approval Workflows**: Add change approval for production components

### Medium Term (6-12 months)

1. **API Components**: Support for API Management and Function Apps
2. **Storage Components**: Support for Blob Storage and Data Lake
3. **Data Lineage**: Visualize data flow between components
4. **Automated Compliance**: Continuous compliance scanning

### Long Term (12+ months)

1. **Processing Components**: Support for Databricks and Data Factory
2. **Multi-Cloud**: Extend beyond Azure to AWS and GCP
3. **Self-Healing**: Automated remediation of common issues
4. **AI Recommendations**: ML-driven optimization suggestions
