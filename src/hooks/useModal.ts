// ─── Imports
import { useCallback, useState } from 'react';

// ─── Custom useModal Hook
export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<T | null>(null);

  const openModal = useCallback((data?: T) => {
    if (data !== undefined) {
      setModalData(data);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalData(null);
  }, []);

  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
  };
}
