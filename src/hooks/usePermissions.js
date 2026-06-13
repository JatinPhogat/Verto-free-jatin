import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export function useRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData?.session?.user?.email;

        if (!email) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('email', email)
          .single();

        setRole(data?.role ?? null);
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, loading };
}

export function usePermissions() {
  const { role, loading } = useRole();

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isIntern: role === 'intern',
    // Write capabilities
    canSave: role === 'admin' || role === 'manager',
    canEdit: role === 'admin' || role === 'manager',
    canDelete: role === 'admin' || role === 'manager',
    canExport: role === 'admin' || role === 'manager',
    canImport: role === 'admin' || role === 'manager',
    canApprove: role === 'admin' || role === 'manager',
    canBulkUpload: role === 'admin' || role === 'manager',
  };
}
