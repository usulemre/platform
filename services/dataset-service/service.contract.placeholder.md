# dataset-service — Data Platform implemented in Phase 2.0

This service now contains the Data Platform canonical module (the `dataset_service` package): dataset
catalog, registry, metadata, schema, versioning, lifecycle, discovery, lineage, policies, access
control, and validation integration, plus canonical models, domain events, errors, and repository/
service interfaces. Ingestion adapters, storage engines, databases, APIs, external connectors, and
persistence remain forbidden here — they plug in behind these interfaces in later work.
