
// Faucet balance to target
async function faucetTransfer({ faucetAcc, faucetAmount, target, api, NONCE_TRACKER }) {
    const tx = api.tx.balances.transfer(target, faucetAmount.toString())

    await new Promise(async (resolve, reject) => {
        const nonce = NONCE_TRACKER[faucetAcc.address]
        NONCE_TRACKER[faucetAcc.address] = NONCE_TRACKER[faucetAcc.address] + 1

        const unsub = await tx.signAndSend(
            faucetAcc,
            { nonce },
            ({ status, events }) =>
                txHandler({ resolve, reject, unsub, status, events, api }),
        ).catch(e => console.error('Error during faucet Transfer: ', e))
    })

    const {
        data: { free },
    } = await api.query.system.account(target)
    if (!free) {
        throw Error(`Delegator ${target} has not received funds`)
    }
    console.log(
        `\t Target successfully received funds: ${formatBalance(free)} KILT`,
    )
}

function txHandler({ resolve, reject, unsub, status, events, api }) {
    if (status.isInBlock || status.isFinalized) {
        events
            // find/filter for failed events
            .filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))
            // we know that data for system.ExtrinsicFailed is
            // (DispatchError, DispatchInfo)
            .forEach(
                ({
                    event: {
                        data: [error, info],
                    },
                }) => {
                    if (error.isModule) {
                        // for module errors, we have the section indexed, lookup
                        const decoded = api.registry.findMetaError(error.asModule)
                        const { docs, method, section } = decoded

                        console.log(`${section}.${method}: ${docs.join(' ')}`)
                    } else {
                        // Other, CannotLookup, BadOrigin, no extra info
                        console.error(error.toString())
                    }
                    console.log(`Rejecting due to tx error`)
                    reject()
                },
            )
        resolve()
        if (status.isInBlock) {
            unsub()
            resolve()
        }
    }
}

async function waitInBlock(senderPair, options, tx) {
    return new Promise((resolve, reject) => {
        tx.signAndSend(senderPair, options, ({ events = [], status }) => {
            if (status.isInBlock) {
                resolve()
            } else if (status.isFinalized) {
            }
        })
    }).catch(e => console.error('Error during waitInBlock', e))
}

module.exports = {
    faucetTransfer,
    txHandler,
    waitInBlock
}

