# messaging — implemented in Phase 1.4

This shared library contains the Event & Messaging Foundation (the `platform_messaging` package):
the event/message/command/query models, the transport-neutral envelope, correlation & causation,
the event taxonomy and lifecycle, the event-bus and routing interfaces, and delivery/retry/dead-letter
policies. Brokers, transport, serialization, persistence, and business logic remain forbidden here.
The concrete bus (Kafka, per the TDR) plugs in behind these abstractions.
