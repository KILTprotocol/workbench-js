// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
require('dotenv').config();

// Initialise the provider to connect to the local node
const provider = process.env.WS_ADDRESS || new WsProvider('wss://spiritnet.kilt.io');

// Configure all delegations you are interested in here
// For each collator, you need to provide the collators address and the delegations you would like to check
const DELEGATIONS = [
    {
        collator: '4qBSZdEoUxPVnUqbX8fjXovgtQXcHK7ZvSf56527XcDZUukq',
        delegators: [
            '4rEDw16xpfGpEohGgXLzn2Lnzq5wREGqGux9KPniVRmQYVMJ',
            '4qN132CPMM6cTCcPVfktus8HXUptmRf3YmkFmYkuBYRjsEY8'
        ]
    },
    {
        collator: '4oRRardEGiqYxzqsDyV4oJUc1GUm4qP6CnBxyAnDbo7nBrCi',
        delegators: [
            '4ru2qCW5hwsKBAPSDqpzMAg1kQsg8srn8JWdyi11hUad33DH',
            '4rLcQDzmSePUL4jCajEupocBBRqGiKJ3XLyu8v7AGChHpa9u'
        ]
    }
];

// Execute script
async function main() {
    // Create our API with a default connection to the local node
    const api = await ApiPromise.create({ provider });

    // get active collators
    const topCandidates = (await api.query.parachainStaking.topCandidates()).toJSON();
    const numCollators = (await api.query.parachainStaking.maxSelectedCandidates()).toNumber();
    const activeCollators = topCandidates.slice(0, numCollators);

    // check given delegations iteratively
    for (const i in DELEGATIONS) {
        const { collator, delegators } = DELEGATIONS[i];
        console.log(`>> [${i}/${DELEGATIONS.length}] Checking collator ${collator} <<`);

        // check whether given collator is still active
        if (activeCollators.find(activeCollator => activeCollator.owner === collator)) {
            // get active delegators
            const activeDelegators = (await api.query.parachainStaking.candidatePool(collator)).toHuman().delegators;

            // check whether given delegators are still active
            for (const delegator of delegators) {
                if (!activeDelegators.find(activeDelegation => activeDelegation.owner === delegator)) {
                    console.log(`❌ Delegation ${delegator} to collator ${collator} was pushed out`);
                    const stakeString = activeDelegators[activeDelegators.length - 1].amount.replaceAll(',', '');
                    const stake = Number.parseInt(stakeString, 10) / Math.pow(10, 15)
                    console.log(`\t 💰 Least delegation of this collator to compete with: ${stake} KILT`);
                } else {
                    console.log(`✅ Delegator ${delegator} still active for collator ${collator}`);
                }
            }
        } else {
            console.log(`☠️ Collator ${collator} is not active anymore`);
        }
    }
    console.log('>> done <<')
}
main().catch(console.error).finally(() => process.exit());
