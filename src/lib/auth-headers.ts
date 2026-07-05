import { useAuthStore } from '@/store/auth'

export async function getBearerHeaders(
  extra?: Record<string, string>
): Promise<Record<string, string>> {
  const token = await useAuthStore.getState().refreshToken()
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
