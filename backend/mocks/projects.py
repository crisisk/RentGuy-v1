from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class ProjectBase(BaseModel):
    name: str
    status: ProjectStatus
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[ProjectStatus] = None
    description: Optional[str] = None

class Project(ProjectBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

class TimelineEvent(BaseModel):
    id: UUID
    project_id: UUID
    event_name: str
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        orm_mode = True

projects_db: Dict[UUID, Project] = {}
timeline_db: Dict[UUID, List[TimelineEvent]] = {}

# Sample data
sample_projects = [
    Project(id=uuid4(), name="Alpha", status=ProjectStatus.ACTIVE, created_at=datetime.now()),
    Project(id=uuid4(), name="Beta", status=ProjectStatus.PLANNING, created_at=datetime.now()),
    Project(id=uuid4(), name="Gamma", status=ProjectStatus.COMPLETED, created_at=datetime.now()),
    Project(id=uuid4(), name="Delta", status=ProjectStatus.ON_HOLD, created_at=datetime.now()),
    Project(id=uuid4(), name="Epsilon", status=ProjectStatus.ACTIVE, created_at=datetime.now())
]

for p in sample_projects:
    projects_db[p.id] = p
    timeline_db[p.id] = [
        TimelineEvent(
            id=uuid4(),
            project_id=p.id,
            event_name="Created",
            timestamp=p.created_at,
            details="Project initialized"
        )
    ]

@router.get("", response_model=List[Project])
def list_projects(status: Optional[ProjectStatus] = None, name: Optional[str] = None):
    filtered = list(projects_db.values())
    if status:
        filtered = [p for p in filtered if p.status == status]
    if name:
        filtered = [p for p in filtered if name.lower() in p.name.lower()]
    return filtered

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate):
    new_project = Project(
        id=uuid4(),
        created_at=datetime.now(),
        **project.dict()
    )
    projects_db[new_project.id] = new_project
    timeline_db[new_project.id] = []
    return new_project

@router.get("/{id}", response_model=Project)
def get_project(id: UUID):
    if id not in projects_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return projects_db[id]

@router.put("/{id}", response_model=Project)
def update_project(id: UUID, project: ProjectUpdate):
    if id not in projects_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    stored = projects_db[id]
    update_data = project.dict(exclude_unset=True)
    updated = stored.copy(update=update_data)
    projects_db[id] = updated
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: UUID):
    if id not in projects_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    del projects_db[id]
    del timeline_db[id]

@router.get("/{id}/timeline", response_model=List[TimelineEvent])
def get_timeline(id: UUID):
    if id not in projects_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return timeline_db.get(id, [])
