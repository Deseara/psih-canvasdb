from typing import List, Dict, Any
from sqlalchemy.orm import Session
import httpx
import json
from models import Table, Record

class CanvasExecutor:
    def __init__(self, db: Session):
        self.db = db
        
    def execute(self, nodes: List[Dict], edges: List[Dict]) -> List[Dict[str, Any]]:
        """Execute canvas workflow and return result data"""
        # Build execution graph
        node_map = {node['id']: node for node in nodes}
        
        # Find start nodes (nodes with no incoming edges)
        incoming_edges = {edge['target'] for edge in edges}
        start_nodes = [node for node in nodes if node['id'] not in incoming_edges]
        
        if not start_nodes:
            raise ValueError("No start nodes found in canvas")
        
        # Execute from start node
        result_data = []
        for start_node in start_nodes:
            data = self._execute_node_chain(start_node['id'], node_map, edges, {})
            if data:
                result_data.extend(data if isinstance(data, list) else [data])
        
        return result_data
    
    def _execute_node_chain(self, node_id: str, node_map: Dict, edges: List[Dict], context: Dict) -> Any:
        """Execute a chain of nodes starting from node_id"""
        node = node_map[node_id]
        node_type = node.get('type', 'default')
        
        # Execute current node
        if node_type == 'tableNode':
            data = self._execute_table_node(node)
        elif node_type == 'filterNode':
            input_data = context.get('input_data', [])
            data = self._execute_filter_node(node, input_data)
        elif node_type == 'joinNode':
            input_data = context.get('input_data', [])
            data = self._execute_join_node(node, input_data)
        elif node_type == 'webhookNode':
            input_data = context.get('input_data', [])
            data = self._execute_webhook_node(node, input_data)
        else:
            data = context.get('input_data', [])
        
        # Find next nodes
        next_edges = [edge for edge in edges if edge['source'] == node_id]
        
        if not next_edges:
            return data
        
        # Execute next nodes with current data as input
        for edge in next_edges:
            next_context = {'input_data': data}
            return self._execute_node_chain(edge['target'], node_map, edges, next_context)
        
        return data
    
    def _execute_table_node(self, node: Dict) -> List[Dict[str, Any]]:
        """Execute table node - fetch data from table"""
        table_name = node.get('data', {}).get('tableName')
        if not table_name:
            return []
        
        table = self.db.query(Table).filter(Table.name == table_name).first()
        if not table:
            return []
        
        records = self.db.query(Record).filter(Record.table_id == table.id).all()
        return [{'id': r.id, **r.data} for r in records]
    
    def _execute_filter_node(self, node: Dict, input_data: List[Dict]) -> List[Dict[str, Any]]:
        """Execute filter node - filter data based on condition"""
        condition = node.get('data', {}).get('condition', '')
        if not condition or not input_data:
            return input_data
        
        try:
            # Simple filter parsing (e.g., "stock > 0", "status = 'active'")
            filtered_data = []
            for item in input_data:
                if self._evaluate_condition(condition, item):
                    filtered_data.append(item)
            return filtered_data
        except Exception:
            return input_data
    
    def _execute_join_node(self, node: Dict, input_data: List[Dict]) -> List[Dict[str, Any]]:
        """Execute join node - join with another table"""
        join_table = node.get('data', {}).get('joinTable')
        join_field = node.get('data', {}).get('joinField')
        target_field = node.get('data', {}).get('targetField')
        
        if not all([join_table, join_field, target_field]) or not input_data:
            return input_data
        
        # Get join table data
        table = self.db.query(Table).filter(Table.name == join_table).first()
        if not table:
            return input_data
        
        join_records = self.db.query(Record).filter(Record.table_id == table.id).all()
        join_data = {r.data.get(target_field): {'id': r.id, **r.data} for r in join_records}
        
        # Perform join
        result = []
        for item in input_data:
            join_key = item.get(join_field)
            if join_key in join_data:
                joined_item = {**item, **join_data[join_key]}
                result.append(joined_item)
        
        return result
    
    def _execute_webhook_node(self, node: Dict, input_data: List[Dict]) -> List[Dict[str, Any]]:
        """Execute webhook node - send data to webhook URL"""
        webhook_url = node.get('data', {}).get('webhookUrl')
        if not webhook_url or not input_data:
            return input_data
        
        try:
            # Send POST request to webhook
            with httpx.Client() as client:
                response = client.post(
                    webhook_url,
                    json={'data': input_data},
                    headers={'Content-Type': 'application/json'},
                    timeout=10.0
                )
                
            # Return original data (webhook is side effect)
            return input_data
        except Exception:
            # If webhook fails, still return the data
            return input_data
    
    def _evaluate_condition(self, condition: str, item: Dict) -> bool:
        """Evaluate simple filter condition"""
        try:
            # Replace field names with item values
            for key, value in item.items():
                if isinstance(value, str):
                    condition = condition.replace(key, f"'{value}'")
                else:
                    condition = condition.replace(key, str(value))
            
            # Simple eval (in production, use a proper expression parser)
            return eval(condition)
        except Exception:
            return True
