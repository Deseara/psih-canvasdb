export interface Field {
  id: number;
  table_id: number;
  name: string;
  display_name: string;
  field_type: 'text' | 'number' | 'select' | 'relation';
  options?: Record<string, any>;
  required: boolean;
  created_at: string;
}

export interface Table {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  fields: Field[];
}

export interface Record {
  id: number;
  table_id: number;
  data: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Canvas {
  id: number;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  created_at: string;
  updated_at?: string;
}

export interface View {
  id: number;
  name: string;
  canvas_id: number;
  data: Record<string, any>[];
  created_at: string;
}

export interface CreateTableRequest {
  name: string;
  display_name: string;
  description?: string;
  fields: Omit<Field, 'id' | 'table_id' | 'created_at'>[];
}

export interface CreateRecordRequest {
  data: Record<string, any>;
}

export interface UpdateRecordRequest {
  data: Record<string, any>;
}
