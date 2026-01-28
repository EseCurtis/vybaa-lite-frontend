import { http } from '@/shared/api/http'
import type {
  CreateTaskRequest,
  TaskResponse,
  TasksResponse,
  UpdateTaskRequest,
} from '@/shared/types/auth.types'

class TaskAPI {
  private base = '/api/v1/tasks'

  async getTasks(): Promise<TasksResponse> {
    const { data } = await http.get<TasksResponse>(this.base)
    return data
  }

  async getTasksPage(page = 1, limit = 10, params?: { status?: 'ALL' | 'COMPLETED' | 'SKIPPED'; sort?: 'created_desc' | 'created_asc' }): Promise<{ msg: string; data: { tasks: any[]; meta: { total: number; page: number; pageSize: number; hasNext: boolean } } }> {
    const query = new URLSearchParams({ page: String(Number(page)), limit: String(limit) })
    if (params?.status) query.set('status', params.status)
    if (params?.sort) query.set('sort', params.sort)
    const { data } = await http.get(`${this.base}?${query.toString()}`)
    return data as any
  }

  async createTask(payload: CreateTaskRequest): Promise<TaskResponse> {
    const { data } = await http.post<TaskResponse>(this.base, payload)
    return data
  }

  async updateTask(taskId: string, payload: UpdateTaskRequest): Promise<TaskResponse> {
    const { data } = await http.put<TaskResponse>(`${this.base}/${taskId}`, payload)
    return data
  }

  async deleteTask(taskId: string): Promise<{ msg: string }> {
    const { data } = await http.delete<{ msg: string }>(`${this.base}/${taskId}`)
    return data
  }

  async getTaskById(taskId: string): Promise<TaskResponse> {
    const { data } = await http.get<TaskResponse>(`${this.base}/${taskId}`)
    return data
  }
}

export const taskAPI = new TaskAPI()
