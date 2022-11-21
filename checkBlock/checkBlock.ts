import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { typesBundle } from '@kiltprotocol/type-definitions'

const BATCH_SIZE = 80

async function checkBlock(
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
  } catch (e) {}

  let block = '❌'
  try {
    await api.rpc.chain.getBlock(hash)
    block = '✅'
  } catch (e) {}

  let events = '❌'
  try {
    await apiAt.query.system.events()
    events = '✅'
  } catch (e) {}
  console.log(
    `🎁 Checking block ${blocknumber} version ${runtimeVersion} Header:${header} Block:${block} Events:${events}`,
  )

  return header === '✅' && block === '✅' && events === '✅'
}

async function checkRange(
  startingBlock: number,
  endBlock: number,
  batchSize: number,
): Promise<Array<number>> {
  console.log(`Checking from ${startingBlock} to ${endBlock}`)
  const promised: Array<Promise<void>> = []
  const failed: Array<number> = []

  let lastCheckedBlock = startingBlock
  for (let workerI = 0; workerI < batchSize; workerI += 1) {
    promised.push(
      (async () => {
        const api = await buildApiPromise()

        while (lastCheckedBlock < endBlock) {
          const checkThis = lastCheckedBlock + 1
          lastCheckedBlock = checkThis

          if (!(await checkBlock(api, checkThis))) {
            failed.push(checkThis)
          }
        }
      })(),
    )
  }

  console.log('started workers', promised.length)
  try {
    await Promise.all(promised)
  } catch (e) {
    console.log('💀 Error while checking blocks 💀')
  }

  return failed
}

async function buildApiPromise(): Promise<ApiPromise> {
  await cryptoWaitReady()

  const api = await ApiPromise.create({
    provider: new WsProvider('ws://127.0.0.1:10144'),
    typesBundle,
  })

  return api
}

async function setup() {
  const api = await buildApiPromise()

  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  const finalizedHead = await api.rpc.chain.getFinalizedHead()
  const finalizedBlock = await api.rpc.chain.getBlock(finalizedHead)

  const failed = await checkRange(
    process.env.START_BLOCK || 21621,
    finalizedBlock.block.header.number.toNumber(),
    BATCH_SIZE,
  )

  console.log('FAILED BLOCKS:')
  console.log(JSON.stringify(failed))

  console.log(`End fun`)

  await api.disconnect()
}

setup()
