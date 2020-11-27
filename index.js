const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const util = require('@polkadot/util');
const util_crypto = require('@polkadot/util-crypto');

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y'
const DAVE = '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy'
const EVE = '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw'

const types = {
  // required in 2.0.0
  RefCount: 'u32',

  Address: 'AccountId',
  Index: 'u32',
  LookupSource: 'Address',
  BlockNumber: 'u64',
  Signature: 'MultiSignature',
  AccountIndex: 'u32',
  Hash: 'H256',

  Keys: 'SessionKeys2',
  Amount: 'i128',
  AmountOf: 'Amount',
  Balance: 'u128',
  BalanceOf: 'Balance',

  CurrencyId: '[u8; 8]',
  CurrencyIdOf: 'CurrencyId',

  ValidatorId: 'AccountId',
  IssuerPoints: 'u32',
  LeftCouncilReason: {
    _enum: {
      SlashedOut: null,
      VotedOut: null,
      Voluntarily: null,
    },
  },
  SlashReason: {
    _enum: {
      Offline: null,
      FaultyBlock: null,
      InitProposal: null,
      MissingVote: null,
    },
  },
  SessionStatus: {
    _enum: {
      Outdated: null,
      UpToDate: null,
    },
  },

  UserVote: {
    amount: 'BalanceOf',
    approve: 'bool',
  },

  CouncilMember: {
    points: 'u32',
    currency_id: 'CurrencyId',
    account_id: 'AccountId',
    validator_id: 'AccountId',
  },

  CouncilProposal: {
    proposal_hash: 'Hash',
    closing_block: 'BlockNumber',
  },

  Ballot: {
    yes_votes: 'BalanceOf',
    no_votes: 'BalanceOf',
  },

  StakingLedger: {
    stash: 'AccountId',
    currency_id: 'CurrencyIdOf',
    total: 'BalanceOf',
    active: 'BalanceOf',
    unlocking: 'Vec<UnlockChunk2>',
  },

  UnlockChunk: {
    value: 'BalanceOf',
    block: 'BlockNumber',
  },

  AccountData: {
    free: 'BalanceOf',
    reserved: 'BalanceOf',
    frozen: 'BalanceOf',
  },
  ProposalCall: 'Call',
  ProposalMetadata: '()',
  MaxProposals: 'u32',
  Proposal: {
    call: 'ProposalCall',
    metadata: 'ProposalMetadata',
  },
  ProposalIndex: 'u32',
}

const DEFAULT_CURRENCY = '0x0000000000000000'
const ALICE_CURRENCY = DEFAULT_CURRENCY
const BOB_CURRENCY = '0x0000000000000002'
const CHARLIE_CURRENCY = '0x0000000000000003'
const DAVE_CURRENCY = '0x0000000000000004'
const EVE_CURRENCY = '0x0000000000000005'

async function log_balances(api, currency) {
  console.log('BALANCES for', currency, ':')
  console.log(
    '\tALICE:\t',
    (await api.query.poliBalances.accounts(ALICE, currency)).free.toHuman(),
  )
  console.log(
    '\tBOB:\t',
    (await api.query.poliBalances.accounts(BOB, currency)).free.toHuman(),
  )
  console.log(
    '\tCHARLIE:',
    (await api.query.poliBalances.accounts(CHARLIE, currency)).free.toHuman(),
  )
  console.log(
    '\tDAVE:\t',
    (await api.query.poliBalances.accounts(DAVE, currency)).free.toHuman(),
  )
  console.log(
    '\tEVE:\t',
    (await api.query.poliBalances.accounts(EVE, currency)).free.toHuman(),
  )
}

async function waitFinalized(senderPair, options, tx) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(senderPair, options, ({ events = [], status }) => {
      console.log('Transaction status:', status.type)
      if (status.isInBlock) {
      } else if (status.isFinalized) {
        resolve()
      }
    })
  })
}

async function waitInBlock(senderPair, options, tx) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(senderPair, options, ({ events = [], status }) => {
      console.log('Transaction status:', status.type)
      if (status.isInBlock) {
        resolve()
      } else if (status.isFinalized) {
      }
    })
  })
}

