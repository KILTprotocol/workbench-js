const { BN } = require('@polkadot/util')

const { faucetTransfer, txHandler } = require('./chain')
const { initAccount } = require('./utility')

// Derives temp delegator seed from base seed, collator and delegator indices
function deriveDelegatorSeed(baseSeed, colIdx, delIdx) {
    return initAccount(`${baseSeed}//c//${colIdx}//d//${delIdx}`)
}

// Adds funding and delegation
async function fillDelegator({
    colIdx,
    delIdx,
    api,
    collator,
    baseSeed,
    faucetAcc,
    minDelegatorStake,
    NONCE_TRACKER
}) {
    let delegator = deriveDelegatorSeed(baseSeed, colIdx, delIdx)
    await faucetTransfer({
        faucetAcc,
        faucetAmount: minDelegatorStake.mul(new BN(2)),
        target: delegator.address,
        api,
        NONCE_TRACKER,
    })

    await delegate({
        delegator,
        delegationAmount: minDelegatorStake,
        collatorAddress: collator,
        api,
    })
}

// Delegation extrinsic
async function delegate({ delegator, delegationAmount, collatorAddress, api }) {
    const tx = api.tx.parachainStaking.joinDelegators(
        collatorAddress,
        delegationAmount,
    )

    await new Promise(async (resolve, reject) => {
        const unsub = await tx.signAndSend(delegator, ({ status, events }) =>
            txHandler({ resolve, reject, unsub, status, events, api }),
        )
    }).catch(e => console.error(`Error during delegation of ${delegator.address} for collator ${collatorAddress}`, e))

    console.log(`\t Successfully delegated`)
}

module.exports = {
    fillDelegator,
    delegate,
}