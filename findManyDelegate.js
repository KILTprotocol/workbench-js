const {
  typeBundleForPolkadot,
} = require('@kiltprotocol/type-definitions')
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto')

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

async function waitFinalized(senderPair, options, tx) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(senderPair, options, ({ events = [], status }) => {
      console.log('Transaction status:', status.type)
      if (status.isInBlock) {
      } else if (status.isFinalized) {
        resolve()
      }
    })
  })
}

async function makeDelegate(api) {
  const keyring = new Keyring({
    type: 'sr25519',
  })

  const sudo = keyring.addFromUri(
    'print limb expire raw ecology regular crumble slot lab opera fold adjust',
    { name: `Money` },
  )

  const richyRich = keyring.addFromUri(
    'visual hammer suffer sing demise rebuild select steak ceiling copper isolate hand',
    { name: `Money` },
  )
  let money = await api.query.system.account(richyRich.address)
  console.log(
    `Start real fun ${money.data.free.toHuman()} ${richyRich.address}`,
  )

  for (let i = 0; i < 26; i++) {
    const mnemonic = mnemonicGenerate()
    const pair = keyring.addFromUri(mnemonic, { name: `Delegator ${i}` })
    console.log(`Delegator ${i}: '${mnemonic}' ${pair.address}`)

    await waitInBlock(
      sudo,
      {},
      api.tx.sudo.sudoAs(
        richyRich.address,
        api.tx.balances.transferKeepAlive(pair.address, 1050n * 10n ** 15n),
      ),
    )

    await waitInBlock(
      pair,
      {},
      api.tx.parachainStaking.joinDelegators(
        '4tBUMGehBjUmTvgHhNT3HQkV9pnTTdgo5xzj8TX49yjWsUrt',
        1000n * 10n ** 15n + BigInt(i),
      ),
    )
  }

  console.log(`End real fun`)
}

async function queryDelegate(api) {
  const keyring = new Keyring({
    type: 'sr25519',
  })

  const richyRich = keyring.addFromUri(
    'visual hammer suffer sing demise rebuild select steak ceiling copper isolate hand',
    { name: `Money` },
  )
  let money = await api.query.system.account(richyRich.address)
  console.log(
    `Start real fun ${money.data.free.toHuman()} ${richyRich.address}`,
  )

  let delegate_state = await api.query.parachainStaking.delegatorState.entries()
  console.log(delegate_state.toString())
}

async function setup() {
  await cryptoWaitReady()

  const api = await ApiPromise.create({
    provider: new WsProvider('wss://westend.kilt.io'),
    typesBundle: {
      spec: {
        'mashnet-node': typeBundleForPolkadot,
        'kilt-spiritnet': typeBundleForPolkadot,
      },
    },
  })
  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)
  console.log(`Start fun 2`)

  await queryDelegate(api)

  console.log(`End fun`)

  await api.disconnect()
}

setup()
