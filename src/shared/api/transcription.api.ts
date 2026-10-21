import { http } from './http'

export interface Transcript {
  text: string
  language: string | null
}

export const transcriptionAPI = {
  async create(
    audio: Blob,
    requestId: string,
    signal: AbortSignal,
  ): Promise<Transcript> {
    const response = await http.post<{ data: Transcript }>(
      '/api/v1/transcriptions',
      audio,
      {
        headers: {
          'Content-Type': audio.type,
          'x-transcription-id': requestId,
        },
        timeout: 70_000,
        signal,
      },
    )
    if (
      typeof response.data.data?.text !== 'string' ||
      !response.data.data.text.trim()
    ) {
      throw new Error('No speech was detected. Try a clearer recording.')
    }
    return response.data.data
  },
}