async function fill_council_and_vote(api) {
  const keyring = new Keyring({
    type: 'sr25519',
  })

  const alicePair = keyring.addFromSeed(
    util.hexToU8a(
      '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
    ),
  )
  const bobPair = keyring.addFromSeed(
    util.hexToU8a(
      '0x398f0c28f98885e046333d4a41c19cee4c37368a9832c6502f6cfd182e2aef89',
    ),
  )
  const charliePair = keyring.addFromSeed(
    util.hexToU8a(
      '0xbc1ede780f784bb6991a585e4f6e61522c14e1cae6ad0895fb57b9a205a8f938',
    ),
  )
  const davePair = keyring.addFromSeed(
    util.hexToU8a(
      '0x868020ae0687dda7d57565093a69090211449845a7e11453612800b663307246',
    ),
  )
  const evePair = keyring.addFromSeed(
    util.hexToU8a(
      '0x786ad0e2df456fe43dd1f91ebca22e235bc162e0bb8d53c633e8c85b2af68b7a',
    ),
  )

  const nonces = {
    ALICE: (await api.rpc.system.accountNextIndex(ALICE)).toBn(),
    BOB: (await api.rpc.system.accountNextIndex(BOB)).toBn(),
    CHARLIE: (await api.rpc.system.accountNextIndex(CHARLIE)).toBn(),
    DAVE: (await api.rpc.system.accountNextIndex(DAVE)).toBn(),
    EVE: (await api.rpc.system.accountNextIndex(EVE)).toBn(),
  }

  // ###########################################################################
  // Distribute funds!
  const transfer_amount = 100000000000 * util.BN_THOUSAND
  const transfers = []
  transfers.push(
    waitInBlock(
      alicePair,
      { nonce: nonces.ALICE.clone() },
      api.tx.preCurrencyMint.transfer(
        DEFAULT_CURRENCY,
        CHARLIE,
        transfer_amount,
      ),
    ),
  )
  nonces.ALICE.iaddn(1)
  console.log('Transfer ALICE -> CHARLIE', transfer_amount)

  transfers.push(
    waitInBlock(
      alicePair,
      { nonce: nonces.ALICE.clone() },
      api.tx.preCurrencyMint.transfer(DEFAULT_CURRENCY, DAVE, transfer_amount),
    ),
  )
  nonces.ALICE.iaddn(1)
  console.log('Transfer ALICE -> DAVE', transfer_amount)

  transfers.push(
    waitInBlock(
      alicePair,
      { nonce: nonces.ALICE.clone() },
      api.tx.preCurrencyMint.transfer(DEFAULT_CURRENCY, EVE, transfer_amount),
    ),
  )
  nonces.ALICE.iaddn(1)
  console.log('Transfer ALICE -> EVE', transfer_amount)

  await Promise.all(transfers)
  console.log('all transfers done.')
  await log_balances(api, DEFAULT_CURRENCY)

  // ###########################################################################
  // Promote Bob and Charlie to issuers
  const admit = []
  admit.push(
    waitInBlock(
      alicePair,
      { nonce: nonces.ALICE.clone() },
      api.tx.sudo.sudo(
        api.tx.issuerCouncil.admitNewMember(
          BOB,
          BOB,
          util.BN_THOUSAND * util.BN_THOUSAND,
          BOB_CURRENCY,
        ),
      ),
    ),
  )
  nonces.ALICE.iaddn(1)
  console.log('BOB applied for a seat')

  admit.push(
    waitInBlock(
      alicePair,
      { nonce: nonces.ALICE.clone() },
      api.tx.sudo.sudo(
        api.tx.issuerCouncil.admitNewMember(
          CHARLIE,
          CHARLIE,
          util.BN_THOUSAND * util.BN_THOUSAND,
          CHARLIE_CURRENCY,
        ),
      ),
    ),
  )
  nonces.ALICE.iaddn(1)

  console.log('BOB & CHARLIE admitted as member per alices authority')

  await Promise.all(admit)

  // ###########################################################################
  // Bob & Charlie bond their funds
  const bond_tx = []
  bond_tx.push(
    waitInBlock(
      bobPair,
      { nonce: nonces.BOB.clone() },
      api.tx.multiStake.bond(BOB, BOB_CURRENCY, util.BN_TEN * util.BN_THOUSAND),
    ),
  )
  nonces.BOB.iaddn(1)

  bond_tx.push(
    waitInBlock(
      charliePair,
      { nonce: nonces.CHARLIE.clone() },
      api.tx.multiStake.bond(
        CHARLIE,
        CHARLIE_CURRENCY,
        util.BN_TEN * util.BN_THOUSAND,
      ),
    ),
  )
  nonces.CHARLIE.iaddn(1)
  await Promise.all(bond_tx)
  console.log('BOB and CHARLIE bonded')

  // ###########################################################################
  // Eve applies as Issuer, Bob&Charlie vote Eve in
  await waitInBlock(
    evePair,
    { nonce: nonces.EVE.clone() },
    api.tx.issuerCouncil.applyForSeat(
      EVE,
      util.BN_THOUSAND * util.BN_THOUSAND,
      EVE_CURRENCY,
      null,
    ),
  )
  nonces.EVE.iaddn(1)

  const proposals = await api.query.issuerCouncil.councilProposals()
  console.log(`Current proposals: ${proposals}s`)
  const eves_application = proposals[0]
  console.log(`EVE applied (proposal: ${eves_application})`)

  const vote_txs = []
  vote_txs.push(
    waitInBlock(
      bobPair,
      { nonce: nonces.BOB.clone() },
      api.tx.issuerCouncil.vote(eves_application.proposal_hash, true),
    ),
  )
  nonces.BOB.iaddn(1)

  vote_txs.push(
    waitInBlock(
      charliePair,
      { nonce: nonces.CHARLIE.clone() },
      api.tx.issuerCouncil.vote(eves_application.proposal_hash, true),
    ),
  )
  nonces.CHARLIE.iaddn(1)
  await Promise.all(vote_txs)

  console.log('BOB & CHARLIE voted')
}

async function setup(execute) {
  await util_crypto.cryptoWaitReady()
  const wsProvider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({
    provider: wsProvider,
    types,
  })

  await execute(api)

  await api.disconnect()
}

setup(fill_council_and_vote)