"""Database models for the CRM module."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class CRMLead(Base):
    __tablename__ = "crm_leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    external_id: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    deals: Mapped[list["CRMDeal"]] = relationship(back_populates="lead", cascade="all, delete-orphan")


class CRMPipeline(Base):
    __tablename__ = "crm_pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(120))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    stages: Mapped[list["CRMPipelineStage"]] = relationship(
        back_populates="pipeline",
        order_by="CRMPipelineStage.order",
        cascade="all, delete-orphan",
    )

    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_pipeline_tenant_name"),)


class CRMPipelineStage(Base):
    __tablename__ = "crm_pipeline_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("crm_pipelines.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    order: Mapped[int] = mapped_column(Integer, default=0)
    automation_flow: Mapped[str | None] = mapped_column(String(120), nullable=True)

    pipeline: Mapped[CRMPipeline] = relationship(back_populates="stages")
    deals: Mapped[list["CRMDeal"]] = relationship(back_populates="stage")

    __table_args__ = (UniqueConstraint("pipeline_id", "name", name="uq_stage_pipeline_name"),)


class CRMDeal(Base):
    __tablename__ = "crm_deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("crm_leads.id", ondelete="SET NULL"))
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("crm_pipelines.id", ondelete="RESTRICT"))
    stage_id: Mapped[int] = mapped_column(ForeignKey("crm_pipeline_stages.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(200))
    value: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(10), default="EUR")
    expected_close: Mapped[Date | None] = mapped_column(Date, nullable=True)
    probability: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    lead: Mapped[CRMLead | None] = relationship(back_populates="deals")
    stage: Mapped[CRMPipelineStage] = relationship(back_populates="deals")
    pipeline: Mapped[CRMPipeline] = relationship()
    activities: Mapped[list["CRMActivity"]] = relationship(
        back_populates="deal", cascade="all, delete-orphan", order_by="CRMActivity.occurred_at"
    )

    __table_args__ = (
        CheckConstraint("probability BETWEEN 0 AND 100", name="ck_deal_probability"),
    )


class CRMActivity(Base):
    __tablename__ = "crm_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("crm_deals.id", ondelete="CASCADE"))
    activity_type: Mapped[str] = mapped_column(String(50))
    summary: Mapped[str] = mapped_column(String(255))
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    deal: Mapped[CRMDeal] = relationship(back_populates="activities")


class CRMAutomationRun(Base):
    __tablename__ = "crm_automation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("crm_deals.id", ondelete="CASCADE"))
    trigger: Mapped[str] = mapped_column(String(120))
    workflow_id: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(50), default="queued")
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    deal: Mapped[CRMDeal] = relationship()

    __table_args__ = (
        Index("ix_crm_automation_runs_trigger", "trigger"),
    )


class CRMAcquisitionMetric(Base):
    """Blended GA4/GTM marketing metrics mapped to CRM tenants."""

    __tablename__ = "crm_acquisition_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    channel: Mapped[str | None] = mapped_column(String(120), nullable=True)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    medium: Mapped[str | None] = mapped_column(String(120), nullable=True)
    captured_date: Mapped[date] = mapped_column(Date, index=True)
    sessions: Mapped[int] = mapped_column(Integer, default=0)
    new_users: Mapped[int] = mapped_column(Integer, default=0)
    engaged_sessions: Mapped[int] = mapped_column(Integer, default=0)
    ga_conversions: Mapped[int] = mapped_column(Integer, default=0)
    ga_conversion_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    gtm_conversions: Mapped[int] = mapped_column(Integer, default=0)
    gtm_conversion_value: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    ga_property_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    gtm_container_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "channel",
            "source",
            "captured_date",
            name="uq_acquisition_tenant_channel_source_date",
        ),
        Index("ix_crm_acquisition_metrics_tenant_date", "tenant_id", "captured_date"),
    )
