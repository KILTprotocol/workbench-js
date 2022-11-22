import { ApiPromise } from '@polkadot/api'

export async function checkBlock(
    api: ApiPromise,
    blocknumber: number,
): Promise<boolean> {
    const hash = await api.rpc.chain.getBlockHash(blocknumber)
    const apiAt = await api.at(hash)

    let runtimeVersion = (
        await apiAt.query.system.lastRuntimeUpgrade()
    ).toString()

    let header = '❌'
    try {
        await api.rpc.chain.getHeader(hash)
        header = '✅'
    } catch (e) {
    }

    let block = '❌'
    try {
        await api.rpc.chain.getBlock(hash)
        block = '✅'
    } catch (e) {
    }

    let events = '❌'
    try {
        await apiAt.query.system.events()
        events = '✅'
    } catch (e) {
    }
    console.log(
        `🎁 Checking block ${blocknumber} version ${runtimeVersion} Header:${header} Block:${block} Events:${events}`,
    )

    return header === '✅' && block === '✅' && events === '✅'
}
