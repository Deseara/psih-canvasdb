import axios from 'axios';
import { Table, Record, Canvas, View, CreateTableRequest, CreateRecordRequest, UpdateRecordRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tables API
export const tablesApi = {
  getAll: () => api.get<Table[]>('/api/tables'),
  getByName: (name: string) => api.get<Table>(`/api/tables/${name}`),
  create: (data: CreateTableRequest) => api.post<Table>('/api/tables', data),
};

// Records API
export const recordsApi = {
  getAll: (tableName: string) => api.get<Record[]>(`/api/t/${tableName}`),
  create: (tableName: string, data: CreateRecordRequest) => 
    api.post<Record>(`/api/t/${tableName}`, data),
  update: (tableName: string, id: number, data: UpdateRecordRequest) => 
    api.patch<Record>(`/api/t/${tableName}/${id}`, data),
  delete: (tableName: string, id: number) => 
    api.delete(`/api/t/${tableName}/${id}`),
};

// Canvas API
export const canvasApi = {
  getAll: () => api.get<Canvas[]>('/api/canvases'),
  getById: (id: number) => api.get<Canvas>(`/api/canvases/${id}`),
  create: (data: Partial<Canvas>) => api.post<Canvas>('/api/canvases', data),
  update: (id: number, data: Partial<Canvas>) => 
    api.patch<Canvas>(`/api/canvases/${id}`, data),
  execute: (canvasId: number, viewName?: string) => 
    api.post<View>('/api/canvases/execute', { canvas_id: canvasId, view_name: viewName }),
};

// Views API
export const viewsApi = {
  getAll: () => api.get<View[]>('/api/views'),
  getById: (id: number) => api.get<View>(`/api/view/${id}`),
};
