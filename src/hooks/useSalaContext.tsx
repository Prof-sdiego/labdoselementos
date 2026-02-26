import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSalas } from './useSupabaseData';

interface SalaContextType {
  activeSalaId: string;
  setActiveSalaId: (id: string) => void;
  salaSelected: boolean;
}

const SalaContext = createContext<SalaContextType>({
  activeSalaId: '',
  setActiveSalaId: () => {},
  salaSelected: false,
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

  // If stored sala no longer exists, reset
  useEffect(() => {
    if (salas.length > 0 && activeSalaId && !salas.find((s: any) => s.id === activeSalaId)) {
      handleSet(salas[0].id);
    }
  }, [salas, activeSalaId]);

  return (
    <SalaContext.Provider value={{ activeSalaId, setActiveSalaId: handleSet, salaSelected }}>
      {children}
    </SalaContext.Provider>
  );
}

export function useSalaContext() {
  return useContext(SalaContext);
}
