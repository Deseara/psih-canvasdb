from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from database import engine, get_db, Base, SessionLocal
from models import Table, Field, Record, Canvas, View
from schemas import (
    TableCreate, TableResponse, RecordCreate, RecordUpdate, RecordResponse,
    CanvasCreate, CanvasUpdate, CanvasResponse, ViewResponse, ExecuteCanvasRequest
)
from canvas_executor import CanvasExecutor

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PSIH CanvasDB", version="1.0.0")

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize demo data
@app.on_event("startup")
async def startup_event():
    from demo_data import init_demo_data
    db = SessionLocal()
    try:
        init_demo_data(db)
    except Exception as e:
        print(f"Demo data initialization error: {e}")
    finally:
        db.close()

# Tables API
@app.get("/api/tables", response_model=List[TableResponse])
def get_tables(db: Session = Depends(get_db)):
    return db.query(Table).all()

@app.post("/api/tables", response_model=TableResponse)
def create_table(table: TableCreate, db: Session = Depends(get_db)):
    # Check if table name already exists
    if db.query(Table).filter(Table.name == table.name).first():
        raise HTTPException(status_code=400, detail="Table name already exists")
    
    db_table = Table(
        name=table.name,
        display_name=table.display_name,
        description=table.description
    )
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    
    # Add fields
    for field_data in table.fields:
        db_field = Field(
            table_id=db_table.id,
            name=field_data.name,
            display_name=field_data.display_name,
            field_type=field_data.field_type,
            options=field_data.options,
            required=field_data.required
        )
        db.add(db_field)
    
    db.commit()
    db.refresh(db_table)
    return db_table

@app.get("/api/tables/{table_name}", response_model=TableResponse)
def get_table(table_name: str, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

# Records API
@app.get("/api/t/{table_name}", response_model=List[RecordResponse])
def get_records(table_name: str, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return db.query(Record).filter(Record.table_id == table.id).all()

@app.post("/api/t/{table_name}", response_model=RecordResponse)
def create_record(table_name: str, record: RecordCreate, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db_record = Record(table_id=table.id, data=record.data)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.patch("/api/t/{table_name}/{record_id}", response_model=RecordResponse)
def update_record(table_name: str, record_id: int, record: RecordUpdate, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db_record = db.query(Record).filter(Record.id == record_id, Record.table_id == table.id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db_record.data = record.data
    db.commit()
    db.refresh(db_record)
    return db_record

@app.delete("/api/t/{table_name}/{record_id}")
def delete_record(table_name: str, record_id: int, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db_record = db.query(Record).filter(Record.id == record_id, Record.table_id == table.id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted"}

# Canvas API
@app.get("/api/canvases", response_model=List[CanvasResponse])
def get_canvases(db: Session = Depends(get_db)):
    return db.query(Canvas).all()

@app.post("/api/canvases", response_model=CanvasResponse)
def create_canvas(canvas: CanvasCreate, db: Session = Depends(get_db)):
    db_canvas = Canvas(**canvas.dict())
    db.add(db_canvas)
    db.commit()
    db.refresh(db_canvas)
    return db_canvas

@app.get("/api/canvases/{canvas_id}", response_model=CanvasResponse)
def get_canvas(canvas_id: int, db: Session = Depends(get_db)):
    canvas = db.query(Canvas).filter(Canvas.id == canvas_id).first()
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return canvas

@app.patch("/api/canvases/{canvas_id}", response_model=CanvasResponse)
def update_canvas(canvas_id: int, canvas: CanvasUpdate, db: Session = Depends(get_db)):
    db_canvas = db.query(Canvas).filter(Canvas.id == canvas_id).first()
    if not db_canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    
    for field, value in canvas.dict(exclude_unset=True).items():
        setattr(db_canvas, field, value)
    
    db.commit()
    db.refresh(db_canvas)
    return db_canvas

# Canvas execution
@app.post("/api/canvases/execute", response_model=ViewResponse)
def execute_canvas(request: ExecuteCanvasRequest, db: Session = Depends(get_db)):
    canvas = db.query(Canvas).filter(Canvas.id == request.canvas_id).first()
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    
    executor = CanvasExecutor(db)
    result_data = executor.execute(canvas.nodes, canvas.edges)
    
    # Save as view
    view_name = request.view_name or f"View_{canvas.id}_{len(db.query(View).filter(View.canvas_id == canvas.id).all()) + 1}"
    db_view = View(
        name=view_name,
        canvas_id=canvas.id,
        data=result_data
    )
    db.add(db_view)
    db.commit()
    db.refresh(db_view)
    
    return db_view

# Views API
@app.get("/api/views", response_model=List[ViewResponse])
def get_views(db: Session = Depends(get_db)):
    return db.query(View).all()

@app.get("/api/view/{view_id}", response_model=ViewResponse)
def get_view(view_id: int, db: Session = Depends(get_db)):
    view = db.query(View).filter(View.id == view_id).first()
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    return view

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
