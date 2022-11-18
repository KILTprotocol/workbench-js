import { typesBundle } from './typeBundle'

import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'

async function checkBlock(api: ApiPromise, blocknumber: number) {
  console.group()
  const hash = await api.rpc.chain.getBlockHash(blocknumber)
  const apiAt = await api.at(hash)

  console.log(
    `🎁 Checking block ${blocknumber} ${(
      await apiAt.query.system.lastRuntimeUpgrade()
    ).toString()}`,
  )

  console.log('block hash:', hash.toHex())

  try {
    await api.rpc.chain.getHeader(hash)
    console.log('✅ Header ok')
  } catch (e) {
    console.log('❌ Header not ok')
    console.log(e)
  }

  try {
    await api.rpc.chain.getBlock(hash)
    console.log('✅ Block ok')
  } catch (e) {
    console.log('❌ Block not ok')
    console.log(e)
  }

  try {
    await apiAt.query.system.events()
    console.log('✅ Events ok')
  } catch (e) {
    console.log('❌ Events not ok')
    console.log(e)
  }
  console.groupEnd()
  console.log('\n\n')
}

async function setup() {
  await cryptoWaitReady()

  const api = await ApiPromise.create({
    provider: new WsProvider('wss://spiritnet.kilt.io/'),
    typesBundle,
  })

  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  await checkBlock(api, 156)
  await checkBlock(api, 67016)
  await checkBlock(api, 67332)
  await checkBlock(api, 67373)
  await checkBlock(api, 73929)
  await checkBlock(api, 74507)
  await checkBlock(api, 80942)
  await checkBlock(api, 2241767)

  console.log(`End fun`)

  await api.disconnect()
}

setup()
