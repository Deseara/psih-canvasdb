from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Table schemas
class FieldCreate(BaseModel):
    name: str
    display_name: str
    field_type: str
    options: Optional[Dict[str, Any]] = None
    required: bool = False

class FieldResponse(FieldCreate):
    id: int
    table_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TableCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    fields: List[FieldCreate] = []

class TableResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    fields: List[FieldResponse] = []
    
    class Config:
        from_attributes = True

# Record schemas
class RecordCreate(BaseModel):
    data: Dict[str, Any]

class RecordUpdate(BaseModel):
    data: Dict[str, Any]

class RecordResponse(BaseModel):
    id: int
    table_id: int
    data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Canvas schemas
class CanvasCreate(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

class CanvasUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None

class CanvasResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# View schemas
class ViewResponse(BaseModel):
    id: int
    name: str
    canvas_id: int
    data: List[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Canvas execution
class ExecuteCanvasRequest(BaseModel):
    canvas_id: int
    view_name: Optional[str] = None
