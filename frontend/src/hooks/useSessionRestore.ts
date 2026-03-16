import { useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { meApi } from "../api/index";

/**
 * On app boot, if we have a stored token, hit /auth/me to verify the session
 * is still valid and refresh the user/business/role in the store.
 * This handles the case where a user's role changes while they're logged in.
 */
export function useSessionRestore() {
  const { isAuthenticated, accessToken, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    meApi.get()
      .then(res => {
        // Merge fresh data into store (role may have changed)
        const state = useAuthStore.getState();
        setAuth({
          user: res.data.user,
          business: res.data.business,
          accessToken: state.accessToken!,
          refreshToken: state.refreshToken!,
        });
      })
      .catch(() => {
        // Token invalid — force logout
        logout();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
}
