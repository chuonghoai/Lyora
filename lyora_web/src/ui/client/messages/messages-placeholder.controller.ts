import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export function useMessagesPlaceholderController() {
  const navigate = useNavigate();

  const handleBackToHome = useCallback(() => {
    navigate(ROUTES.CLIENT.ROOT);
  }, [navigate]);

  return {
    title: 'Tin nhắn',
    handleBackToHome,
  };
}

export type MessagesPlaceholderController = ReturnType<typeof useMessagesPlaceholderController>;
