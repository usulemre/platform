"""Dataset error contracts."""
from __future__ import annotations

from enum import Enum


class DatasetErrorCode(Enum):
    NON_AS_OF_READ = "dataset.non_as_of_read"          # PIT-1
    VINTAGE_OVERWRITE = "dataset.vintage_overwrite"    # DI-3
    UNCERTIFIED_EXPOSED = "dataset.uncertified_exposed"  # DI-1
    SURVIVORSHIP_UNSAFE = "dataset.survivorship_unsafe"  # FB-7
