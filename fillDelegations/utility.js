const { Keyring } = require('@polkadot/api')

// Format balance into KILT by applying denomination
function formatBalance(amount) {
    return Number.parseInt(amount) / Math.pow(10, 15)
}

// Set up an account from its private key.
function initAccount(privKey) {
    const keyring = new Keyring({ type: 'sr25519' })
    return keyring.addFromUri(privKey)
}

module.exports = {
    formatBalance,
    initAccount
}