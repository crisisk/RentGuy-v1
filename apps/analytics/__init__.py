"""Analytics connectors for CRM KPI dashboards."""

from .ga4 import GA4ChannelMetric, GA4Client
from .gtm import GTMClient, GTMConversionMetric
from .pipeline import CRMAnalyticsPipeline

__all__ = [
    "GA4ChannelMetric",
    "GA4Client",
    "GTMClient",
    "GTMConversionMetric",
    "CRMAnalyticsPipeline",
]
