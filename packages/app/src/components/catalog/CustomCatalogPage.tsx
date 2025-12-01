import React from 'react';
import { CatalogFilterLayout } from '@backstage/plugin-catalog';
import {
  CatalogTable,
  DefaultCatalogPageProps,
} from '@backstage/plugin-catalog';
import {
  EntityKindPicker,
  EntityListProvider,
  EntityOwnerPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListFilterKind,
  UserListPicker,
  CatalogFilterLayout as Layout,
} from '@backstage/plugin-catalog-react';
import { Content, PageWithHeader } from '@backstage/core-components';
import { DomainPicker } from './DomainPicker';

export const CustomCatalogPage = (props: DefaultCatalogPageProps) => {
  return (
    <PageWithHeader title="Catalog" themeId="home">
      <Content>
        <EntityListProvider>
          <Layout>
            <Layout.Filters>
              <EntityKindPicker initialFilter="system" hidden />
              <EntityTypePicker />
              <UserListPicker
                initialFilter={UserListFilterKind.Owned}
              />
              <EntityOwnerPicker />
              <DomainPicker />
              <EntityTagPicker />
            </Layout.Filters>
            <Layout.Content>
              <CatalogTable
                columns={props.columns}
                actions={props.actions}
              />
            </Layout.Content>
          </Layout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
