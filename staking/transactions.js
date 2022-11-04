const { txHandlerNormal } = require("./utility.js")

// Fund a list of keypairs
async function fundAccounts(api, faucetAcc, collators, collatorAmount, delegators, delegatorAmount) {
    const colTxs = collators.map(acc => api.tx.balances.transfer(acc.address, collatorAmount));
    const delTxs = delegators.map(acc => api.tx.balances.transfer(acc.address, delegatorAmount));
    const txs = [...colTxs, ...delTxs];

    // Need to ensure we wait a block until calling next batch
    await new Promise(async (resolve, reject) => {
        const unsub = await api.tx.utility.batch(txs).signAndSend(faucetAcc, ({ status, events }) => txHandlerNormal({ resolve, reject, unsub, status, events, api }));
    });

    console.log(`\t Funded ${txs.length} many accounts`);
}

// Spawn collators and delegators in the same block
async function batchJoinCollatorsDelegators(api, collators, collationAmount, delegators, delegationAmount, delegatorsPerCollator) {
    const txsCol = collators.map(() => api.tx.parachainStaking.joinCandidates(collationAmount));
    // Delegators j...j+m join Collator(j)
    const txsDel = delegators.map((_, i) => {
        const collatorIndex = Number.parseInt(Math.max(i - 1, 0) / delegatorsPerCollator);
        return api.tx.parachainStaking.joinDelegators(collators[collatorIndex].address, delegationAmount)
    });

    // Should be able to submit all txs in same block because overlay will handle
    await Promise.all([
        ...txsCol.map(async (tx, i) => tx.signAndSend(collators[i])),
        ...txsDel.map(async (tx, i) => tx.signAndSend(delegators[i]))
    ])
    console.log(`\t ${collators.length} new Collators joined: ${JSON.stringify(collators.map(c => c.address))}`);
    console.log(`\t ${delegators.length} new Delegators`);
}

async function batchLeaveCollatorsDelegators(api, collators, delegators) {
    const txsCol = collators.map(() => api.tx.parachainStaking.initLeaveCandidates());
    const txsDel = delegators.map(() => api.tx.parachainStaking.leaveDelegators());

    // Should be able to submit all txs in same block because overlay will handle
    await Promise.all([
        ...txsCol.map(async (tx, i) => tx.signAndSend(collators[i])),
        ...txsDel.map(async (tx, i) => tx.signAndSend(delegators[i]))
    ])
    console.log(`\t ${collators.length} existing Collators are leaving: ${JSON.stringify(collators.map(c => c.address))}`);
    console.log(`\t ${delegators.length} existing Delegators are leaving`);
}

module.exports = {
    fundAccounts,
    batchJoinCollatorsDelegators,
    batchLeaveCollatorsDelegators
}