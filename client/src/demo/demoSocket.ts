type Handler = (payload: unknown) => void;

// Minimal stand-in for a socket.io client: supports the room join/leave events the dashboards emit
// and receives broadcasts from the in-browser mock API.
export class DemoSocket {
  connected = true;
  private handlers = new Map<string, Set<Handler>>();
  private rooms = new Set<string>();

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler?: Handler) {
    if (handler) this.handlers.get(event)?.delete(handler);
    else this.handlers.delete(event);
    return this;
  }

  emit(event: string, id?: string) {
    if (event === 'join_business') this.rooms.add(`business_${id}`);
    if (event === 'leave_business') this.rooms.delete(`business_${id}`);
    if (event === 'join_customer') this.rooms.add(`customer_${id}`);
    return this;
  }

  disconnect() {
    this.connected = false;
    this.handlers.clear();
    this.rooms.clear();
    sockets.delete(this);
    return this;
  }

  deliver(room: string, event: string, payload: unknown) {
    if (!this.rooms.has(room)) return;
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

const sockets = new Set<DemoSocket>();

export const createDemoSocket = () => {
  const socket = new DemoSocket();
  sockets.add(socket);
  return socket;
};

export const emitToRoom = (room: string, event: string, payload: unknown) => {
  setTimeout(() => sockets.forEach((socket) => socket.deliver(room, event, payload)), 0);
};
