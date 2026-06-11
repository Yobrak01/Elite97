import React, { createContext, useState, useEffect } from 'react';
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

  const login = async (email, password) => {
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
  };

  const register = async (name, email, password, country, university, major, yearOfStudy, currentSemester) => {
    setLoading(true);
    try {
      const res = await api.auth.register(name, email, password, country, university, major, yearOfStudy, currentSemester);
      localStorage.setItem('elite97_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('elite97_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;

