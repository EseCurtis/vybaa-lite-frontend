import { http } from './http'

const API_V1 = '/api/v1'

export interface WalletData {
  realWalletEnabled: boolean
  mainWalletBalance: number
  playWalletBalance: number
}

export const walletAPI = {
  getWallet: async (): Promise<{ data: WalletData }> => {
    const response = await http.get(`${API_V1}/users/wallet`)
    return response.data
  },

  initPaystackFunding: async (amount: number): Promise<{
    msg: string
    data: { authorizationUrl: string; reference: string }
  }> => {
    const { data } = await http.post<{
      msg: string
      data: { authorizationUrl: string; reference: string }
    }>(`${API_V1}/users/wallet/paystack/initialize`, { amount })
    return data
  },

  initPolarFunding: async (): Promise<{
    msg: string
    data: { checkoutUrl: string }
  }> => {
    const { data } = await http.post<{
      msg: string
      data: { checkoutUrl: string }
    }>(`${API_V1}/users/wallet/polar/initialize`, {})
    return data
  },
}

