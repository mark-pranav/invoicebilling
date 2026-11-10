import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSettings } from '../api/settings';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetchSettings();
      setSettings(res.data);
    } catch {
      setSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AppContext.Provider value={{ settings, setSettings, settingsLoading, loadSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
