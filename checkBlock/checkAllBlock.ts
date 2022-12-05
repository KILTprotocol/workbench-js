import { buildApiPromise } from './buildApiPromise'
import { checkBlock } from './checkBlock'

const BATCH_SIZE = 80

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


async function setup() {
  const api = await buildApiPromise()

  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  const finalizedHead = await api.rpc.chain.getFinalizedHead()
  const finalizedBlock = await api.rpc.chain.getBlock(finalizedHead)

  const failed = await checkRange(
    Number(process.env.START_BLOCK) || 0,
    Number(process.env.END_BLOCK) || finalizedBlock.block.header.number.toNumber(),
    BATCH_SIZE,
  )

  console.log('FAILED BLOCKS:')
  console.log(JSON.stringify(failed))

  console.log(`End fun`)

  await api.disconnect()
}

setup()
