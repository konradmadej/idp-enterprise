import React from 'react';
import { Content, Page, Header } from '@backstage/core-components';
import { HomePageCompanyLogo } from '@backstage/plugin-home';
import { Grid, makeStyles } from '@material-ui/core';
import { OwnedDataProductsCard } from './OwnedDataProductsCard';
import { OwnedDomainsCard } from './OwnedDomainsCard';

const useStyles = makeStyles(theme => ({
  searchBarInput: {
    maxWidth: '60vw',
    margin: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50px',
    boxShadow: theme.shadows[1],
  },
  searchBarOutline: {
    borderStyle: 'none',
  },
}));

export const HomePage = () => {
  const classes = useStyles();

  return (
    <Page themeId="home">
      <Header title="IDP Dashboard" subtitle="Welcome to your Internal Developer Platform" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <OwnedDataProductsCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <OwnedDomainsCard />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
