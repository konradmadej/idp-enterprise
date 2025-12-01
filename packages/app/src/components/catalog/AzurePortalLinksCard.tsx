import React from 'react';
import { Card, CardContent, CardHeader, Divider, List, ListItem, ListItemIcon, ListItemText, Link } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { InfoCardVariants } from '@backstage/core-components';
import CloudIcon from '@material-ui/icons/Cloud';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import SecurityIcon from '@material-ui/icons/Security';
import AssessmentIcon from '@material-ui/icons/Assessment';

export const AzurePortalLinksCard = ({ variant }: { variant?: InfoCardVariants }) => {
  const { entity } = useEntity();

  const vaultName = entity.metadata.annotations?.['azure.com/vault-name'];
  const resourceGroup = entity.metadata.annotations?.['azure.com/resource-group'];
  const subscriptionId = entity.metadata.annotations?.['azure.com/subscription-id'];

  if (!vaultName || !resourceGroup || !subscriptionId) {
    return (
      <Card style={{ height: '100%' }}>
        <CardHeader title="Azure Portal Links" />
        <Divider />
        <CardContent>
          <p>Azure configuration is incomplete. Please add the required annotations.</p>
        </CardContent>
      </Card>
    );
  }

  // Construct Azure Portal URLs
  const baseUrl = 'https://portal.azure.com/#@/resource';
  const resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.KeyVault/vaults/${vaultName}`;

  const overviewUrl = `${baseUrl}${resourceId}/overview`;
  const secretsUrl = `${baseUrl}${resourceId}/secrets`;
  const accessPoliciesUrl = `${baseUrl}${resourceId}/access_policies_list`;
  const metricsUrl = `${baseUrl}${resourceId}/insights`;

  const links = [
    {
      title: 'Overview',
      description: 'View Key Vault overview in Azure Portal',
      url: overviewUrl,
      icon: <CloudIcon />,
    },
    {
      title: 'Secrets',
      description: 'Manage secrets stored in this Key Vault',
      url: secretsUrl,
      icon: <VpnKeyIcon />,
    },
    {
      title: 'Access Policies',
      description: 'Configure access policies and permissions',
      url: accessPoliciesUrl,
      icon: <SecurityIcon />,
    },
    {
      title: 'Metrics & Monitoring',
      description: 'View usage metrics and monitoring data',
      url: metricsUrl,
      icon: <AssessmentIcon />,
    },
  ];

  return (
    <Card style={{ height: '100%' }}>
      <CardHeader title="Azure Portal Links" />
      <Divider />
      <CardContent>
        <List dense>
          {links.map((link, index) => (
            <ListItem key={index} button component="a" href={link.url} target="_blank" rel="noopener noreferrer">
              <ListItemIcon>
                {link.icon}
              </ListItemIcon>
              <ListItemText
                primary={link.title}
                secondary={link.description}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
