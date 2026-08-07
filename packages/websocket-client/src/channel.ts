/**
 * `ChannelRegistry` — the catalog of channels/topics the client knows about (topic management). It is
 * provider-independent: a channel is just a topic string with optional params and metadata. Providers
 * register their channels here; the subscription and routing layers reference them by topic.
 */
export interface Channel {
  readonly topic: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
}

export class ChannelRegistry {
  private readonly channels = new Map<string, Channel>();

  register(
    topic: string,
    params: Readonly<Record<string, unknown>> | undefined,
    now: number,
  ): Channel {
    const channel: Channel = { topic, params, createdAt: now };
    this.channels.set(topic, channel);
    return channel;
  }
  unregister(topic: string): boolean {
    return this.channels.delete(topic);
  }
  has(topic: string): boolean {
    return this.channels.has(topic);
  }
  get(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }
  topics(): readonly string[] {
    return [...this.channels.keys()];
  }
  list(): readonly Channel[] {
    return [...this.channels.values()];
  }
  get size(): number {
    return this.channels.size;
  }
}
