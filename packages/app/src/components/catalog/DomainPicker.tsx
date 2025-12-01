import React, { useMemo } from 'react';
import { useEntityList } from '@backstage/plugin-catalog-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { Select, SelectItem } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

export const DomainPicker = () => {
  const catalogApi = useApi(catalogApiRef);
  const { filters, updateFilters, queryParameters } = useEntityList();

  const { value: domains, loading } = useAsync(async () => {
    const response = await catalogApi.getEntities({
      filter: {
        kind: 'Domain',
      },
    });
    return response.items;
  }, []);

  // Get the current domain filter from query parameters
  const selectedDomain = useMemo(
    () => queryParameters.domain?.toString() || 'all',
    [queryParameters.domain],
  );

  const availableDomains = useMemo(() => {
    const items: SelectItem[] = (domains || [])
      .map(domain => ({
        label: domain.metadata.title || domain.metadata.name,
        value: domain.metadata.name.toLowerCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      { label: 'All Domains', value: 'all' },
      ...items,
    ];
  }, [domains]);

  const handleChange = (value: string) => {
    if (value === 'all') {
      // Remove domain filter
      updateFilters({
        domain: undefined,
      });
    } else {
      // Add domain filter - filter by spec.domain
      updateFilters({
        domain: new EntityFilter('spec.domain', value),
      });
    }
  };

  if (loading) {
    return <Box pb={1}>Loading domains...</Box>;
  }

  return (
    <Box pb={1}>
      <Select
        label="Domain"
        items={availableDomains}
        selected={selectedDomain}
        onChange={handleChange}
      />
    </Box>
  );
};

// Custom filter class for domain filtering
class EntityFilter {
  constructor(
    private readonly key: string,
    private readonly value: string,
  ) {}

  filterEntity(entity: Entity): boolean {
    const domain = entity.spec?.domain as string | undefined;
    return domain?.toLowerCase() === this.value.toLowerCase();
  }

  toQueryValue(): string {
    return this.value;
  }
}
