const { ApiPromise, WsProvider } = require('@polkadot/api')
const { BN } = require('@polkadot/util')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const { fillCollator, fillCollators } = require('./collators')
const { initAccount } = require('./utility')

require('dotenv').config()

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'ws://127.0.0.1:21011'
const provider = new WsProvider(wsAddress)
const NONCE_TRACKER = {}
const FAUCET = process.env.FAUCET

// Execute script
async function main() {
  // Create our API with a default connection to the local node
  const api = await ApiPromise.create({ provider })
  console.log(`Connected to ${wsAddress}`)
  await cryptoWaitReady()

  // Get constants
  const maxDelegatorsPerCollator = (
    await api.consts.parachainStaking.maxDelegatorsPerCollator
  ).toNumber()
  const minDelegatorStake = new BN(
    (await api.consts.parachainStaking.minDelegatorStake).toString(),
  )
  const minCollatorStake = new BN(
    (await api.consts.parachainStaking.minCollatorStake).toString(),
  )
  const numCollators = (
    await api.query.parachainStaking.counterForCandidatePool()
  ).toNumber()

  // Prep sudo
  const faucetAcc = initAccount(FAUCET)
  NONCE_TRACKER[faucetAcc.address] = (
    await api.rpc.system.accountNextIndex(faucetAcc.address)
  ).toNumber()

  console.log(`Initiating collator iteration`)

  await fillCollators({
    api,
    faucetAcc,
    minCollatorStake,
    collatorsToAdd: Math.max(70 - numCollators, 0),
    NONCE_TRACKER,
  })

  // Get active collators
  const topCandidates = (
    await api.query.parachainStaking.topCandidates()
  ).toJSON()

  const activeCollators = topCandidates.map((collator) => collator.owner)

  // Iterate all collators
  let jobs = []
  let counter = 1
  for (c of activeCollators) {
    jobs.push(
      fillCollator({
        activeCollators,
        counter,
        api,
        collator: c,
        faucetAcc,
        maxDelegatorsPerCollator,
        minDelegatorStake,
        NONCE_TRACKER
      }),
    )
    counter += 1
    if (jobs.length > 10) {
      await Promise.all(jobs)
      jobs = []
    }
  }

  console.log(`Done with filling delegator slots, disconnecting ${wsAddress}`)
}
main()
  .catch(console.error)
  .finally(() => process.exit())
