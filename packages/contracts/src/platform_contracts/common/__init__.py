"""platform_contracts.common — the contract kernel every module depends on."""
from __future__ import annotations

from .authority import ActorKind, ActorRef, AuthorityLevel
from .base import Command, Dto, Event, Query, Request, Response
from .envelope import ContractMeta
from .errors import ErrorCategory, ErrorContract
from .ids import ContentHash, CorrelationId, Id, VersionTag
from .patterns import Policy, RepositoryContract, ServiceContract, Specification
from .validation import ValidationContract, ValidationResult, Violation
from .versioning import SchemaVersion

__all__ = [
    "SchemaVersion",
    "Id", "VersionTag", "ContentHash", "CorrelationId",
    "AuthorityLevel", "ActorKind", "ActorRef",
    "ContractMeta",
    "Dto", "Command", "Query", "Event", "Request", "Response",
    "ErrorCategory", "ErrorContract",
    "ValidationContract", "ValidationResult", "Violation",
    "Policy", "Specification", "RepositoryContract", "ServiceContract",
]
