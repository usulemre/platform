"""Dataset bounded context — certified, point-in-time, provenance-bearing data."""
from __future__ import annotations

from .contracts import AsOfGateway, CertificationService, DatasetRepository, VintageRepository
from .errors import NonAsOfRead, SurvivorshipUnsafe, UncertifiedDataExposed, VintageOverwrite
from .events import DatasetRegistered, DatasetValidated, VintageRecorded
from .model import (
    CertificationStatus,
    DataQualityReport,
    Dataset,
    Symbology,
    UniverseSnapshot,
    Vintage,
)

__all__ = [
    "CertificationStatus", "DataQualityReport", "Symbology", "UniverseSnapshot",
    "Dataset", "Vintage",
    "DatasetRegistered", "DatasetValidated", "VintageRecorded",
    "DatasetRepository", "VintageRepository", "AsOfGateway", "CertificationService",
    "NonAsOfRead", "VintageOverwrite", "UncertifiedDataExposed", "SurvivorshipUnsafe",
]
