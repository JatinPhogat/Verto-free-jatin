import { createContext, useContext } from 'react';

export const PermissionsContext = createContext({
  role: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  isEmployee: false,
  isIntern: false,
  canSave: false,
  canEdit: false,
  canDelete: false,
  canExport: false,
  canImport: false,
  canApprove: false,
  canBulkUpload: false,
});

export function usePerms() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePerms must be used within PermissionsContext.Provider');
  }
  return context;
}
