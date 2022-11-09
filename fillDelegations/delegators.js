
const { faucetTransfer, txHandler } = require('./chain')
const { initAccount } = require('./utility')

async function fillDelegator({
    colIdx,
    delIdx,
    api,
    collator,
    faucetAcc,
    minDelegatorStake,
    NONCE_TRACKER
}) {
    let delegator = initAccount(`${FAUCET}//c//${colIdx}//d//${delIdx}`)
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