import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { typesBundle } from '@kiltprotocol/type-definitions'

export async function buildApiPromise(): Promise<ApiPromise> {
    await cryptoWaitReady()

    const api = await ApiPromise.create({
        provider: new WsProvider(process.env.WS_ADDRESS || 'ws://127.0.0.1:10144'),
        typesBundle,
    })

    return api
}
