const { types18 } = require('@kiltprotocol/type-definitions')
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const util_crypto = require('@polkadot/util-crypto')

function isNext(last, cur, len) {
  return (cur - last === 1) || (cur === 0 && last === len - 1)
}

function skippedAuthorities(last, cur, authorities) {
  
}

async function findOffline(api) {
  let authorities = await api.query.session.validators()
  console.log(`collators: ${authorities}`)
  let last = null

  api.derive.chain.subscribeNewHeads((header) => {
    console.log(`#${header.number}: ${header.author}`);
    let cur = authorities.findIndex((elem) => elem === header.author)
    if (last !== null && cur >= 0 && !isNext(last, cur, len(authorities))) {

    }
  });

}

async function setup(execute) {
  await util_crypto.cryptoWaitReady()
  const wsProvider = new WsProvider('wss://peregrine.kilt.io')
  const api = await ApiPromise.create({
    provider: wsProvider,
    types: types18,
  })

  await execute(api)

  await api.disconnect()
}

setup(findOffline)
