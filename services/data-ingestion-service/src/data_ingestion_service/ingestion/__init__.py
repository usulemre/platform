"""Ingestion — canonical models and the deterministic raw -> canonical certification pipeline."""
from __future__ import annotations

from data_ingestion_service.ingestion.model import (
    CanonicalBar,
    IngestionConfig,
    IngestionResult,
    QuarantineReason,
    QuarantineRecord,
    RawMarketRecord,
)
from data_ingestion_service.ingestion.pipeline import MarketDataIngestionPipeline

__all__ = [
    "CanonicalBar",
    "IngestionConfig",
    "IngestionResult",
    "MarketDataIngestionPipeline",
    "QuarantineReason",
    "QuarantineRecord",
    "RawMarketRecord",
]
