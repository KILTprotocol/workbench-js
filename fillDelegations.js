const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { BN } = require('@polkadot/util');
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto');

require('dotenv').config();

// Initialise the provider to connect to the local node
const wsAddress = process.env.WS_ADDRESS || 'wss://peregrine-stg.kilt.io/para';
const provider = new WsProvider('wss://peregrine-stg.kilt.io/para');
const SUDO = process.env.SUDO;

// Set up an account from its private key.
function initAccount(privKey) {
    const keyring = new Keyring({ type: "sr25519" });
    return keyring.addFromUri(privKey);
}

// Format balance into KILT by applying deenomination
function formatBalance(amount) {
    return Number.parseInt(amount) / Math.pow(10, 15);
}

// Faucet balance to target
async function faucet({ sudoAcc, faucetAmount, target, api }) {
    const tx = api.tx.sudo.sudo(api.tx.balances.setBalance(target, faucetAmount.toString(), '0'));

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
                            console.log(`Rejecting due to sudo error`);
                            reject();
                        }
                    });
                if (status.isFinalized) {
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
    console.log(`\t Target successfully received funds: ${formatBalance(free)} KILT`);
}

async function delegate({ delegator, delegationAmount, collatorAddress, api }) {
    const tx = api.tx.parachainStaking.joinDelegators(collatorAddress, delegationAmount);

    await new Promise(async (resolve, reject) => {
        const unsub = await tx.signAndSend(delegator, ({ status, events }) => {
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
        })
    });

    console.log(`\t Successfully delegated`);
}

// Execute script
async function main() {
    // Create our API with a default connection to the local node
    const api = await ApiPromise.create({ provider });
    console.log(`Connected to ${wsAddress}`);
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
    let counter = 1;
    for (const collator of activeCollators) {
        // Get active delegators
        const numActiveDelegators = (await api.query.parachainStaking.candidatePool(collator)).toHuman().delegators.length;
        const numMissingDelegators = maxDelegatorsPerCollator - numActiveDelegators;
        console.log(`[${counter}/${activeCollators.length}] Collator ${collator} is missing ${numMissingDelegators} delegators`);

        // Fill delegation slots
        for (let i = 1; i <= numMissingDelegators + 1; i += 1) {
            console.log(`\t [${i}a/${numMissingDelegators}] Creating delegator and providing liquidity`);
            let delegator = initAccount(mnemonicGenerate());
            await faucet({ sudoAcc, faucetAmount: minDelegatorStake.mul(new BN(2, 10)), target: delegator.address, api });

            console.log(`\t [${i}b/${numMissingDelegators}] Delegate with ${delegator.address}`);
            await delegate({ delegator, delegationAmount: minDelegatorStake, collatorAddress: collator, api });
        }
        counter += 1;
    }
    console.log(`Done with filling delegator slots, disconnecting ${wsAddress}`)
}
main().catch(console.error).finally(() => process.exit());
