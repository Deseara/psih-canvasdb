#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.parse
from http.server import BaseHTTPRequestHandler

class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.end_headers()
        
        if self.path == '/api/tables':
            response = [
                {
                    "id": 1,
                    "name": "products",
                    "display_name": "Products",
                    "description": "Product catalog",
                    "created_at": "2025-10-17T20:00:00Z",
                    "fields": [
                        {"id": 1, "table_id": 1, "name": "name", "display_name": "Product Name", "field_type": "text", "required": True, "created_at": "2025-10-17T20:00:00Z"},
                        {"id": 2, "table_id": 1, "name": "base_sku", "display_name": "Base SKU", "field_type": "text", "required": True, "created_at": "2025-10-17T20:00:00Z"}
                    ]
                },
                {
                    "id": 2,
                    "name": "inventory", 
                    "display_name": "Inventory",
                    "description": "Stock levels",
                    "created_at": "2025-10-17T20:00:00Z",
                    "fields": [
                        {"id": 3, "table_id": 2, "name": "variant_id", "display_name": "Variant ID", "field_type": "number", "required": True, "created_at": "2025-10-17T20:00:00Z"},
                        {"id": 4, "table_id": 2, "name": "stock", "display_name": "Stock", "field_type": "number", "required": True, "created_at": "2025-10-17T20:00:00Z"},
                        {"id": 5, "table_id": 2, "name": "available", "display_name": "Available", "field_type": "number", "required": True, "created_at": "2025-10-17T20:00:00Z"}
                    ]
                }
            ]
        elif self.path == '/api/t/products':
            response = [
                {"id": 1, "table_id": 1, "data": {"name": "T-Shirt", "base_sku": "TSH"}, "created_at": "2025-10-17T20:00:00Z"},
                {"id": 2, "table_id": 1, "data": {"name": "Jeans", "base_sku": "JNS"}, "created_at": "2025-10-17T20:00:00Z"}
            ]
        elif self.path == '/api/t/inventory':
            response = [
                {"id": 1, "table_id": 2, "data": {"variant_id": 1, "stock": 50, "available": 45}, "created_at": "2025-10-17T20:00:00Z"},
                {"id": 2, "table_id": 2, "data": {"variant_id": 2, "stock": 30, "available": 30}, "created_at": "2025-10-17T20:00:00Z"}
            ]
        elif self.path == '/api/canvases':
            response = [
                {
                    "id": 1,
                    "name": "Demo Canvas",
                    "description": "Demo workflow",
                    "created_at": "2025-10-17T20:00:00Z",
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
                            "target": "filter-1",
                            "type": "smoothstep"
                        }
                    ]
                }
            ]
        elif self.path == '/api/canvases/1':
            response = {
                "id": 1,
                "name": "Demo Canvas",
                "description": "Demo workflow",
                "created_at": "2025-10-17T20:00:00Z",
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
                        "target": "filter-1",
                        "type": "smoothstep"
                    }
                ]
            }
        elif self.path == '/api/views':
            response = []
        else:
            response = {"error": "Not found"}
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.end_headers()
        
        if self.path == '/api/canvases/execute':
            response = {
                "id": 1,
                "name": "Demo_View_1",
                "canvas_id": 1,
                "data": [
                    {"id": 1, "variant_id": 1, "stock": 50, "available": 45},
                    {"id": 2, "variant_id": 2, "stock": 30, "available": 30}
                ],
                "created_at": "2025-10-17T20:30:00Z"
            }
        else:
            response = {"error": "Not found"}
        
        self.wfile.write(json.dumps(response).encode())

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
        print(f"API Server running at http://localhost:{PORT}")
        httpd.serve_forever()
