import { 
  UserTransformer,
  defaultUserTransformer,
} from '@backstage/plugin-catalog-backend-module-msgraph';

/**
 * Custom user transformer that adds employee ID as an annotation
 */
export const customUserTransformer: UserTransformer = async (user, userPhoto) => {
  // Call the default transformer first to get the base entity
  const entity = await defaultUserTransformer(user, userPhoto);
  
  if (!entity) {
    return entity;
  }
  
  // Add the employee ID annotation - prefer employeeId, fallback to onPremisesImmutableId
  const employeeId = user.employeeId || user.onPremisesImmutableId;
  
  // Debug logging
  console.log('Processing user:', user.displayName || user.userPrincipalName);
  console.log('employeeId:', user.employeeId);
  console.log('onPremisesImmutableId:', user.onPremisesImmutableId);
  console.log('Final employeeId value:', employeeId);
  
  if (employeeId) {
    entity.metadata.annotations = {
      ...entity.metadata.annotations,
      'microsoft.com/employee-id': employeeId,
    };
    console.log('Added annotation microsoft.com/employee-id:', employeeId);
  } else {
    console.log('No employee ID found for user');
  }
  
  return entity;
};
