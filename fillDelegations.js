const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api')
const { BN } = require('@polkadot/util')
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto')

require('dotenv').config()

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'ws://127.0.0.1:21011'
const provider = new WsProvider(wsAddress)
const NONCE_TRACKER = {}
const FAUCET = process.env.FAUCET

async function waitInBlock(senderPair, options, tx) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(senderPair, options, ({ events = [], status }) => {
      if (status.isInBlock) {
        resolve()
      } else if (status.isFinalized) {
      }
    })
  }).catch(e => console.error('Error during waitInBlock', e))
}

// Set up an account from its private key.
function initAccount(privKey) {
  const keyring = new Keyring({ type: 'sr25519' })
  return keyring.addFromUri(privKey)
}

// Format balance into KILT by applying denomination
function formatBalance(amount) {
  return Number.parseInt(amount) / Math.pow(10, 15)
}

function txHandlerNormal({ resolve, reject, unsub, status, events, api }) {
  if (status.isInBlock || status.isFinalized) {
    events
      // find/filter for failed events
      .filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))
      // we know that data for system.ExtrinsicFailed is
      // (DispatchError, DispatchInfo)
      .forEach(
        ({
          event: {
            data: [error, info],
          },
        }) => {
          if (error.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = api.registry.findMetaError(error.asModule)
            const { docs, method, section } = decoded

            console.log(`${section}.${method}: ${docs.join(' ')}`)
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.error(error.toString())
          }
          console.log(`Rejecting due to tx error`)
          reject()
        },
      )
    resolve()
    if (status.isInBlock) {
      unsub()
      resolve()
    }
  }
}

// Faucet balance to target
async function faucetTransfer({ faucetAcc, faucetAmount, target, api }) {
  const tx = api.tx.balances.transfer(target, faucetAmount.toString())

  await new Promise(async (resolve, reject) => {
    const nonce = NONCE_TRACKER[faucetAcc.address]
    NONCE_TRACKER[faucetAcc.address] = NONCE_TRACKER[faucetAcc.address] + 1

    const unsub = await tx.signAndSend(
      faucetAcc,
      { nonce },
      ({ status, events }) =>
        txHandlerNormal({ resolve, reject, unsub, status, events, api }),
    ).catch(e => console.error('Error during faucet Transfer: ', e))
  })

  const {
    data: { free },
  } = await api.query.system.account(target)
  if (!free) {
    throw Error(`Delegator ${target} has not received funds`)
  }
  console.log(
    `\t Target successfully received funds: ${formatBalance(free)} KILT`,
  )
}

async function delegate({ delegator, delegationAmount, collatorAddress, api }) {
  const tx = api.tx.parachainStaking.joinDelegators(
    collatorAddress,
    delegationAmount,
  )

  await new Promise(async (resolve, reject) => {
    const unsub = await tx.signAndSend(delegator, ({ status, events }) =>
      txHandlerNormal({ resolve, reject, unsub, status, events, api }),
    )
  }).catch(e => console.error(`Error during delegation of ${delegator.address} for collator ${collatorAddress}`, e))

  console.log(`\t Successfully delegated`)
}

async function fillDelegator({
  colIdx,
  delIdx,
  api,
  collator,
  faucetAcc,
  minDelegatorStake,
  numMissingDelegators,
}) {
  let delegator = initAccount(`${FAUCET}//c//${colIdx}//d//${delIdx}`)
  await faucetTransfer({
    faucetAcc,
    faucetAmount: minDelegatorStake.mul(new BN(2)),
    target: delegator.address,
    api,
  })

  await delegate({
    delegator,
    delegationAmount: minDelegatorStake,
    collatorAddress: collator,
    api,
  })
}

async function fillCollator({
  activeCollators,
  counter,
  api,
  collator,
  faucetAcc,
  maxDelegatorsPerCollator,
  minDelegatorStake,
}) {
  // Get active delegators
  const numActiveDelegators = (
    await api.query.parachainStaking.candidatePool(collator)
  ).toHuman().delegators.length
  const numMissingDelegators = maxDelegatorsPerCollator - numActiveDelegators
  console.log(
    `[${counter}/${activeCollators.length}] Collator ${collator} is missing ${numMissingDelegators} delegators`,
  )

  // Fill delegation slots
  const fillingDelegators = []
  for (let i = 1; i <= numMissingDelegators; i += 1) {
    fillingDelegators.push(
      fillDelegator({
        colIdx: counter,
        delIdx: i,
        api,
        collator,
        faucetAcc,
        minDelegatorStake,
        numMissingDelegators,
      }),
    )
  }
  await Promise.all(fillingDelegators).catch(e => console.error(`Error during fillingDelegators at col index ${counter} and del index ${i}`, e))
}

async function addCollator({ faucetAcc, api, minCollatorStake, counter }) {
  let collator = initAccount(`${FAUCET}//c//${counter}`)
  await faucetTransfer({
    faucetAcc,
    faucetAmount: minCollatorStake.mul(new BN(2)),
    target: collator.address,
    api,
  })

  const sessionKey = await api.rpc.author.rotateKeys()
  console.log(`add session key ${sessionKey}`)

  await waitInBlock(collator, {}, api.tx.session.setKeys(sessionKey, '0x00'))
  await waitInBlock(
    collator,
    {},
    api.tx.parachainStaking.joinCandidates(minCollatorStake),
  )
}

async function fillCollators({
  api,
  faucetAcc,
  minCollatorStake,
  collatorsToAdd,
}) {
  const jobs = []
  console.log(`Adding ${collatorsToAdd} collators.`)
  while (jobs.length < collatorsToAdd) {
    jobs.push(
      addCollator({
        api,
        faucetAcc,
        minCollatorStake,
        counter: jobs.length
      }),
    )
  }

  await Promise.all(jobs)
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
  const maxCollators = (
    await api.query.parachainStaking.maxSelectedCandidates()
  ).toNumber()
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
