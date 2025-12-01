import React from 'react';
import { Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { InfoCardVariants } from '@backstage/core-components';

export const DataProductMetadataCard = ({ variant }: { variant?: InfoCardVariants }) => {
  const { entity } = useEntity();

  const businessOwner = entity.metadata.annotations?.['idp.company/business-owner'] || 'Not specified';
  const technicalOwner = entity.metadata.annotations?.['idp.company/technical-owner'] || 'Not specified';
  const cid = entity.metadata.annotations?.['idp.company/cid'] || 'Not specified';

  return (
    <Card style={{ height: '100%' }}>
      <CardHeader title="Data Product Metadata" />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemText
              primary="Business Owner"
              secondary={businessOwner}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Technical Owner"
              secondary={technicalOwner}
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
