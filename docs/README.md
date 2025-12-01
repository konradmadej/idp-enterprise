# Enterprise Internal Developer Platform (IDP)

## Overview

This Internal Developer Platform (IDP) is built on Backstage and specifically designed to manage data products across the enterprise. The platform provides a unified interface for discovering, managing, and provisioning data products and their associated infrastructure components.

## Purpose

The IDP serves as the central hub for:
- **Data Product Discovery**: Browse and search data products across all domains
- **Self-Service Provisioning**: Request infrastructure components (Key Vaults, databases, etc.) through standardized templates
- **Governance & Compliance**: Track ownership, CIDs, and compliance metadata
- **Azure Integration**: Seamless integration with Azure resources and Azure Portal

## Key Concepts

### Data Products as Systems

In this IDP, **Systems** represent **Data Products**. Each data product:
- Belongs to a specific business domain (Finance, Sales, HR, etc.)
- Has clear ownership (business and technical owners)
- Contains associated components (Key Vaults, databases, APIs)
- Tracks governance metadata (CID, compliance tags)

### Domains

Domains represent major business divisions:
- **Finance**: Revenue, budgeting, financial reporting
- **Human Resources**: Employee data, workforce planning
- **Sales**: Customer data, pipeline analytics
- **Marketing**: Campaign data, customer segmentation
- **Customer Service**: Support tickets, satisfaction metrics
- **Supply Chain**: Inventory, logistics, supplier management

## Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Backstage Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home       │  │   Catalog    │  │ Data Products│      │
│  │  Dashboard   │  │    Page      │  │     Page     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────┐
│              Backstage Backend / Catalog                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Domains    │  │   Systems    │  │  Components  │      │
│  │              │  │ (Data Products)│  │  (KeyVault) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Scaffolder (Templates)                      │    │
│  │  - Key Vault Request                                │    │
│  │  - Database Provisioning (future)                   │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼──────┐    ┌────▼─────┐    ┌─────▼──────┐
    │   Azure    │    │   APIs   │    │  Microsoft │
    │   Portal   │    │ (REST)   │    │    Graph   │
    └────────────┘    └──────────┘    └────────────┘
```

## Platform Features

### 1. Discovery & Navigation
- **Home Dashboard**: Personalized view of owned data products and domains
- **Catalog**: Browse all entities (systems, components, domains)
- **Data Products Page**: Dedicated view with domain filtering

### 2. Self-Service Provisioning
- **Template-Based Requests**: Standardized forms for infrastructure requests
- **Automatic Metadata Extraction**: CIDs and ownership automatically populated
- **API Integration**: Templates trigger REST APIs for resource creation

### 3. Governance & Compliance
- **Custom Metadata**: CID, business owner, technical owner tracking
- **Ownership Model**: Group-based ownership with Microsoft Graph integration
- **Audit Trail**: Track resource creation and modifications

### 4. Azure Integration
- **Direct Portal Links**: One-click access to Azure resources
- **Resource Metadata**: Track Azure subscriptions, resource groups, regions
- **Key Vault Management**: Specialized views for Azure Key Vaults

## Documentation Structure

- [Data Products Architecture](./data-products.md) - Detailed data product model
- [Entity Model & Metadata](./entity-model.md) - Catalog entities and custom metadata
- [Component Types](./components.md) - Infrastructure components (KeyVault, etc.)
- [Self-Service Templates](./templates.md) - Available provisioning templates
- [Integration Guide](./integrations.md) - External system integrations

## Technology Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **Catalog**: Backstage Software Catalog
- **Authentication**: Microsoft Azure AD
- **Identity Provider**: Microsoft Graph API
- **Cloud Provider**: Microsoft Azure
- **API Communication**: REST APIs

## Getting Started

1. **Browse Data Products**: Navigate to the Data Products page to explore available products
2. **Filter by Domain**: Use domain filters to find products in your business area
3. **Request Resources**: Use templates to provision infrastructure components
4. **Manage Ownership**: Track and update data product metadata

## Support & Feedback

For questions or feedback about the IDP, please contact the Platform Engineering team or create an issue in the repository.
