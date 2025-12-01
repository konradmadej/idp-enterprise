import React from 'react';
import { CatalogTable } from '@backstage/plugin-catalog';
import {
  EntityKindPicker,
  EntityListProvider,
  EntityOwnerPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListPicker,
  CatalogFilterLayout,
  EntitySearchBar,
} from '@backstage/plugin-catalog-react';
import { Content, PageWithHeader } from '@backstage/core-components';
import { DomainPicker } from './DomainPicker';

export const CustomCatalogPage = () => {
  return (
    <PageWithHeader title="Data Products" themeId="home">
      <Content>
        <EntityListProvider>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntitySearchBar />
              <EntityKindPicker initialFilter="system" />
              <EntityTypePicker />
              <UserListPicker
                initialFilter="owned"
              />
              <EntityOwnerPicker />
              <DomainPicker />
              <EntityTagPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
