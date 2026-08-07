/**
 * `MessageCodec` — encodes outgoing messages to wire data and decodes incoming wire data to typed
 * messages. The default `JsonMessageCodec` is provider-independent JSON; a provider can inject its own
 * codec without touching the client. Decode/encode failures surface as `SerializationError`.
 */
import { SerializationError } from './errors';
import type { WireData } from './transport';

export interface MessageCodec<TOut = unknown, TIn = unknown> {
  encode(message: TOut): WireData;
  decode(data: WireData): TIn;
}

function asText(data: WireData): string {
  return typeof data === 'string' ? data : new TextDecoder().decode(data);
}

/** JSON codec (the default). Encodes to a JSON string, decodes text/bytes as JSON. */
export class JsonMessageCodec<TOut = unknown, TIn = unknown> implements MessageCodec<TOut, TIn> {
  encode(message: TOut): WireData {
    try {
      return JSON.stringify(message);
    } catch (cause) {
      throw new SerializationError('Failed to encode message as JSON.', cause);
    }
  }
  decode(data: WireData): TIn {
    const text = asText(data);
    try {
      return JSON.parse(text) as TIn;
    } catch (cause) {
      throw new SerializationError('Failed to decode message as JSON.', cause);
    }
  }
}

/** Pass-through text codec (no structure) — for providers that speak plain text/binary frames. */
export class RawTextCodec implements MessageCodec<string, string> {
  encode(message: string): WireData {
    return message;
  }
  decode(data: WireData): string {
    return asText(data);
  }
}
