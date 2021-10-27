const {
  typeBundleForPolkadot,
  types23,
} = require('@kiltprotocol/type-definitions')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const { cryptoWaitReady } = require('@polkadot/util-crypto')

const CONCURRENT_REQ = 50

async function countAuthoredBlocks(api) {
  const head = await api.rpc.chain.getFinalizedHead()
  let header = await api.derive.chain.getHeader(head)
  const authoredBlocks = {}
  let blockNumbers = [...Array(10000).keys()]
  blockNumbers = blockNumbers
    .map((x) => x + 70000)
    .filter((x) => x <= header.number.toNumber())

  // skip genesis block #0
  blockNumbers.shift()

  const getAuthorFn = async (blockNum) => {
    const hash = await api.rpc.chain.getBlockHash(blockNum)
    const header = await api.derive.chain.getHeader(hash)
    return {
      author: header.author.toString(),
      block: blockNum,
    }
  }

  let pendingPromises = {}
  for (num of blockNumbers.slice(0, CONCURRENT_REQ)) {
    pendingPromises[num] = getAuthorFn(num)
  }
  blockNumbers = blockNumbers.slice(CONCURRENT_REQ)

  while (Object.keys(pendingPromises).length > 0) {
    const { author, block } = await Promise.race(Object.values(pendingPromises))
    delete pendingPromises[block]

    authoredBlocks[author] = (authoredBlocks[author] | 0) + 1

    if (blockNumbers.length > 0) {
      const nextBlock = blockNumbers.shift()
      pendingPromises[nextBlock] = getAuthorFn(nextBlock)
    }

    console.log(
      'Found author:',
      author.toString(),
      'remaining blocks:',
      blockNumbers.length,
    )
  }

  console.log(`Authors: ${JSON.stringify(authoredBlocks, null, '  ')}`)
}

async function setup() {
  await cryptoWaitReady()

  const api = await ApiPromise.create({
    provider: new WsProvider('wss://spiritnet.kilt.io/'),
    typesBundle: {
      spec: {
        'mashnet-node': typeBundleForPolkadot,
        'kilt-spiritnet': typeBundleForPolkadot,
      },
    },
  })
  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  await countAuthoredBlocks(api)

  console.log(`End fun`)

  await api.disconnect()
}

setup()
