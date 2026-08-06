"""Delivery Policy — delivery guarantee and ordering as immutable policy data (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DeliveryGuarantee(Enum):
    AT_MOST_ONCE = "at_most_once"
    AT_LEAST_ONCE = "at_least_once"
    EXACTLY_ONCE = "exactly_once"


class Ordering(Enum):
    NONE = "none"
    PARTITION = "partition"
    GLOBAL = "global"


@dataclass(frozen=True, slots=True)
class DeliveryPolicy:
    """The delivery guarantee and ordering a topic/consumer requires."""

    guarantee: DeliveryGuarantee
    ordering: Ordering
