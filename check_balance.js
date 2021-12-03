const {
  typeBundleForPolkadot,
  types23,
} = require('@kiltprotocol/type-definitions')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const BN = require('bn.js')

const CONCURRENT_REQ = 50

async function checkBalance(api) {
  const ALICE = '4rxS3Vs1RbwYm6pAwjFoTHKMM7q5BFNLLhtosU83kZTdqpyw'

  // retrieve the balance, once-off at the latest block
  const {
    data: { free },
  } = await api.query.system.account(ALICE)

  console.log('Alice has a current balance of', free.toHuman())

  const bNumber = (
    await api.rpc.chain.getBlock(
      '0x332beb4f65eee5e77fc3dcb2d0c6d5f4cb0f258df4b3fb5eea7e86763119753f',
    )
  ).block.header.number
  let past = 0
  let prev = new BN('0', 10)
  while (true) {
    // retrieve the balance at a block hash in the past
    const num = bNumber.unwrap().subn(past)
    const prevHash = await api.rpc.chain.getBlockHash(num)
    const {
      data: { free: next },
    } = await api.query.system.account.at(prevHash, ALICE)

    if (!ext.eq(prev)) {
      console.log(
        'block',
        num.toNumber(),
        'balance change: ',
        prev.toString(),
        '->',
        next.toString(),
      )
      prev = next
    }
    past += 1
  }
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

  await checkBalance(api)

  console.log(`End fun`)

  await api.disconnect()
}

setup()
