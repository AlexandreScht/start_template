'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

interface WebSocketState {
  socket: WebSocket | null;
  lastMessage: MessageEvent | null;
  readyState: number;
  isConnected: boolean;
}

export function useWebSocket(options: WebSocketOptions) {
  const {
    url,
    protocols,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onOpen,
    onMessage,
    onError,
    onClose,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    lastMessage: null,
    readyState: WebSocket.CONNECTING,
    isConnected: false,
  });

  const reconnectAttemptsRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url, protocols);

      socket.onopen = event => {
        setState(prev => ({
          ...prev,
          socket,
          readyState: socket.readyState,
          isConnected: true,
        }));

        reconnectAttemptsRef.current = 0;

        // Démarrer le heartbeat
        if (heartbeatInterval > 0) {
          heartbeatRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          }, heartbeatInterval);
        }

        onOpen?.(event);
      };

      socket.onmessage = event => {
        setState(prev => ({
          ...prev,
          lastMessage: event,
        }));

        // Gérer les pongs
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            return; // Ne pas transmettre les pongs à l'utilisateur
          }
        } catch {
          // Ignorer les erreurs de parsing pour les messages non-JSON
        }

        onMessage?.(event);
      };

      socket.onerror = event => {
        console.error('WebSocket error:', event);
        onError?.(event);
      };

      socket.onclose = event => {
        setState(prev => ({
          ...prev,
          socket: null,
          readyState: WebSocket.CLOSED,
          isConnected: false,
        }));

        // Nettoyer le heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }

        onClose?.(event);

        // Tentative de reconnexion
        if (!event.wasClean && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        }
      };

      setState(prev => ({
        ...prev,
        socket,
        readyState: socket.readyState,
      }));
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, protocols, reconnectAttempts, reconnectInterval, heartbeatInterval, onOpen, onMessage, onError, onClose]);

  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.close(1000, 'Manual disconnect');
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [state.socket]);

  const sendMessage = useCallback(
    (message: string | object) => {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
        state.socket.send(messageToSend);
        return true;
      }
      return false;
    },
    [state.socket],
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  };
}
