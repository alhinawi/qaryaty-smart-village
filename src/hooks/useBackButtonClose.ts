// ─── Close an overlay with the Android / browser back button
import { useEffect, useRef } from 'react';
import { closeOverlay, openOverlay } from '@/utils/overlayHistory';

export function useBackButtonClose(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const id = openOverlay(() => onCloseRef.current());
    return () => closeOverlay(id);
  }, [isOpen]);
}
