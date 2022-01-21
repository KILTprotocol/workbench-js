const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { BN } = require('@polkadot/util');
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto');

require('dotenv').config();

// Initialise the provider to connect to the local node
const provider = process.env.WS_ADDRESS || new WsProvider('wss://peregrine-stg.kilt.io/para');
const SUDO = process.env.SUDO;

// Set up an account from its private key.
function initAccount(privKey) {
    const keyring = new Keyring({ type: "sr25519" });
    return keyring.addFromUri(privKey);
}

// Faucet balance to target
async function faucet(sudoAcc, amount, target, api) {
    const tx = api.tx.sudo.sudo(api.tx.balances.setBalance(target, amount.toString(), '0'));

    await new Promise(async (resolve, reject) => {
        const unsub = await tx.signAndSend(sudoAcc, ({ status, events }) => {
            if (status.isInBlock || status.isFinalized) {
                events
                    // We know this tx should result in `Sudid` event.
                    .filter(({ event }) =>
                        api.events.sudo.Sudid.is(event)
                    )
                    // We know that `Sudid` returns just a `Result`
                    .forEach(({ event: { data: [result] } }) => {
                        // Now we look to see if the extrinsic was actually successful or not...
                        if (result.isError) {
                            let error = result.asError;
                            if (error.isModule) {
                                // for module errors, we have the section indexed, lookup
                                const decoded = api.registry.findMetaError(error.asModule);
                                const { docs, name, section } = decoded;
    
                                console.log(`${section}.${name}: ${docs.join(' ')}`);
                            } else {
                                // Other, CannotLookup, BadOrigin, no extra info
                                console.log(error.toString());
                            }
                            reject();
                        }
                    });
                    if (status.isFinalized) {
                        console.log("unsubbing")
                        unsub();
                        resolve();
                    }
            }
        });
    })

    const {
        data: { free },
      } = await api.query.system.account(target);
    if (!free) {
        throw Error(`Delegator ${target} has not received funds`);
    }
    console.log(`\t Received funds: ${Number.parseInt(free) / Math.pow(10, 15)} KILT`);
}

// Execute script
async function main() {
    // Create our API with a default connection to the local node
    const api = await ApiPromise.create({ provider });
    console.log(`Connected to ${provider}`);
    await cryptoWaitReady();
    
    // Get constants
    const maxDelegatorsPerCollator = (await api.consts.parachainStaking.maxDelegatorsPerCollator).toNumber();
    const minDelegatorStake = new BN((await api.consts.parachainStaking.minDelegatorStake).toHuman(), 10);
    
    // Get active collators
    const topCandidates = (await api.query.parachainStaking.topCandidates()).toJSON();
    const numCollators = (await api.query.parachainStaking.maxSelectedCandidates()).toNumber();
    const activeCollators = topCandidates.slice(0, numCollators).map(collator => collator.owner);
    
    // Prep sudo
    const sudoAcc = initAccount(SUDO);
    console.log(`Initiating collator iteration`);
    
    // Iterate all collators
    let counter = 0;
    for (const collator of activeCollators) {
        console.log(`${collator}: 1`)
        // Get active delegators
        const numActiveDelegators = (await api.query.parachainStaking.candidatePool(collator)).toHuman().delegators.length;
        const missingDelegators = maxDelegatorsPerCollator - numActiveDelegators;
        console.log(`[${counter}/${activeCollators.length}] Collator ${collator} is missing ${missingDelegators} many delegators...`);
        
        // Fill delegation slots
        for (let i = 0; i < missingDelegators; i += 1) {
            console.log(`\t[${i}/${missingDelegators}] Creating delegator and providing liquidity`);
            let tmpDelegator = initAccount(mnemonicGenerate());
            await faucet(sudoAcc, 1.5 * minDelegatorStake, tmpDelegator.address, api);

            console.log(`\t [${i}/${missingDelegators}] Delegate with ${tmpDelegator.address}`);
            const unsub = await api.tx.parachainStaking.joinDelegators(collator, minDelegatorStake).signAndSend(tmpDelegator, ({ status }) => {
                if (status.isInBlock) {
                    console.log(`\t included in ${status.asInBlock}`);
                }
                if (status.isFinalized) {
                    unsub();
                }
            });
        }
    }
}
main().catch(console.error).finally(() => process.exit());
