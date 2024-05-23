export const MAINNET_RPC =
  process.env.NEXT_PUBLIC_MAINNET_RPC ||
  process.env.MAINNET_RPC ||
  'https://rpc.hellomoon.io/5f69f5ca-9fe9-4516-a31e-4b1668864b3a'

export const DEVNET_RPC =
  process.env.NEXT_PUBLIC_DEVNET_RPC ||
  process.env.DEVNET_RPC ||
  'https://mango.devnet.rpcpool.com'


export const BASE_API_URL =
    process.env.NEXT_BASE_API_URL ||
    process.env.BASE_API_URL ||
    'https://gateway.socialconnector.io/api/v2'
