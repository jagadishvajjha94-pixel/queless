const socketIO = require('socket.io');

const socketHandler = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*', // In production, replace with specific frontend URL
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join business dashboard room
    socket.on('join_business', (businessId) => {
      socket.join(`business_${businessId}`);
      console.log(`Socket ${socket.id} joined business_${businessId}`);
    });

    // Join customer room for individual live updates
    socket.on('join_customer', (customerId) => {
      socket.join(`customer_${customerId}`);
      console.log(`Socket ${socket.id} joined customer_${customerId}`);
    });

    // Leave business room
    socket.on('leave_business', (businessId) => {
      socket.leave(`business_${businessId}`);
      console.log(`Socket ${socket.id} left business_${businessId}`);
    });

    // Leave customer room
    socket.on('leave_customer', (customerId) => {
      socket.leave(`customer_${customerId}`);
      console.log(`Socket ${socket.id} left customer_${customerId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = socketHandler;
