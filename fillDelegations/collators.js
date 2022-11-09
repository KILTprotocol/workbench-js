const { faucetTransfer, waitInBlock, } = require('./chain')
const { fillDelegator } = require('./delegators')
const { initAccount } = require('./utility')


async function addCollator({ faucetAcc, api, minCollatorStake, counter, NONCE_TRACKER }) {
    let collator = initAccount(`${FAUCET}//c//${counter}`)
    await faucetTransfer({
        faucetAcc,
        faucetAmount: minCollatorStake.mul(new BN(2)),
        target: collator.address,
        api,
        NONCE_TRACKER,
    })

    const sessionKey = await api.rpc.author.rotateKeys()
    console.log(`add session key ${sessionKey}`)

    await waitInBlock(collator, {}, api.tx.session.setKeys(sessionKey, '0x00'))
    await waitInBlock(
        collator,
        {},
        api.tx.parachainStaking.joinCandidates(minCollatorStake),
    )
}


async function fillCollator({
    activeCollators,
    counter,
    api,
    collator,
    faucetAcc,
    maxDelegatorsPerCollator,
    minDelegatorStake,
    NONCE_TRACKER
}) {
    // Get active delegators
    const numActiveDelegators = (
        await api.query.parachainStaking.candidatePool(collator)
    ).toHuman().delegators.length
    const numMissingDelegators = maxDelegatorsPerCollator - numActiveDelegators
    console.log(
        `[${counter}/${activeCollators.length}] Collator ${collator} is missing ${numMissingDelegators} delegators`,
    )

    // Fill delegation slots
    const fillingDelegators = []
    for (let i = 1; i <= numMissingDelegators; i += 1) {
        fillingDelegators.push(
            fillDelegator({
                colIdx: counter,
                delIdx: i,
                api,
                collator,
                faucetAcc,
                minDelegatorStake,
                NONCE_TRACKER,
            }),
        )
    }
    await Promise.all(fillingDelegators).catch(e => console.error(`Error during fillingDelegators at col index ${counter} and del index ${i}`, e))
}

async function fillCollators({
    api,
    faucetAcc,
    minCollatorStake,
    collatorsToAdd,
    NONCE_TRACKER,
}) {
    const jobs = []
    console.log(`Adding ${collatorsToAdd} collators.`)
    while (jobs.length < collatorsToAdd) {
        jobs.push(
            addCollator({
                api,
                faucetAcc,
                minCollatorStake,
                counter: jobs.length,
                NONCE_TRACKER,
            }),
        )
    }

    await Promise.all(jobs)
}

module.exports = {
    addCollator,
    fillCollator,
    fillCollators,
}
