"""Domain specific exceptions for the scanning module."""


class ScanProcessingException(Exception):
    """Base exception for scanning related errors."""


class InvalidScanException(ScanProcessingException):
    """Raised when a scan violates business rules."""


class AssetNotFoundException(ScanProcessingException):
    """Raised when the requested asset cannot be located."""


class LocationValidationException(ScanProcessingException):
    """Raised when the scan location is not authorised for the user."""


__all__ = [
    "ScanProcessingException",
    "InvalidScanException",
    "AssetNotFoundException",
    "LocationValidationException",
]
