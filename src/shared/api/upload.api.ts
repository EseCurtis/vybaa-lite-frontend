import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface UploadImageRequest {
  image: string // base64 data URL
  folder?: string
}

export interface UploadImageResponse {
  msg: string
  data: {
    url: string
    publicId: string
  }
}

export interface DeleteImageRequest {
  publicId: string
}

class UploadAPI {
  async uploadImage(data: UploadImageRequest): Promise<UploadImageResponse> {
    const { data: res } = await http.post<UploadImageResponse>(`${API_V1}/upload/image`, data)
    return res
  }

  async deleteImage(publicId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/upload/image`, {
      data: { publicId },
    })
    return res
  }
}

export const uploadAPI = new UploadAPI()
