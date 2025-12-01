# Entity Model & Metadata

## Overview

This IDP leverages the Backstage Software Catalog to model data products and their infrastructure. This document describes the entity model, relationships, and custom metadata annotations used throughout the platform.

## Entity Hierarchy

```
Domain (Business Division)
└── System (Data Product)
    └── Component (Infrastructure Resource)
        ├── KeyVault
        ├── Database (future)
        ├── API (future)
        └── Storage Account (future)
```

## Entity Types

### Domain

**Purpose**: Represents a major business division or organizational unit.

**Backstage Kind**: `Domain`

**Example**:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Domain
metadata:
  name: sales
  description: Sales and customer relationship data products
spec:
  owner: group:default/idpusers
```

**Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `metadata.name` | Yes | string | Unique identifier (lowercase, hyphen-separated) |
| `metadata.description` | Yes | string | Business description of the domain |
| `spec.owner` | Yes | string | Owning group (format: `group:namespace/groupname`) |

**Standard Domains**:
- **finance**: Financial and accounting data products
- **humanresources**: Employee and workforce data products
- **sales**: Customer relationship and sales data products
- **marketing**: Marketing campaign and customer engagement data products
- **customerservice**: Customer support and service data products
- **supplychain**: Supply chain, logistics, and inventory data products

### System (Data Product)

**Purpose**: Represents a data product - a business capability that produces, transforms, or serves data.

**Backstage Kind**: `System`

**Example**:
```yaml
apiVersion: backstage.io/v1alpha1
kind: System
metadata:
  name: customer-360
  description: Customer 360 analytics data product
  annotations:
    idp.company/business-owner: matthew.taylor@company.com
    idp.company/technical-owner: emma.rodriguez@company.com
    idp.company/cid: CID-30001
spec:
  owner: group:default/idpadmins
  domain: sales
```

**Standard Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `metadata.name` | Yes | string | Unique identifier (lowercase, hyphen-separated) |
| `metadata.description` | Yes | string | Business description of the data product |
| `spec.owner` | Yes | string | Technical owner group |
| `spec.domain` | Yes | string | Parent domain reference |

**Custom Annotations**:
| Annotation | Required | Format | Description | Example |
|------------|----------|--------|-------------|---------|
| `idp.company/business-owner` | Yes | email | Business stakeholder email | `matthew.taylor@company.com` |
| `idp.company/technical-owner` | Yes | email | Technical lead email | `emma.rodriguez@company.com` |
| `idp.company/cid` | Yes | CID-NNNNN | Cost/Compliance ID | `CID-30001` |

**CID Format**:
- Pattern: `CID-NNNNN` (5 digits)
- First digit = Domain ID:
  - 1 = Finance
  - 2 = Human Resources
  - 3 = Sales
  - 4 = Marketing
  - 5 = Customer Service
  - 6 = Supply Chain
- Last 4 digits = Sequential number within domain
- Example: `CID-30001` = First data product in Sales domain

### Component (Infrastructure Resource)

**Purpose**: Represents a specific infrastructure resource that is part of a data product.

**Backstage Kind**: `Component`

**Supported Component Types**:
- `keyvault`: Azure Key Vault for secrets management
- `database`: Database instance (future)
- `api`: API Gateway or service (future)
- `storage`: Azure Storage Account (future)

**Example (KeyVault)**:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: customer-360-keyvault
  description: Key Vault for Customer 360 data product
  annotations:
    azure.com/vault-name: kv-customer360-prod
    azure.com/vault-uri: https://kv-customer360-prod.vault.azure.net/
    azure.com/resource-group: rg-sales-prod
    azure.com/subscription-id: c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f
    azure.com/location: centralus
    idp.company/cid: CID-30001
spec:
  type: keyvault
  lifecycle: production
  owner: group:default/idpadmins
  system: customer-360
```

**Standard Fields**:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `metadata.name` | Yes | string | Unique identifier (lowercase, hyphen-separated) |
| `metadata.description` | Yes | string | Component description |
| `spec.type` | Yes | string | Component type (keyvault, database, api, storage) |
| `spec.lifecycle` | Yes | string | Lifecycle stage (development, staging, production) |
| `spec.owner` | Yes | string | Owning group (inherited from parent system) |
| `spec.system` | Yes | string | Parent system reference |

**Azure Annotations (for KeyVault)**:
| Annotation | Required | Description | Example |
|------------|----------|-------------|---------|
| `azure.com/vault-name` | Yes | Azure Key Vault name | `kv-customer360-prod` |
| `azure.com/vault-uri` | Yes | Key Vault URI | `https://kv-customer360-prod.vault.azure.net/` |
| `azure.com/resource-group` | Yes | Azure Resource Group | `rg-sales-prod` |
| `azure.com/subscription-id` | Yes | Azure Subscription ID | `c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f` |
| `azure.com/location` | Yes | Azure region | `centralus` |
| `idp.company/cid` | Yes | Inherited from parent system | `CID-30001` |

### Group

**Purpose**: Represents a team or organizational unit for ownership and access control.

**Backstage Kind**: `Group`

**Standard Groups**:
- `group:default/idpadmins`: Platform administrators and data product technical owners
- `group:default/idpusers`: General platform users

**Integration**: Groups are synced from Microsoft Graph (Azure AD).

### User

**Purpose**: Represents an individual user in the platform.

**Backstage Kind**: `User`

**Integration**: Users are synced from Microsoft Graph (Azure AD).

## Entity Relationships

### Domain → System Relationship

**Relationship Type**: `RELATION_HAS_PART` / `RELATION_PART_OF`

**Definition**: A Domain contains one or more Systems (data products).

**Example**:
```
Domain: sales
  ↓ has part
System: customer-360
  ↑ part of
```

