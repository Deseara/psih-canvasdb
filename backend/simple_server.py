from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage
tables = [
    {
        "id": 1,
        "name": "products",
        "display_name": "Products",
        "description": "Product catalog",
        "fields": [
            {"id": 1, "name": "name", "display_name": "Product Name", "field_type": "text"},
            {"id": 2, "name": "base_sku", "display_name": "Base SKU", "field_type": "text"}
        ]
    },
    {
        "id": 2,
        "name": "inventory", 
        "display_name": "Inventory",
        "description": "Stock levels",
        "fields": [
            {"id": 3, "name": "variant_id", "display_name": "Variant ID", "field_type": "number"},
            {"id": 4, "name": "stock", "display_name": "Stock", "field_type": "number"},
            {"id": 5, "name": "available", "display_name": "Available", "field_type": "number"}
        ]
    }
]

records = {
    "products": [
        {"id": 1, "data": {"name": "T-Shirt", "base_sku": "TSH"}},
        {"id": 2, "data": {"name": "Jeans", "base_sku": "JNS"}}
    ],
    "inventory": [
        {"id": 1, "data": {"variant_id": 1, "stock": 50, "available": 45}},
        {"id": 2, "data": {"variant_id": 2, "stock": 30, "available": 30}}
    ]
}

canvases = [
    {
        "id": 1,
        "name": "Demo Canvas",
        "description": "Demo workflow",
        "nodes": [
            {
                "id": "table-1",
                "type": "tableNode",
                "position": {"x": 100, "y": 100},
                "data": {"tableName": "inventory", "label": "Inventory Table"}
            },
            {
                "id": "filter-1", 
                "type": "filterNode",
                "position": {"x": 400, "y": 100},
                "data": {"condition": "available > 0", "label": "Available > 0"}
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "table-1",
                "target": "filter-1"
            }
        ]
    }
]

views = []

@app.get("/api/tables")
def get_tables():
    return tables

@app.get("/api/t/{table_name}")
def get_records(table_name: str):
    return records.get(table_name, [])

@app.get("/api/canvases")
def get_canvases():
    return canvases

@app.get("/api/canvases/{canvas_id}")
def get_canvas(canvas_id: int):
    for canvas in canvases:
        if canvas["id"] == canvas_id:
            return canvas
    return {"error": "Canvas not found"}

@app.post("/api/canvases/execute")
def execute_canvas(request: dict):
    canvas_id = request.get("canvas_id")
    
    # Simple execution - just return filtered inventory
    result_data = [
        {"id": 1, "variant_id": 1, "stock": 50, "available": 45},
        {"id": 2, "variant_id": 2, "stock": 30, "available": 30}
    ]
    
    view = {
        "id": len(views) + 1,
        "name": f"View_{canvas_id}",
        "canvas_id": canvas_id,
        "data": result_data,
        "created_at": "2025-10-17T20:30:00Z"
    }
    views.append(view)
    return view

@app.get("/api/views")
def get_views():
    return views

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
