#!/usr/bin/env python3
import http.server
import socketserver
import json
import sqlite3
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import traceback

# Initialize SQLite database
DB_FILE = 'psih_canvasdb.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Enable foreign keys
    c.execute("PRAGMA foreign_keys = ON")
    
    # Tables table
    c.execute('''CREATE TABLE IF NOT EXISTS tables
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  display_name TEXT NOT NULL,
                  description TEXT,
                  icon TEXT DEFAULT 'table',
                  color TEXT DEFAULT '#3b82f6',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Fields table
    c.execute('''CREATE TABLE IF NOT EXISTS fields
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  table_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  display_name TEXT NOT NULL,
                  field_type TEXT NOT NULL,
                  required BOOLEAN DEFAULT 0,
                  default_value TEXT,
                  options TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE)''')
    
    # Records table
    c.execute('''CREATE TABLE IF NOT EXISTS records
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  table_id INTEGER NOT NULL,
                  data TEXT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE)''')
    
    # Canvases table
    c.execute('''CREATE TABLE IF NOT EXISTS canvases
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT,
                  nodes TEXT,
                  edges TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Views table
    c.execute('''CREATE TABLE IF NOT EXISTS views
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  canvas_id INTEGER,
                  data TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE)''')
    
    conn.commit()
    
    # Insert demo data if tables are empty
    c.execute('SELECT COUNT(*) FROM tables')
    if c.fetchone()[0] == 0:
        # Insert demo tables
        c.execute("INSERT INTO tables (name, display_name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
                  ('products', 'Products', 'Product catalog', 'package', '#10b981'))
        products_id = c.lastrowid
        
        c.execute("INSERT INTO tables (name, display_name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
                  ('inventory', 'Inventory', 'Stock levels', 'archive', '#f59e0b'))
        inventory_id = c.lastrowid
        
        c.execute("INSERT INTO tables (name, display_name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
                  ('customers', 'Customers', 'Customer database', 'users', '#8b5cf6'))
        customers_id = c.lastrowid
        
        # Insert fields for products
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (products_id, 'name', 'Product Name', 'text', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (products_id, 'base_sku', 'Base SKU', 'text', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (products_id, 'price', 'Price', 'number', 1))
        
        # Insert fields for inventory
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (inventory_id, 'variant_id', 'Variant ID', 'number', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (inventory_id, 'stock', 'Stock', 'number', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (inventory_id, 'available', 'Available', 'number', 1))
        
        # Insert fields for customers
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (customers_id, 'name', 'Full Name', 'text', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (customers_id, 'email', 'Email', 'text', 1))
        c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required) VALUES (?, ?, ?, ?, ?)",
                  (customers_id, 'phone', 'Phone', 'text', 0))
        
        # Insert demo records
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (products_id, json.dumps({"name": "T-Shirt", "base_sku": "TSH", "price": 29.99})))
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (products_id, json.dumps({"name": "Jeans", "base_sku": "JNS", "price": 79.99})))
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (products_id, json.dumps({"name": "Sneakers", "base_sku": "SNK", "price": 99.99})))
        
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (inventory_id, json.dumps({"variant_id": 1, "stock": 50, "available": 45})))
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (inventory_id, json.dumps({"variant_id": 2, "stock": 30, "available": 30})))
        
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (customers_id, json.dumps({"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"})))
        c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                  (customers_id, json.dumps({"name": "Jane Smith", "email": "jane@example.com", "phone": "+0987654321"})))
        
        # Insert demo canvas
        nodes = json.dumps([
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
                "data": {"url": "https://api.example.com/notify", "label": "Send Notification"}
            }
        ])
        edges = json.dumps([
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
        ])
        c.execute("INSERT INTO canvases (name, description, nodes, edges) VALUES (?, ?, ?, ?)",
                  ('Demo Workflow', 'Example inventory notification workflow', nodes, edges))
        
        conn.commit()
        print("✅ Demo data initialized")
    
    conn.close()

class APIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Custom logging
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}")
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            parsed_path = urlparse(self.path)
            path = parsed_path.path
            
            if path == '/api/tables':
                c.execute('SELECT * FROM tables ORDER BY created_at DESC')
                tables = []
                for table in c.fetchall():
                    c.execute('SELECT * FROM fields WHERE table_id = ? ORDER BY id', (table['id'],))
                    fields = [dict(row) for row in c.fetchall()]
                    
                    # Get record count
                    c.execute('SELECT COUNT(*) as count FROM records WHERE table_id = ?', (table['id'],))
                    record_count = c.fetchone()['count']
                    
                    tables.append({
                        'id': table['id'],
                        'name': table['name'],
                        'display_name': table['display_name'],
                        'description': table['description'],
                        'icon': table['icon'],
                        'color': table['color'],
                        'created_at': table['created_at'],
                        'updated_at': table['updated_at'],
                        'fields': fields,
                        'record_count': record_count
                    })
                response = tables
                
            elif path.startswith('/api/t/'):
                table_name = unquote(path.split('/')[-1])
                c.execute('SELECT id FROM tables WHERE name = ?', (table_name,))
                table = c.fetchone()
                if table:
                    c.execute('SELECT * FROM records WHERE table_id = ? ORDER BY created_at DESC', (table['id'],))
                    records = []
                    for record in c.fetchall():
                        records.append({
                            'id': record['id'],
                            'table_id': record['table_id'],
                            'data': json.loads(record['data']),
                            'created_at': record['created_at'],
                            'updated_at': record['updated_at']
                        })
                    response = records
                else:
                    response = []
                    
            elif path == '/api/canvases':
                c.execute('SELECT * FROM canvases ORDER BY created_at DESC')
                canvases = []
                for canvas in c.fetchall():
                    canvases.append({
                        'id': canvas['id'],
                        'name': canvas['name'],
                        'description': canvas['description'],
                        'nodes': json.loads(canvas['nodes']) if canvas['nodes'] else [],
                        'edges': json.loads(canvas['edges']) if canvas['edges'] else [],
                        'created_at': canvas['created_at'],
                        'updated_at': canvas['updated_at']
                    })
                response = canvases
                
            elif path.startswith('/api/canvases/') and path != '/api/canvases/execute':
                canvas_id = int(path.split('/')[-1])
                c.execute('SELECT * FROM canvases WHERE id = ?', (canvas_id,))
                canvas = c.fetchone()
                if canvas:
                    response = {
                        'id': canvas['id'],
                        'name': canvas['name'],
                        'description': canvas['description'],
                        'nodes': json.loads(canvas['nodes']) if canvas['nodes'] else [],
                        'edges': json.loads(canvas['edges']) if canvas['edges'] else [],
                        'created_at': canvas['created_at'],
                        'updated_at': canvas['updated_at']
                    }
                else:
                    response = {"error": "Canvas not found"}
                    
            elif path == '/api/views':
                c.execute('SELECT * FROM views ORDER BY created_at DESC')
                views = []
                for view in c.fetchall():
                    views.append({
                        'id': view['id'],
                        'name': view['name'],
                        'canvas_id': view['canvas_id'],
                        'data': json.loads(view['data']) if view['data'] else [],
                        'created_at': view['created_at']
                    })
                response = views
                
            elif path == '/api/stats':
                # New endpoint for dashboard stats
                c.execute('SELECT COUNT(*) as count FROM tables')
                table_count = c.fetchone()['count']
                c.execute('SELECT COUNT(*) as count FROM records')
                record_count = c.fetchone()['count']
                c.execute('SELECT COUNT(*) as count FROM canvases')
                canvas_count = c.fetchone()['count']
                c.execute('SELECT COUNT(*) as count FROM views')
                view_count = c.fetchone()['count']
                
                response = {
                    'tables': table_count,
                    'records': record_count,
                    'canvases': canvas_count,
                    'views': view_count
                }
            else:
                response = {"error": "Not found"}
            
            self.wfile.write(json.dumps(response, default=str).encode())
            
        except Exception as e:
            print(f"GET Error: {e}")
            traceback.print_exc()
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
        finally:
            conn.close()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        data = json.loads(body) if body else {}
        
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if self.path == '/api/tables':
                # Create new table
                c.execute("INSERT INTO tables (name, display_name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
                          (data.get('name'), data.get('display_name'), 
                           data.get('description', ''), 
                           data.get('icon', 'table'),
                           data.get('color', '#3b82f6')))
                table_id = c.lastrowid
                
                # Insert fields
                fields = data.get('fields', [])
                created_fields = []
                for field in fields:
                    c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required, default_value, options) VALUES (?, ?, ?, ?, ?, ?, ?)",
                              (table_id, field.get('name'), field.get('display_name'), 
                               field.get('field_type'), field.get('required', False),
                               field.get('default_value'), json.dumps(field.get('options')) if field.get('options') else None))
                    field_id = c.lastrowid
                    created_fields.append({
                        'id': field_id,
                        'table_id': table_id,
                        'name': field.get('name'),
                        'display_name': field.get('display_name'),
                        'field_type': field.get('field_type'),
                        'required': field.get('required', False)
                    })
                
                conn.commit()
                
                response = {
                    'id': table_id,
                    'name': data.get('name'),
                    'display_name': data.get('display_name'),
                    'description': data.get('description', ''),
                    'icon': data.get('icon', 'table'),
                    'color': data.get('color', '#3b82f6'),
                    'fields': created_fields,
                    'created_at': datetime.now().isoformat()
                }
                
            elif self.path.startswith('/api/t/') and '/records' not in self.path:
                # Create new record
                table_name = unquote(self.path.split('/')[-1])
                c.execute('SELECT id FROM tables WHERE name = ?', (table_name,))
                table = c.fetchone()
                if table:
                    c.execute("INSERT INTO records (table_id, data) VALUES (?, ?)",
                              (table[0], json.dumps(data.get('data', {}))))
                    record_id = c.lastrowid
                    conn.commit()
                    response = {
                        'id': record_id,
                        'table_id': table[0],
                        'data': data.get('data', {}),
                        'created_at': datetime.now().isoformat()
                    }
                else:
                    response = {"error": "Table not found"}
                    
            elif self.path == '/api/canvases':
                # Create new canvas
                c.execute("INSERT INTO canvases (name, description, nodes, edges) VALUES (?, ?, ?, ?)",
                          (data.get('name'), data.get('description', ''),
                           json.dumps(data.get('nodes', [])), json.dumps(data.get('edges', []))))
                canvas_id = c.lastrowid
                conn.commit()
                response = {
                    'id': canvas_id,
                    'name': data.get('name'),
                    'description': data.get('description', ''),
                    'nodes': data.get('nodes', []),
                    'edges': data.get('edges', []),
                    'created_at': datetime.now().isoformat()
                }
                
            elif self.path.startswith('/api/tables/') and '/fields' in self.path:
                # Add field to table
                table_id = int(self.path.split('/')[3])
                
                # Prepare options - include relation_table if it's a relation field
                options = data.get('options')
                if data.get('field_type') == 'relation' and data.get('relation_table'):
                    options = {'relation_table': data.get('relation_table')}
                
                c.execute("INSERT INTO fields (table_id, name, display_name, field_type, required, default_value, options) VALUES (?, ?, ?, ?, ?, ?, ?)",
                          (table_id, data.get('name'), data.get('display_name'), 
                           data.get('field_type', 'text'), data.get('required', False),
                           data.get('default_value'), json.dumps(options) if options else None))
                field_id = c.lastrowid
                conn.commit()
                response = {
                    'id': field_id,
                    'table_id': table_id,
                    'name': data.get('name'),
                    'display_name': data.get('display_name'),
                    'field_type': data.get('field_type', 'text'),
                    'required': data.get('required', False),
                    'relation_table': data.get('relation_table'),
                    'created_at': datetime.now().isoformat()
                }
                
            elif self.path == '/api/canvases/execute':
                canvas_id = data.get('canvas_id')
                # Simple execution - just save as view
                result_data = [
                    {"id": 1, "variant_id": 1, "stock": 50, "available": 45},
                    {"id": 2, "variant_id": 2, "stock": 30, "available": 30}
                ]
                c.execute("INSERT INTO views (name, canvas_id, data) VALUES (?, ?, ?)",
                          (f"Execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}", 
                           canvas_id,
                           json.dumps(result_data)))
                view_id = c.lastrowid
                conn.commit()
                response = {
                    'id': view_id,
                    'name': f"View_{canvas_id}",
                    'canvas_id': canvas_id,
                    'data': result_data,
                    'created_at': datetime.now().isoformat()
                }
            else:
                response = {"error": "Not found"}
            
            self.wfile.write(json.dumps(response, default=str).encode())
            
        except sqlite3.IntegrityError as e:
            print(f"Integrity Error: {e}")
            response = {"error": "A table with this name already exists"}
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            print(f"POST Error: {e}")
            traceback.print_exc()
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
        finally:
            conn.close()
    
    def do_DELETE(self):
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        c = conn.cursor()
        
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if self.path.startswith('/api/tables/'):
                table_id = int(self.path.split('/')[-1])
                c.execute("DELETE FROM tables WHERE id = ?", (table_id,))
                conn.commit()
                response = {"success": True, "message": "Table deleted"}
                
            elif '/records/' in self.path:
                parts = self.path.split('/')
                table_name = unquote(parts[3])
                record_id = int(parts[5])
                c.execute('SELECT id FROM tables WHERE name = ?', (table_name,))
                table = c.fetchone()
                if table:
                    c.execute("DELETE FROM records WHERE id = ? AND table_id = ?", (record_id, table[0]))
                    conn.commit()
                    response = {"success": True, "message": "Record deleted"}
                else:
                    response = {"error": "Table not found"}
                    
            elif self.path.startswith('/api/fields/'):
                field_id = int(self.path.split('/')[-1])
                c.execute("DELETE FROM fields WHERE id = ?", (field_id,))
                conn.commit()
                response = {"success": True, "message": "Field deleted"}
                
            elif self.path.startswith('/api/canvases/'):
                canvas_id = int(self.path.split('/')[-1])
                c.execute("DELETE FROM canvases WHERE id = ?", (canvas_id,))
                conn.commit()
                response = {"success": True, "message": "Canvas deleted"}
                
            else:
                response = {"error": "Not found"}
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"DELETE Error: {e}")
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
        finally:
            conn.close()
    
    def do_PATCH(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        data = json.loads(body) if body else {}
        
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        c = conn.cursor()
        
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if self.path.startswith('/api/canvases/') and self.path.endswith('/save'):
                canvas_id = int(self.path.split('/')[-2])
                c.execute("UPDATE canvases SET nodes = ?, edges = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                          (json.dumps(data.get('nodes', [])), json.dumps(data.get('edges', [])), canvas_id))
                conn.commit()
                response = {"success": True, "message": "Canvas saved"}
                
            elif self.path.startswith('/api/fields/'):
                field_id = int(self.path.split('/')[-1])
                c.execute("UPDATE fields SET display_name = ? WHERE id = ?",
                          (data.get('display_name'), field_id))
                conn.commit()
                response = {"success": True, "message": "Field updated"}
                
            elif '/records/' in self.path:
                parts = self.path.split('/')
                table_name = unquote(parts[3])
                record_id = int(parts[5])
                c.execute('SELECT id FROM tables WHERE name = ?', (table_name,))
                table = c.fetchone()
                if table:
                    c.execute("UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND table_id = ?",
                              (json.dumps(data.get('data', {})), record_id, table[0]))
                    conn.commit()
                    response = {"success": True, "message": "Record updated"}
                else:
                    response = {"error": "Table not found"}
                    
            else:
                response = {"error": "Not found"}
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"PATCH Error: {e}")
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
        finally:
            conn.close()

if __name__ == "__main__":
    init_db()
    PORT = 8000
    
    # Allow socket reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
        print(f"🚀 Advanced API Server with SQLite DB")
        print(f"✅ Running at http://localhost:{PORT}")
        print(f"📁 Database: {os.path.abspath(DB_FILE)}")
        print(f"📊 Features: Full CRUD, Stats, Canvas Execution")
        print(f"🎨 Demo data with 3 tables and sample records")
        httpd.serve_forever()
