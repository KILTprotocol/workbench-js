const { Keyring } = require('@polkadot/api');
const { mnemonicGenerate } = require("@polkadot/util-crypto");

// Set up an account from its private key.
function initAccount(privKey) {
    const keyring = new Keyring({ type: "sr25519" });
    return keyring.addFromUri(privKey);
}

// Create a list of keypairs
function initAccounts(n) {
    const accounts = [];
    const mnemonics = [];
    for (let i = 0; i < n; i++) {
        const mnemonic = mnemonicGenerate();
        mnemonics.push(mnemonic)
        accounts.push(initAccount(mnemonic));
    }
    return { accounts, mnemonics }
}

// Format balance into KILT by applying denomination
function formatBalance(amount) {
    return Number.parseInt(amount) / Math.pow(10, 15);
}

function txHandlerNormal({ resolve, reject, unsub, status, events, api, }) {
    if (status.isInBlock || status.isFinalized) {
        events
            // find/filter for failed events
            .filter(({ event }) =>
                api.events.system.ExtrinsicFailed.is(event)
            )
            // we know that data for system.ExtrinsicFailed is
            // (DispatchError, DispatchInfo)
            .forEach(({ event: { data: [error, info] } }) => {
                if (error.isModule) {
                    // for module errors, we have the section indexed, lookup
                    const decoded = api.registry.findMetaError(error.asModule);
                    const { docs, method, section } = decoded;

                    console.log(`${section}.${method}: ${docs.join(' ')}`);
                } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    console.log(error.toString());
                }
                console.log(`Rejecting due to tx error`)
                reject();
            });
        resolve();
        if (status.isFinalized) {
            unsub();
            resolve();
        }
    }
}

module.exports = {
    initAccount,
    initAccounts,
    formatBalance,
    txHandlerNormal,
}