**Implementation**: Systems reference their parent domain via `spec.domain` field.

### System → Component Relationship

**Relationship Type**: `RELATION_HAS_PART` / `RELATION_PART_OF`

**Definition**: A System contains one or more Components (infrastructure resources).

**Example**:
```
System: customer-360
  ↓ has part
Component: customer-360-keyvault
  ↑ part of
```

**Implementation**: Components reference their parent system via `spec.system` field.

### Group → Entity Ownership

**Relationship Type**: `RELATION_OWNED_BY` / `RELATION_OWNER_OF`

**Definition**: Groups own entities (Domains, Systems, Components).

**Example**:
```
Group: default/idpadmins
  ↓ owner of
System: customer-360
  ↑ owned by
```

**Implementation**: Entities reference their owner via `spec.owner` field.

## Metadata Standards

### Naming Conventions

**Domains**:
- Format: lowercase, single word or camelCase for compound words
- Examples: `finance`, `humanresources`, `supplychain`
- Length: 3-20 characters

**Systems (Data Products)**:
- Format: lowercase with hyphens
- Pattern: `{business-capability}-{qualifier}`
- Examples: `customer-360`, `revenue-analytics`, `employee-performance`
- Length: 5-50 characters
- Must be descriptive and business-focused

**Components**:
- Format: lowercase with hyphens
- Pattern: `{system-name}-{component-type}[-{environment}]`
- Examples:
  - `customer-360-keyvault`
  - `revenue-analytics-db-prod`
  - `employee-performance-api-dev`
- Length: 10-60 characters
- Must include parent system name for traceability

### Description Guidelines

**Domains**:
- Length: 20-200 characters
- Focus on business area and purpose
- Example: "Sales and customer relationship data products"

**Systems**:
- Length: 30-300 characters
- Focus on business capability and value
- Include key data sources or outputs
- Example: "Customer 360 analytics data product combining CRM, transactions, and support data"

**Components**:
- Length: 20-200 characters
- Focus on technical purpose and relationship to parent
- Example: "Key Vault for Customer 360 data product secrets and configuration"

### Annotation Namespace

All custom annotations use the `idp.company/` namespace to avoid conflicts with Backstage core annotations and other plugins.

**Reserved Namespaces**:
- `backstage.io/`: Backstage core annotations
- `azure.com/`: Azure-specific annotations
- `idp.company/`: Enterprise IDP custom annotations

### Lifecycle Values

Components must use one of these standardized lifecycle values:

| Value | Description | Use Case |
|-------|-------------|----------|
| `experimental` | Proof of concept, not production-ready | Early prototyping |
| `development` | Active development, not production traffic | Development environments |
| `staging` | Pre-production testing | UAT and integration testing |
| `production` | Production traffic, SLA applies | Live data products |
| `deprecated` | Scheduled for decommissioning | Migration in progress |

## Custom Metadata Propagation

### CID Propagation

The Cost/Compliance Identifier (CID) flows from System to all child Components:

```
System: customer-360
  annotations:
    idp.company/cid: CID-30001
    ↓ propagated to
Component: customer-360-keyvault
  annotations:
    idp.company/cid: CID-30001
    ↓ propagated to
Azure Resource: kv-customer360-prod
  tags:
    CID: CID-30001
```

### Ownership Propagation

Group ownership is inherited from System to Components:

```
System: customer-360
  spec:
    owner: group:default/idpadmins
    ↓ inherited by
Component: customer-360-keyvault
  spec:
    owner: group:default/idpadmins
```

## Catalog Location Entities

To load entities into the Backstage catalog, we use Location entities that reference YAML files.

**Example Location**:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: systems-location
  description: All data product systems
spec:
  targets:
    - ./systems/customer-360.yaml
    - ./systems/revenue-analytics.yaml
    - ./systems/employee-performance.yaml
```

**Benefits**:
- Centralized entity registration
- Version control for entity definitions
- Bulk loading of entities
- Clear dependency management

## Validation Rules

### Required Fields Validation

All entities must have:
- `apiVersion`: Must be `backstage.io/v1alpha1`
- `kind`: Must be valid Backstage kind
- `metadata.name`: Must be unique within kind
- `metadata.description`: Must be present and non-empty
- `spec.owner`: Must reference existing group

### Custom Annotation Validation

Systems must have:
- `idp.company/business-owner`: Must be valid email format
- `idp.company/technical-owner`: Must be valid email format
- `idp.company/cid`: Must match `CID-\d{5}` pattern

Components (KeyVault) must have:
- All Azure annotations (`azure.com/*`)
- `idp.company/cid`: Must match parent system CID

### Relationship Validation

- Components must reference existing System via `spec.system`
- Systems must reference existing Domain via `spec.domain`
- Owners must reference existing Group via `spec.owner`

## Future Enhancements

### Planned Metadata

1. **Data Classification**: Sensitivity levels (Public, Internal, Confidential, Restricted)
2. **Compliance Tags**: GDPR, SOX, HIPAA, PCI-DSS applicability
3. **SLA Metadata**: Uptime requirements, RPO/RTO targets
4. **Cost Center**: Budget allocation and chargeback codes
5. **Data Lineage**: Upstream and downstream data dependencies
6. **Quality Scores**: Data quality metrics and thresholds

### Planned Component Types

1. **Database**: SQL Database, CosmosDB, Synapse
2. **API**: API Management, Function Apps
3. **Storage**: Blob Storage, Data Lake
4. **Processing**: Databricks, Data Factory, Synapse Pipelines
5. **Streaming**: Event Hub, Service Bus

### Enhanced Relationships

1. **Data Flow**: Track data movement between systems
2. **API Dependencies**: Track API consumption relationships
3. **Shared Resources**: Track shared infrastructure components
4. **Service Dependencies**: Track runtime dependencies
