const { BN } = require('@polkadot/util')

const { faucetTransfer, waitInBlock, } = require('./chain')
const { fillDelegator } = require('./delegators')
const { initAccount } = require('./utility')

// Derives temp collator seed from base seed
function deriveCollatorSeed(baseSeed, index) {
    console.log(`Collator Seed: ${baseSeed}//c//${index}`)
    return initAccount(`${baseSeed}//c//${index}`)
}

// Adds collator to network
async function addCollator({ faucetAcc, api, minCollatorStake, baseSeed, counter, NONCE_TRACKER }) {
    let collator = deriveCollatorSeed(baseSeed, counter)
    await faucetTransfer({
        faucetAcc,
        faucetAmount: minCollatorStake.mul(new BN(2)),
        target: collator.address,
        api,
        NONCE_TRACKER,
    })

    // TODO: Re-enable
    // const sessionKey = await api.rpc.author.rotateKeys()
    // console.log(`add session key ${sessionKey}`)

    // await waitInBlock(collator, {}, api.tx.session.setKeys(sessionKey, '0x00'))
    await waitInBlock(
        collator,
        {},
        api.tx.parachainStaking.joinCandidates(minCollatorStake),
    )
}

// Fills collator with delegators
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

// Loops over fillCollator
async function fillCollators({
    api,
    faucetAcc,
    minCollatorStake,
    collatorsToAdd,
    baseSeed,
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
                baseSeed,
                NONCE_TRACKER,
            }),
        )
    }

    await Promise.all(jobs)
}

// Removes collators via sudo
async function removeCollators({
    api,
    collators,
    sudoAcc,
    NONCE_TRACKER,
}) {
    let jobs = []
    let counter = 1;
    for (c of collators) {
        console.log(`[${counter}/${collators.length}] Removing candidate ${c}`)

        jobs.push(waitInBlock(sudoAcc, { nonce: NONCE_TRACKER[sudoAcc.address] }, api.tx.sudo.sudo(api.tx.parachainStaking.forceRemoveCandidate(c))))
        NONCE_TRACKER[sudoAcc.address] += 1

        if (jobs.length > 10) {
            await Promise.all(jobs)
            jobs = []
        }
        counter += 1
    }
    await Promise.all(jobs)

    console.log(`Forcedly removed exit for ${collators.length} collators.`)
}

module.exports = {
    addCollator,
    fillCollator,
    fillCollators,
    removeCollators,
    deriveCollatorSeed,
}
