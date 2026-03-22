import { useToast } from '@/providers/toast.provider'
import { walletAPI } from '@/shared/api/wallet.api'
import { useQuery } from '@tanstack/react-query'

export const walletQueryKeys = {
  all: ['wallet'] as const,
  detail: () => [...walletQueryKeys.all, 'detail'] as const,
}

export function useWallet() {
  const toast = useToast()
  return useQuery({
    queryKey: walletQueryKeys.detail(),
    queryFn: async () => {
      const response = await walletAPI.getWallet()
      return response.data
    },
    staleTime: 1000 * 30, // 30s (balances can change)
    onError: (error: any) => {
      const message =
        error?.response?.data?.msg || error?.message || 'Failed to load wallet'
      toast.error(message)
    },
  })
}

