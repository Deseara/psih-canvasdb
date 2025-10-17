from sqlalchemy.orm import Session
from models import Table, Field, Record, Canvas

def init_demo_data(db: Session):
    """Initialize demo data if not exists"""
    
    # Check if demo data already exists
    if db.query(Table).first():
        return
    
    # Create demo tables
    tables_data = [
        {
            "name": "products",
            "display_name": "Products",
            "description": "Product catalog",
            "fields": [
                {"name": "name", "display_name": "Product Name", "field_type": "text", "required": True},
                {"name": "base_sku", "display_name": "Base SKU", "field_type": "text", "required": True}
            ],
            "records": [
                {"name": "T-Shirt", "base_sku": "TSH"},
                {"name": "Jeans", "base_sku": "JNS"},
                {"name": "Sneakers", "base_sku": "SNK"}
            ]
        },
        {
            "name": "variants",
            "display_name": "Product Variants",
            "description": "Product variants with colors and sizes",
            "fields": [
                {"name": "product_id", "display_name": "Product ID", "field_type": "number", "required": True},
                {"name": "color", "display_name": "Color", "field_type": "text", "required": True},
                {"name": "size", "display_name": "Size", "field_type": "text", "required": True},
                {"name": "sku", "display_name": "SKU", "field_type": "text", "required": True},
                {"name": "price_rub", "display_name": "Price (RUB)", "field_type": "number", "required": True}
            ],
            "records": [
                {"product_id": 1, "color": "Red", "size": "M", "sku": "TSH-RED-M", "price_rub": 1500},
                {"product_id": 1, "color": "Blue", "size": "L", "sku": "TSH-BLU-L", "price_rub": 1500},
                {"product_id": 2, "color": "Black", "size": "32", "sku": "JNS-BLK-32", "price_rub": 3500},
                {"product_id": 3, "color": "White", "size": "42", "sku": "SNK-WHT-42", "price_rub": 8500}
            ]
        },
        {
            "name": "inventory",
            "display_name": "Inventory",
            "description": "Stock levels for variants",
            "fields": [
                {"name": "variant_id", "display_name": "Variant ID", "field_type": "number", "required": True},
                {"name": "stock", "display_name": "Stock", "field_type": "number", "required": True},
                {"name": "reserved", "display_name": "Reserved", "field_type": "number", "required": True},
                {"name": "available", "display_name": "Available", "field_type": "number", "required": True}
            ],
            "records": [
                {"variant_id": 1, "stock": 50, "reserved": 5, "available": 45},
                {"variant_id": 2, "stock": 30, "reserved": 0, "available": 30},
                {"variant_id": 3, "stock": 0, "reserved": 0, "available": 0},
                {"variant_id": 4, "stock": 25, "reserved": 3, "available": 22}
            ]
        },
        {
            "name": "work_orders",
            "display_name": "Work Orders",
            "description": "Manufacturing work orders",
            "fields": [
                {"name": "variant_id", "display_name": "Variant ID", "field_type": "number", "required": True},
                {"name": "qty", "display_name": "Quantity", "field_type": "number", "required": True},
                {"name": "status", "display_name": "Status", "field_type": "select", "options": {"choices": ["pending", "in_progress", "completed"]}, "required": True},
                {"name": "labor_minutes", "display_name": "Labor Minutes", "field_type": "number", "required": True}
            ],
            "records": [
                {"variant_id": 1, "qty": 20, "status": "completed", "labor_minutes": 120},
                {"variant_id": 2, "qty": 15, "status": "in_progress", "labor_minutes": 90},
                {"variant_id": 4, "qty": 10, "status": "pending", "labor_minutes": 180}
            ]
        }
    ]
    
    # Create tables and records
    for table_data in tables_data:
        # Create table
        db_table = Table(
            name=table_data["name"],
            display_name=table_data["display_name"],
            description=table_data["description"]
        )
        db.add(db_table)
        db.commit()
        db.refresh(db_table)
        
        # Create fields
        for field_data in table_data["fields"]:
            db_field = Field(
                table_id=db_table.id,
                name=field_data["name"],
                display_name=field_data["display_name"],
                field_type=field_data["field_type"],
                options=field_data.get("options"),
                required=field_data.get("required", False)
            )
            db.add(db_field)
        
        # Create records
        for record_data in table_data["records"]:
            db_record = Record(
                table_id=db_table.id,
                data=record_data
            )
            db.add(db_record)
    
    # Create demo canvas
    demo_canvas = Canvas(
        name="Demo Canvas",
        description="Inventory filter and webhook demo",
        nodes=[
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
            },
            {
                "id": "webhook-1",
                "type": "webhookNode",
                "position": {"x": 700, "y": 100},
                "data": {"webhookUrl": "https://webhook.site/unique-id", "label": "Send to Webhook"}
            }
        ],
        edges=[
            {
                "id": "e1-2",
                "source": "table-1",
                "target": "filter-1",
                "type": "smoothstep"
            },
            {
                "id": "e2-3",
                "source": "filter-1",
                "target": "webhook-1",
                "type": "smoothstep"
            }
        ]
    )
    db.add(demo_canvas)
    
    db.commit()
