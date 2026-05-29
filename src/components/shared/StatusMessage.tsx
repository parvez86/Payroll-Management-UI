import React, { useEffect } from 'react';

export interface StatusMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  autoHide?: boolean;
}

interface StatusMessageProps {
  message: StatusMessage;
  onDismiss: (id: string) => void;
}

const StatusMessageComponent: React.FC<StatusMessageProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    if (message.autoHide !== false) {
      const timer = setTimeout(() => {
        onDismiss(message.id);
      }, 5000); // Auto-hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message.id, message.autoHide, onDismiss]);

  const getIcon = () => {
    switch (message.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getClassName = () => {
    const baseClass = 'status-message';
    return `${baseClass} ${baseClass}--${message.type}`;
  };

  return (
    <div className={getClassName()}>
      <div className="status-message__content">
        <div className="status-message__header">
          <span className="status-message__icon">{getIcon()}</span>
          <span className="status-message__text">{message.message}</span>
          <button 
            onClick={() => onDismiss(message.id)}
            className="status-message__close"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
        {message.details && (
          <div className="status-message__details">
            {message.details}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatusMessagesContainerProps {
  messages: StatusMessage[];
  onDismiss: (id: string) => void;
}

export const StatusMessagesContainer: React.FC<StatusMessagesContainerProps> = ({ 
  messages, 
  onDismiss 
}) => {
  if (messages.length === 0) return null;

  return (
    <div className="status-messages-container">
      {messages.map(message => (
        <StatusMessageComponent 
          key={message.id} 
          message={message} 
          onDismiss={onDismiss} 
        />
      ))}
    </div>
  );
};

export default StatusMessageComponent;