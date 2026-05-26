import { useCallback } from 'react';

export const useToast = () => {
  const show = useCallback((message, type = 'success') => {
    const event = new CustomEvent('toast', {
      detail: { message, type, id: Date.now() + Math.random() }
    });
    window.dispatchEvent(event);
  }, []);

  return {
    success: useCallback((msg) => show(msg, 'success'), [show]),
    error: useCallback((msg) => show(msg, 'error'), [show]),
    info: useCallback((msg) => show(msg, 'info'), [show]),
  };
};
