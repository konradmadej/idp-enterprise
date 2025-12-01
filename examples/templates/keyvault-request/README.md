# Key Vault Request Template

This Backstage template allows users to request a new Azure Key Vault for an existing data product system.

## Features

- **System Picker**: Select from a list of existing data product systems
- **Automatic CID Extraction**: Automatically extracts the CID from the selected system's annotations
- **GitHub Workflow Integration**: Triggers a GitHub Actions workflow to create the Key Vault
- **Catalog Entry Creation**: Automatically creates a catalog entry for the new Key Vault

## Prerequisites

### 1. GitHub Workflow Setup

You need to create a GitHub Actions workflow in your infrastructure repository at `.github/workflows/create-keyvault.yml`:

```yaml
name: Create Azure Key Vault

on:
  workflow_dispatch:
    inputs:
      cid:
        description: 'CID from the data product system'
        required: true
      vaultName:
        description: 'Key Vault name'
        required: true
      location:
        description: 'Azure region'
        required: true
      environment:
        description: 'Environment (development/staging/production)'
        required: true
      resourceGroup:
        description: 'Resource group name'
        required: true
      systemName:
        description: 'System name'
        required: true
      businessOwner:
        description: 'Business owner email'
        required: true
      technicalOwner:
        description: 'Technical owner email'
        required: true
      description:
        description: 'Key Vault description'
        required: false

jobs:
  create-keyvault:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Create Key Vault
        run: |
          az keyvault create \
            --name ${{ github.event.inputs.vaultName }} \
            --resource-group rg-${{ github.event.inputs.resourceGroup }}-prod \
            --location ${{ github.event.inputs.location }} \
            --tags \
              cid=${{ github.event.inputs.cid }} \
              system=${{ github.event.inputs.systemName }} \
              environment=${{ github.event.inputs.environment }} \
              business-owner=${{ github.event.inputs.businessOwner }} \
              technical-owner=${{ github.event.inputs.technicalOwner }}

      - name: Set Access Policies
        run: |
          # Add your access policy configuration here
          echo "Key Vault created successfully"
```

### 2. Update Template Configuration

Update the `repoUrl` in the template to point to your infrastructure repository:

```yaml
input:
  workflowId: create-keyvault.yml
  repoUrl: github.com?repo=YOUR-REPO&owner=YOUR-ORG  # Update this
  branchOrTagName: main
```

## How to Use

1. Navigate to the **Create...** page in Backstage
2. Select **Request Key Vault for Data Product**
3. Fill in the form:
   - **Select Data Product**: Choose the system that needs a Key Vault
   - **Key Vault Name**: Enter a unique name (3-24 characters, alphanumeric and hyphens)
   - **Azure Region**: Select the Azure region
   - **Environment**: Choose development, staging, or production
   - **Resource Group** (optional): Leave empty to auto-generate from domain
   - **Description**: Brief description of the Key Vault's purpose
4. Click **Create**

## What Happens

1. The template fetches the selected system entity from the catalog
2. Extracts the CID annotation from the system
3. Triggers the GitHub Actions workflow with all parameters including the CID
4. Creates a catalog entry for the new Key Vault component
5. Links the Key Vault to the parent system

## Output

After successful creation, you'll see:
- Link to the new Key Vault in the catalog
- Link to the parent system
- Link to the GitHub workflow run

## Customization

### API Integration Instead of GitHub Workflow

If you want to call an API directly instead of using GitHub Actions, replace the `github:actions:dispatch` step with:

```yaml
- id: call-keyvault-api
  name: Call Key Vault Creation API
  action: http:backstage:request
  input:
    method: POST
    url: https://your-api.example.com/keyvaults
    headers:
      Authorization: Bearer ${{ secrets.API_TOKEN }}
    body:
      cid: ${{ steps["fetch-system"].output.entity.metadata.annotations["idp.company/cid"] }}
      vaultName: ${{ parameters.vaultName }}
      location: ${{ parameters.location }}
      # ... other parameters
```

## Notes

- The CID is automatically extracted from the system's `idp.company/cid` annotation
- Business and technical owner information is also passed to the workflow
- The Key Vault component is automatically linked to the parent system
- All Azure naming conventions are enforced in the form validation
