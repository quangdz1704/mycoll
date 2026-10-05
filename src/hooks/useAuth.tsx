import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { isAdmin } from '../services/auth.service';

interface AuthState { session: Session | null; loading: boolean; admin: boolean; error: boolean; retry: () => void }
const AuthContext = createContext<AuthState>({ session: null, loading: true, admin: false, error: false, retry: () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [sessionError, setSessionError] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const client = useQueryClient();
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      authEventReceived = true;
      if (live) { setSession(next); setReady(true); setSessionError(false); }
      if (live && ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) setAuthVersion(version => version + 1);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (live && !authEventReceived) { setSession(data.session); setSessionError(!!error); setReady(true); }
    }).catch(() => { if (live) { setSessionError(true); setReady(true); } });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    client.removeQueries({ predicate: query => query.queryKey[0] === 'admin' });
    void client.resetQueries({ queryKey: ['public'] });
  }, [session?.user.id, client]);
  const check = useQuery({ queryKey: ['authorization', session?.user.id, authVersion], queryFn: isAdmin, enabled: !!session, staleTime: 60000, retry: 1 });
  const value = { session, loading: !ready || (!!session && check.isPending), admin: !!session && check.data === true,
    error: sessionError || (!!session && check.isError), retry: () => { void check.refetch(); } };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
