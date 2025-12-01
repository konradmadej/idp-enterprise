import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { identityApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

const useStyles = makeStyles({
  card: {
    height: '100%',
  },
});

export const OwnedDataProductsCard = () => {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const identityApi = useApi(identityApiRef);

  const { value: entities, loading, error } = useAsync(async () => {
    const identity = await identityApi.getBackstageIdentity();
    const userEntityRef = identity.userEntityRef;

    // Get user's ownership groups
    const ownershipEntityRefs = identity.ownershipEntityRefs || [];

    // Fetch all Systems (data products)
    const response = await catalogApi.getEntities({
      filter: {
        kind: 'System',
      },
    });

    // Filter systems owned by user's groups
    const ownedSystems = response.items.filter(entity => {
      const owner = entity.spec?.owner as string;
      return ownershipEntityRefs.some(ref => ref === owner);
    });

    return ownedSystems;
  }, []);

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title="My Data Products" />
        <Divider />
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={classes.card}>
        <CardHeader title="My Data Products" />
        <Divider />
        <CardContent>
          <Typography color="error">Error loading data products</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardHeader title="My Data Products" subheader={`${entities?.length || 0} data products`} />
      <Divider />
      <CardContent>
        {entities && entities.length > 0 ? (
          <List dense>
            {entities.map(entity => (
              <ListItem key={entity.metadata.uid}>
                <ListItemText
                  primary={
                    <Link to={`/catalog/${entity.metadata.namespace || 'default'}/system/${entity.metadata.name}`}>
                      {entity.metadata.title || entity.metadata.name}
                    </Link>
                  }
                  secondary={entity.metadata.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No data products found owned by your groups
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
