export interface CommonResponse<T> {
  success: boolean
  code: string
  message: string
  data: T | null
}
