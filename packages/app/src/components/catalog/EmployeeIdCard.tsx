import React from 'react';
import { Card, CardContent, CardHeader, Divider, Typography } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';

/**
 * Component to display the employee ID from Azure AD
 */
export const EmployeeIdCard = () => {
  const { entity } = useEntity();
  const employeeId = entity.metadata.annotations?.['microsoft.com/employee-id'];

  if (!employeeId) {
    return null;
  }

  return (
    <InfoCard title="Employee Information" variant="gridItem">
      <CardContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Employee ID
        </Typography>
        <Typography variant="h6" component="div">
          {employeeId}
        </Typography>
      </CardContent>
    </InfoCard>
  );
};
