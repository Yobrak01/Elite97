import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('elite97_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
          
          // Sync timezone if it has changed
          const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (res.user && res.user.timezone !== localTimezone) {
            try {
              const syncRes = await api.auth.updateSettings({ timezone: localTimezone });
              setUser(syncRes.user);
            } catch (syncErr) {
              console.error('Failed to sync timezone', syncErr);
            }
          }
        } catch (err) {
          console.error('Failed to load profile', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('elite97_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, country, university, major, yearOfStudy, currentSemester) => {
    setLoading(true);
    try {
      const res = await api.auth.register(name, email, password, country, university, major, yearOfStudy, currentSemester);
      // Registration now bypasses OTP and directly returns token and user
      localStorage.setItem('elite97_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    setLoading(true);
    try {
      const res = await api.auth.verifyEmail(email, otp);
      localStorage.setItem('elite97_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('elite97_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders in consumers
  const value = useMemo(() => ({
    user, token, loading, login, register, verifyEmail, logout, updateUser
  }), [user, token, loading, login, register, verifyEmail, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
