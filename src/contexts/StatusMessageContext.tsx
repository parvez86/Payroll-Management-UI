import React, { createContext, useContext, useState, useCallback } from 'react';
import type { StatusMessage } from '../components/shared/StatusMessage';

interface StatusMessageContextType {
  messages: StatusMessage[];
  addMessage: (type: StatusMessage['type'], message: string, details?: string, autoHide?: boolean) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
}

const StatusMessageContext = createContext<StatusMessageContextType | undefined>(undefined);

export const useStatusMessages = () => {
  const context = useContext(StatusMessageContext);
  if (!context) {
    throw new Error('useStatusMessages must be used within StatusMessageProvider');
  }
  return context;
};

export const StatusMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<StatusMessage[]>([]);

  const addMessage = useCallback((
    type: StatusMessage['type'], 
    message: string, 
    details?: string,
    autoHide: boolean = true
  ) => {
    const newMessage: StatusMessage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      details,
      timestamp: new Date(),
      autoHide
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <StatusMessageContext.Provider value={{
      messages,
      addMessage,
      removeMessage,
      clearMessages
    }}>
      {children}
    </StatusMessageContext.Provider>
  );
};

export default StatusMessageContext;