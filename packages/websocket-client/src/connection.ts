/**
 * `ConnectionManager` — owns the live `Socket` obtained from the injected `SocketFactory` and exposes
 * open / send / close. It is the only component that touches the transport; everything above it works
 * through its callbacks. No protocol logic lives here.
 */
import type { Socket, SocketFactory, SocketHandlers, WireData } from './transport';

export class ConnectionManager {
  private socket?: Socket;

  constructor(private readonly factory: SocketFactory) {}

  get connected(): boolean {
    return this.socket !== undefined;
  }
  get current(): Socket | undefined {
    return this.socket;
  }

  /** Open a socket to `url`, wiring the supplied handlers. */
  open(url: string, handlers: SocketHandlers): Socket {
    this.socket = this.factory.connect(url, handlers);
    return this.socket;
  }

  send(data: WireData): void {
    if (!this.socket) throw new Error('Cannot send: no open socket.');
    this.socket.send(data);
  }

  close(code?: number, reason?: string): void {
    this.socket?.close(code, reason);
    this.socket = undefined;
  }
}
