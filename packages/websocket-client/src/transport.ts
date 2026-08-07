/**
 * The socket transport abstraction — the single seam through which the client reaches a real
 * WebSocket. Keeping it injectable is what makes the whole foundation framework-independent and
 * deterministically testable: production wires a `ws`/browser `WebSocket` adapter satisfying
 * `SocketFactory`, while tests inject a fake. No provider protocol lives here — only open/send/close
 * and the four lifecycle callbacks.
 */

export type WireData = string | Uint8Array;

/** The callbacks the client registers with a socket. */
export interface SocketHandlers {
  onOpen(): void;
  onMessage(data: WireData): void;
  onClose(code: number, reason: string): void;
  onError(error: unknown): void;
}

/** A live socket the client can send on and close. */
export interface Socket {
  readonly url: string;
  send(data: WireData): void;
  close(code?: number, reason?: string): void;
}

/** Opens a socket to `url`, wiring the supplied handlers. Called once per connection attempt. */
export interface SocketFactory {
  connect(url: string, handlers: SocketHandlers): Socket;
}
