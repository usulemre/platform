# storage — implemented in Phase 3.2

This shared library contains the Storage Layer (the `platform_storage` package): storage core,
providers, lifecycle, repository abstractions, object/metadata/artifact/dataset/snapshot storage
abstractions, backup, archive management, retention policies, storage policies, storage validation,
and the error model. Databases, SQL, object storage, persistence, and infrastructure remain forbidden
here. Concrete storage backends (PostgreSQL, Iceberg, ArcticDB, S3-compatible object storage, per the
TDR) plug in behind these canonical interfaces.
