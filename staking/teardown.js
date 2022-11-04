const { ApiPromise, WsProvider } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { initAccount } = require("./utility.js")
const { accountsToCollatorsDelegators, readKeysFromFile } = require("./io.js")
const { batchLeaveCollatorsDelegators } = require("./transactions.js");
require('dotenv').config();

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'wss://peregrine-stg.kilt.io/para';
const provider = new WsProvider(wsAddress);
const FILE_PATH = process.env.MNEMONICS || "";
// In order to stress test Spiritnet Config, set to 35+2 because we only set delegators for new collators, not existing ones
const NUM_COLLATORS = process.env.NUM_COLLATORS || 1;

// Execute teardown, e.g. temp collators and delegators leave network
async function main() {
    // Create our API with a default connection to the local node
    const api = await ApiPromise.create({ provider });
    console.log(`Connected to ${wsAddress}`);
    await cryptoWaitReady();

    // Get accounts from file
    const input = await readKeysFromFile(FILE_PATH)

    // Init accounts
    const mnemonics = [...input.collators, ...input.delegators]
    const accounts = mnemonics.map(m => initAccount(m));
    const { collators, delegators } = accountsToCollatorsDelegators(accounts, NUM_COLLATORS);

    await batchLeaveCollatorsDelegators(api, collators, delegators);
}
main().catch(console.error).finally(() => process.exit());




