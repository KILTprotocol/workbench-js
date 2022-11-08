const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api')
const { BN } = require('@polkadot/util')
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto')

require('dotenv').config()

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'ws://127.0.0.1:21011'
const provider = new WsProvider(wsAddress)
const NONCE_TRACKER = {}
const FAUCET = process.env.FAUCET
const SESSION_KEYS = [
  '0x0c5f54f0dc5593842c6351358fa5d07620439938b4ab114653ee58c42a255953',
  '0x1aab3092355f8492750ef81bb18c644467edc5a1dc068834e9fd584e1f8b9311',
  '0xe27981361ecc88dfecf88cee43c8a5df8ffeacd6d1090e96140f1fbc8f423a6a',
  '0xce9803ee4b843d570439f1bd126449b1a380419c220520a7425f05b5f37b893d',
  '0xeceae3760370cfa79e4220fb7949249eff415039a2e3bb6cb9f8a9d67b06310e',
  '0x8c9194393ccc0054e9b5db5c97e58c62da51b104db31600d11964c25e1e53a37',
  '0xb2c5841d624ecd1910369b39853fbc3e698bdeb89c76a690a2d70b3c0d482f76',
  '0xf088de0adbe41f3c0118100980404d924ee991171c048c965f7bdb4104d2044d',
  '0x5498bef3d688e152ee4dbf0d55e119960a853b9675474adc8c43c7901fe0d846',
  '0x6e4431be5001d539c90a252e34aecdcc6f18e294b357b0e21c8ba2c1571d4653',
  '0x10b7a12ffa2123fb97185ee265a2e6743a1c4580ac715d58aa0c0a1d9b65fa33',
  '0xf42961041517cc08b4e0f1609957877afd34738b8f752b0d2f8b1baaf77ac11e',
  '0x487d10a8b62323e27960be097fa3f5c8fea1c08b747544aa8ee5c844162adc0a',
  '0xb4fb31daa7886e87d326e1b0d3570890be06bab5f9847ff6e21fc99cba3e0524',
  '0xfcabc427d50f218d4e53a952b43b19fc099a0269aef367d06d0cf2be5e9a2f05',
  '0x70843af837755ec1a324c530b25ec6abbb1c4ba2f5b1cc9ebbc755a7023b221d',
  '0xdec987d7e7176b5f1ab3545391fff1af3a8eaae9a79539dcea003f8b3d9c0079',
  '0x16d01db295996576f067bc5399402e5681fe875d02cb55594a748683e415ac59',
  '0x9824839bd09013166717e65abd5ce43ed6c406ac376c8c976ee3ad6f1798606f',
  '0x7a1d26674bf5ea3f6750475acbefd82a0c91868c83348081ee99462a1ff18a7d',
  '0x7aff0a582ded36c74995ca94f500d63897f1f0997036d3cf9e92630c2614a706',
  '0x8c2e42acbf58c71e89d032b52b827c1e28bff7962fd913ad2a613a03139e895b',
  '0xe64f24d51c1fb61a960924443e65640803e7c882b5afa2f38fdffe6869dd5502',
  '0x083403223b5309a029c70850202f9d6ee1cbf5dce23e6b0733b53fc5e73c935e',
  '0x76196a6901d2eff6343951d0cedf17295e69e2883dd84fb4100e7bdcaffe492d',
  '0xe4aed1f2d66ec9a6f944fa911c6b8260dd68c9d2dc9b234f9e5d2012c2559659',
  '0xf2443b0f1a101f5ab9b0d34801200102555e346b4a963095078a138f7121b625',
  '0x0a70aa1691d3a344860a30e65875dd0106f75f681f430c51f888262da3079930',
  '0x7482d4d4345b467f93a6b834aa82f885c5db4ab8eaa90853f6fb946eabecd30f',
  '0x48ebe890613cca738aa18954b7348790cf9b459ea7c4b5ee24323583a9aa8812',
  '0x96bbac983fe8ef6dc03ee5eb0eb5ec65507e0363e2c5c33b033b500f2fb3ae61',
  '0x2462a8f3ddb4866866b2a42790a02437a02efc0abec55fd9c829d763c7c1b642',
  '0x8c169411ed082a473b1e928217e05c880714755b18807e879395c3d0b12e3f33',
  '0xfa753f03b290b021442a71a681d648717da4ad59899c5f626e6a141275983654',
]

async function waitInBlock(senderPair, options, tx) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(senderPair, options, ({ events = [], status }) => {
      console.log('Transaction status:', status.type)
      if (status.isInBlock) {
        resolve()
      } else if (status.isFinalized) {
      }
    })
  })
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
            console.log(error.toString())
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
    )
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
  })

  console.log(`\t Successfully delegated`)
}

async function fillDelegator({
  counter,
  api,
  collator,
  faucetAcc,
  minDelegatorStake,
  numMissingDelegators,
}) {
  console.log(
    `\t [${counter}a/${numMissingDelegators}] Creating delegator and providing liquidity`,
  )

  let delegator = initAccount(mnemonicGenerate())
  await faucetTransfer({
    faucetAcc,
    faucetAmount: minDelegatorStake.mul(new BN(2)),
    target: delegator.address,
    api,
  })

  console.log(
    `\t [${counter}b/${numMissingDelegators}] Delegate with ${delegator.address}`,
  )
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
        counter: i,
        api,
        collator,
        faucetAcc,
        minDelegatorStake,
        numMissingDelegators,
      }),
    )
  }
  await Promise.all(fillingDelegators)
}

async function addCollator({ sessionKey, faucetAcc, api, minCollatorStake }) {
  let collator = initAccount(mnemonicGenerate())
  await faucetTransfer({
    faucetAcc,
    faucetAmount: minCollatorStake.mul(new BN(2)),
    target: collator.address,
    api,
  })

  await waitInBlock(collator, {}, api.tx.session.setKeys(sessionKey, '0x00'))
  await waitInBlock(
    collator,
    {},
    api.tx.parachainStaking.joinCandidates(minCollatorStake),
  )
}

async function fillCollators({ api, faucetAcc, minCollatorStake }) {
  const addingCollators = SESSION_KEYS.map((sessionKey) =>
    addCollator({
      sessionKey,
      api,
      faucetAcc,
      minCollatorStake,
    }),
  )

  await Promise.all(addingCollators)
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

  // Prep sudo
  const faucetAcc = initAccount(FAUCET)
  NONCE_TRACKER[faucetAcc.address] = (
    await api.rpc.system.accountNextIndex(faucetAcc.address)
  ).toNumber()

  console.log(`Initiating collator iteration`)

  // await fillCollators({ api, faucetAcc, minCollatorStake })

  // Get active collators
  const topCandidates = (
    await api.query.parachainStaking.topCandidates()
  ).toJSON()
  const numCollators = (
    await api.query.parachainStaking.maxSelectedCandidates()
  ).toNumber()
  const activeCollators = topCandidates
    .slice(0, numCollators)
    .map((collator) => collator.owner)

  // Iterate all collators
  const fillingCol = await activeCollators.map(async (c, i) =>
    await fillCollator({
      activeCollators,
      counter: i,
      api,
      collator: c,
      faucetAcc,
      maxDelegatorsPerCollator,
      minDelegatorStake,
    }),
  )
  await Promise.all(fillingCol)

  console.log(`Done with filling delegator slots, disconnecting ${wsAddress}`)
}
main()
  .catch(console.error)
  .finally(() => process.exit())
