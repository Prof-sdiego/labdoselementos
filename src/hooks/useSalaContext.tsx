import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSalas } from './useSupabaseData';

interface SalaContextType {
  activeSalaId: string;
  setActiveSalaId: (id: string) => void;
  salaSelected: boolean;
  clearSala: () => void;
}

const SalaContext = createContext<SalaContextType>({
  activeSalaId: '',
  setActiveSalaId: () => {},
  salaSelected: false,
  clearSala: () => {},
});

export function SalaProvider({ children }: { children: ReactNode }) {
  const { data: salas = [] } = useSalas();
  const [activeSalaId, setActiveSalaId] = useState('');
  const [salaSelected, setSalaSelected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('activeSalaId');
    if (stored) {
      setActiveSalaId(stored);
      setSalaSelected(true);
    }
  }, []);

  const handleSet = (id: string) => {
    setActiveSalaId(id);
    setSalaSelected(true);
    localStorage.setItem('activeSalaId', id);
  };

  const clearSala = () => {
    setActiveSalaId('');
    setSalaSelected(false);
    localStorage.removeItem('activeSalaId');
  };

  // If stored sala no longer exists, reset
  useEffect(() => {
    if (salas.length > 0 && activeSalaId && activeSalaId !== '__skip__' && !salas.find((s: any) => s.id === activeSalaId)) {
      clearSala();
    }
  }, [salas, activeSalaId]);

  return (
    <SalaContext.Provider value={{ activeSalaId, setActiveSalaId: handleSet, salaSelected, clearSala }}>
      {children}
    </SalaContext.Provider>
  );
}

export function useSalaContext() {
  return useContext(SalaContext);
}
