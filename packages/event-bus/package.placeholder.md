# event-bus — implemented in Phase 3.3

This shared library contains the Event Bus (the `event_bus` package): event core, registry, publisher,
subscriber, router, dispatcher, envelope, metadata, versioning, filtering, retry, dead-letter,
lifecycle, validation, errors, and domain-event governance. Messaging technologies (Kafka/NATS/
RabbitMQ), queues, brokers, and infrastructure remain forbidden here. It builds on the Phase-1.4
messaging foundation and transports canonical domain events; the concrete bus (Kafka, per the TDR)
plugs in behind these interfaces.
