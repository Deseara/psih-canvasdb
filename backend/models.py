from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import JSON
from database import Base

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    display_name = Column(String)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    fields = relationship("Field", back_populates="table", cascade="all, delete-orphan")
    records = relationship("Record", back_populates="table", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    name = Column(String)
    display_name = Column(String)
    field_type = Column(String)  # text, number, select, relation
    options = Column(JSON, nullable=True)  # for select options, relation config, etc.
    required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    table = relationship("Table", back_populates="fields")

class Record(Base):
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    table = relationship("Table", back_populates="records")

class Canvas(Base):
    __tablename__ = "canvases"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    nodes = Column(JSON)  # React Flow nodes
    edges = Column(JSON)  # React Flow edges
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class View(Base):
    __tablename__ = "views"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    canvas_id = Column(Integer, ForeignKey("canvases.id"))
    data = Column(JSON)  # Result data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    canvas = relationship("Canvas")
