import * as Kilt from "@kiltprotocol/sdk-js"
import { ApiPromise } from "@polkadot/api"
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

function generateKeypairs(mnemonic = mnemonicGenerate()): {
    authentication: Kilt.KiltKeyringPair & {
        type: 'ed25519'
    }
    encryption: Kilt.KiltEncryptionKeypair
    attestation: Kilt.KiltKeyringPair
    delegation: Kilt.KiltKeyringPair
} {
    const authentication = Kilt.Utils.Crypto.makeKeypairFromSeed(
        mnemonicToMiniSecret(mnemonic)
    )
    const encryption = Kilt.Utils.Crypto.makeEncryptionKeypairFromSeed(
        mnemonicToMiniSecret(mnemonic)
    )
    const attestation = authentication.derive(
        '//attestation'
    ) as Kilt.KiltKeyringPair
    const delegation = authentication.derive(
        '//delegation'
    ) as Kilt.KiltKeyringPair

    return {
        authentication,
        encryption,
        attestation,
        delegation
    }
}

async function run(api: ApiPromise, mnemonic: string, account: Kilt.KiltKeyringPair) {


    const { authentication, encryption, attestation, delegation } = await generateKeypairs(mnemonic)

    const fullDidCreationTx = await Kilt.Did.getStoreTx(
        {
            authentication: [authentication],
            keyAgreement: [encryption],
            assertionMethod: [attestation],
            capabilityDelegation: [delegation],
        },

        account.address,
        async ({ data }) => ({
            signature: authentication.sign(data),
            keyType: authentication.type,
        })
    )
    await Kilt.Blockchain.signAndSubmitTx(fullDidCreationTx, account)

    const didUri = Kilt.Did.getFullDidUriFromKey(authentication)
    const encodedFullDid = await api.call.did.query(Kilt.Did.toChain(didUri))
    console.log(`Encoded full did: ${encodedFullDid}`)

    // const { document } = Kilt.Did.linkedInfoFromChain(encodedFullDid)

    // if (!document) {
    //     throw 'Full DID was not successfully created.'
    // }

    // return { fullDid: document }
}

async function setup() {

    await Kilt.connect("wss://peregrine.kilt.io/parachain-public-ws")

    const api = Kilt.ConfigService.get('api')

    const account = Kilt.Utils.Crypto.makeKeypairFromSeed(mnemonicToMiniSecret(process.env.ACCOUNT_MNEMONIC || mnemonicGenerate()))

    const accountInfo = await api.query.system.account(account.address);
    console.log(`Account Address: ${account.address} ... ${accountInfo}`)
    run(api, process.env.DID_MNEMONIC || mnemonicGenerate(), account)
}

setup()
