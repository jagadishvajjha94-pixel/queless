import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Socket connection URL pointing to backend Express server on port 5001
    const socketInstance = io('http://localhost:5001', {
      transports: ['websocket'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Connected to QueueLess Socket.IO server');
      setIsConnected(true);
      
      // If customer is logged in, subscribe to their user room immediately
      if (user) {
        socketInstance.emit('join_customer', user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Handle room subscription updates when user changes
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('join_customer', user._id);
    }
  }, [socket, isConnected, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
