const { ApiPromise, WsProvider } = require('@polkadot/api')
const { BN } = require('@polkadot/util')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const { fillCollator, fillCollators, removeCollators, deriveCollatorSeed } = require('./collators')
const { initAccount } = require('./utility')

require('dotenv').config()

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'ws://127.0.0.1:21011'
const provider = new WsProvider(wsAddress)
const NONCE_TRACKER = {}
const FAUCET = process.env.FAUCET
const ACTION = process.env.ACTION.toLowerCase()
const MAX_COLLATORS = 70


const invulnerables = [
  // Alice
  '4siJtc4dYq2gPre8Xj6KJcSjVAdi1gmjctUzjf3AwrtNnhvy',
  // Bob
  '4r99cXtVR72nEr9d6o8NZGXmPKcpZ9NQ84LfgHuVssy91nKb',
  // Staging
  '4tM26aDurqKAJDdJ1HrbeNGhhiCCPLR5h3mPnU2pxyc4hSGh',
  '4rp4rcDHP71YrBNvDhcH5iRoM3YzVoQVnCZvQPwPom9bjo2e',
  // Peregrine,
  '4rDeMGr3Hi4NfxRUp8qVyhvgW3BSUBLneQisGa9ASkhh2sXB',
  '4smcAoiTiCLaNrGhrAM4wZvt5cMKEGm8f3Cu9aFrpsh5EiNV',
  '4puhLDGmzA3HHYZ8msnpfwrg2n22pSBEujq6Kzi7f9cSYKpx',
]

async function fill({ api, faucetAcc, minCollatorStake, collatorsToAdd, NONCE_TRACKER, maxDelegatorsPerCollator, minDelegatorStake }) {
  // Get active collators
  const topCandidates = (
    await api.query.parachainStaking.topCandidates()
  ).toJSON()

  const activeCollators = topCandidates.map((collator) => collator.owner)

  await fillCollators({
    api,
    faucetAcc,
    minCollatorStake,
    collatorsToAdd,
    NONCE_TRACKER,
    baseSeed: FAUCET
  })

  // Iterate all collators
  console.log(`Initiating collator iteration`)
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
        baseSeed: FAUCET,
        NONCE_TRACKER
      }),
    )
    counter += 1
    if (jobs.length > 10) {
      await Promise.all(jobs)
      jobs = []
    }
  }

  console.log(`Done with filling delegator slots.`)
}

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

  // Execute specified action
  if (ACTION == 'up') {
    console.log('Filling collators and delegators')
    const collatorsToAdd = Math.max(MAX_COLLATORS - numCollators, 0);
    await fill({ api, collatorsToAdd, faucetAcc, minCollatorStake, maxDelegatorsPerCollator, minDelegatorStake, NONCE_TRACKER })
  } else if (ACTION == 'down') {
    console.log('Removing all collators except for current validators and invulnerables')
    const validators = (await api.query.session.validators()).toJSON();

    // Derive collator addresses which shall be removed
    const collators = Array(MAX_COLLATORS)
      .fill(0).map((_, i) => deriveCollatorSeed(FAUCET, i).address)
      // safety first filter for invulnerables even though all addresses are derived from faucet seed
      .filter(id => !invulnerables.includes(id) && !validators.includes(id))
    console.log(collators)

    // Remove collators via sudo call
    await removeCollators({ api, sudoAcc: faucetAcc, collators, NONCE_TRACKER })

  } else {
    console.warn(`Unsupported action '${ACTION}'. Supported actions: 'up' and 'down'. Stopping...`)
  }
}
main()
  .then(() => console.log(`Disconnection ${wsAddress}`))
  .catch(console.error)
  .finally(() => process.exit())
