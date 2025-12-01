import React from 'react';
import { Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, Chip } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { InfoCardVariants } from '@backstage/core-components';

export const KeyVaultMetadataCard = ({ variant }: { variant?: InfoCardVariants }) => {
  const { entity } = useEntity();

  const vaultName = entity.metadata.annotations?.['azure.com/vault-name'] || 'Not specified';
  const vaultUri = entity.metadata.annotations?.['azure.com/vault-uri'] || 'Not specified';
  const resourceGroup = entity.metadata.annotations?.['azure.com/resource-group'] || 'Not specified';
  const subscriptionId = entity.metadata.annotations?.['azure.com/subscription-id'] || 'Not specified';
  const location = entity.metadata.annotations?.['azure.com/location'] || 'Not specified';
  const cid = entity.metadata.annotations?.['idp.company/cid'] || 'Not specified';
  const lifecycle = entity.spec?.lifecycle || 'Unknown';

  return (
    <Card style={{ height: '100%' }}>
      <CardHeader
        title="Azure Key Vault Details"
        action={
          <Chip
            label={lifecycle}
            color={lifecycle === 'production' ? 'primary' : 'default'}
            size="small"
          />
        }
      />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemText
              primary="Vault Name"
              secondary={vaultName}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Vault URI"
              secondary={vaultUri}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2', style: { wordBreak: 'break-all' } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Resource Group"
              secondary={resourceGroup}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Subscription ID"
              secondary={subscriptionId}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2', style: { wordBreak: 'break-all' } }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Azure Region"
              secondary={location}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="CID"
              secondary={cid}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};
