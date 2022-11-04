const { BN } = require("bn.js");
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { initAccount, initAccounts } = require("./utility.js")
const { accountsToCollatorsDelegators, writeKeysToFile } = require("./io.js")
const { fundAccounts, batchJoinCollatorsDelegators } = require("./transactions.js")
require('dotenv').config();


// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'wss://peregrine-stg.kilt.io/para';
const provider = new WsProvider(wsAddress);
const FAUCET = process.env.FAUCET;
// In order to stress test Spiritnet Config, set to 35+2 because we only set delegators for new collators, not existing ones
const NUM_COLLATORS = Number.parseInt(process.env.NUM_COLLATORS) || 1;

// Collator fund = 21k KILT
const COL_FUND_AMOUNT = new BN("21000000000000000000");
// Collator stake = 20k KILT
const COLLATION_AMOUNT = new BN("20000000000000000000");
// Delegator fund = 30 KILT
const DEL_FUND_AMOUNT = new BN("30000000000000000");
// Delegator stake = 20 KILT
const DELEGATION_AMOUNT = new BN("20000000000000000");

// Execute init script, e.g. temp collators and delegators join the network to have max delegator slots filled
async function main() {
    // Create our API with a default connection to the local node
    const api = await ApiPromise.create({ provider });
    console.log(`Connected to ${wsAddress}`);
    await cryptoWaitReady();

    // // Get constants
    const maxDelegatorsPerCollator = (await api.consts.parachainStaking.maxDelegatorsPerCollator).toNumber();

    // Init faucet
    const faucetAcc = initAccount(FAUCET);
    const {
        data: { free },
    } = await api.query.system.account(faucetAcc.address)
    console.log(`Balance of funding account ${faucetAcc.address}: ${free.toString()}`)

    // Create n Collators and n * m Delegators, so n * (1 + m) in total
    const { accounts, mnemonics } = initAccounts(NUM_COLLATORS * (1 + maxDelegatorsPerCollator))
    const { collators, delegators } = accountsToCollatorsDelegators(accounts, NUM_COLLATORS);
    console.log(`Accounts initiated: ${collators.length} Collators and ${delegators.length} Delegators`);

    // Fund Collators and Delegators
    await fundAccounts(api, faucetAcc, collators, COL_FUND_AMOUNT, delegators, DEL_FUND_AMOUNT);

    // Collators and Delegators join in same block
    await batchJoinCollatorsDelegators(api, collators, COLLATION_AMOUNT.toString(), delegators, DELEGATION_AMOUNT.toString(), maxDelegatorsPerCollator);

    // Write accounts
    await writeKeysToFile(mnemonics, NUM_COLLATORS)
}
main().catch(console.error).finally(() => process.exit());




