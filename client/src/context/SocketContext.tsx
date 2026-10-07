import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { DEMO_MODE, SOCKET_URL } from '../config';
import { createDemoSocket } from '../demo/demoSocket';

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
    if (DEMO_MODE) {
      const demoSocket = createDemoSocket();
      if (user) demoSocket.emit('join_customer', user._id);
      setSocket(demoSocket as unknown as Socket);
      setIsConnected(true);
      return () => {
        demoSocket.disconnect();
      };
    }

    const socketInstance = io(SOCKET_URL, {
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
