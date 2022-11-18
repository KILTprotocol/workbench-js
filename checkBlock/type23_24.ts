export const types23_24 = {
  minmax: [23, 24],
  types: {
    AccountInfo: 'AccountInfoWithTripleRefCount',
    Address: 'MultiAddress',
    AmountOf: 'i128',
    Balance: 'u128',
    BlockNumber: 'u64',
    Index: 'u64',
    LookupSource: 'MultiAddress',
    CtypeCreatorOf: 'AccountId',
    CtypeHashOf: 'Hash',
    ClaimHashOf: 'Hash',
    AttesterOf: 'AccountId',
    AttestationDetails: {
      ctypeHash: 'CtypeHashOf',
      attester: 'AttesterOf',
      delegationId: 'Option<DelegationNodeIdOf>',
      revoked: 'bool',
    },
    Permissions: 'u32',
    DelegationNodeIdOf: 'Hash',
    DelegatorIdOf: 'AccountId',
    DelegateSignatureTypeOf: 'DidSignature',
    DelegationRoot: {
      ctypeHash: 'CtypeHashOf',
      owner: 'DelegatorIdOf',
      revoked: 'bool',
    },
    DelegationNode: {
      hierarchyRootId: 'DelegationNodeIdOf',
      parent: 'Option<DelegationNodeIdOf>',
      children: 'BoundedBTreeSet<DelegationNodeIdOf, MaxChildren>',
      details: 'DelegationDetails',
    },
    KeyIdOf: 'Hash',
    DidIdentifierOf: 'AccountId',
    AccountIdentifierOf: 'AccountId',
    BlockNumberOf: 'BlockNumber',
    DidCallableOf: 'Call',
    DidVerificationKey: {
      _enum: {
        Ed25519: '[u8; 32]',
        Sr25519: '[u8; 32]',
        Secp256k1: '[u8; 33]',
      },
    },
    DidEncryptionKey: {
      _enum: {
        X25519: '[u8; 32]',
      },
    },
    DidPublicKey: {
      _enum: {
        PublicVerificationKey: 'DidVerificationKey',
        PublicEncryptionKey: 'DidEncryptionKey',
      },
    },
    DidVerificationKeyRelationship: {
      _enum: [
        'Authentication',
        'CapabilityDelegation',
        'CapabilityInvocation',
        'AssertionMethod',
      ],
    },
    DidSignature: {
      _enum: {
        Ed25519: 'Ed25519Signature',
        Sr25519: 'Sr25519Signature',
        'Ecdsa-Secp256k1': 'EcdsaSignature',
      },
    },
    DidError: {
      _enum: {
        StorageError: 'StorageError',
        SignatureError: 'SignatureError',
        UrlError: 'UrlError',
        InputError: 'InputError',
        InternalError: 'Null',
      },
    },
    StorageError: {
      _enum: {
        DidAlreadyPresent: 'Null',
        DidNotPresent: 'Null',
        DidKeyNotPresent: 'DidVerificationKeyRelationship',
        VerificationKeyNotPresent: 'Null',
        CurrentlyActiveKey: 'Null',
        MaxTxCounterValue: 'Null',
        MaxPublicKeysPerDidKeyIdentifierExceeded: 'Null',
        MaxTotalKeyAgreementKeysExceeded: 'Null',
        MaxOldAttestationKeysExceeded: 'Null',
      },
    },
    SignatureError: {
      _enum: ['InvalidSignatureFormat', 'InvalidSignature', 'InvalidNonce'],
    },
    KeyError: {
      _enum: ['InvalidVerificationKeyFormat', 'InvalidEncryptionKeyFormat'],
    },
    UrlError: {
      _enum: ['InvalidUrlEncoding', 'InvalidUrlScheme'],
    },
    InputError: {
      _enum: [
        'MaxKeyAgreementKeysLimitExceeded',
        'MaxVerificationKeysToRemoveLimitExceeded',
        'MaxUrlLengthExceeded',
      ],
    },
    DidPublicKeyDetails: {
      key: 'DidPublicKey',
      blockNumber: 'BlockNumberOf',
    },
    DidDetails: {
      authenticationKey: 'KeyIdOf',
      keyAgreementKeys: 'DidKeyAgreementKeys',
      capabilityDelegationKey: 'Option<KeyIdOf>',
      assertionMethodKey: 'Option<KeyIdOf>',
      publicKeys: 'DidPublicKeyMap',
      serviceEndpoints: 'Option<ServiceEndpoints>',
      lastTxCounter: 'u64',
    },
    DidAuthorizedCallOperation: {
      did: 'DidIdentifierOf',
      txCounter: 'u64',
      call: 'DidCallableOf',
    },
    HttpUrl: {
      payload: 'Text',
    },
    FtpUrl: {
      payload: 'Text',
    },
    IpfsUrl: {
      payload: 'Text',
    },
    Url: {
      _enum: {
        Http: 'HttpUrl',
        Ftp: 'FtpUrl',
        Ipfs: 'IpfsUrl',
      },
    },
    LockedBalance: {
      block: 'BlockNumber',
      amount: 'Balance',
    },
    BalanceOf: 'u128',
    RoundInfo: {
      current: 'SessionIndex',
      first: 'BlockNumber',
      length: 'BlockNumber',
    },
    Stake: {
      owner: 'AccountId',
      amount: 'Balance',
    },
    TotalStake: {
      collators: 'Balance',
      delegators: 'Balance',
    },
    InflationInfo: {
      collator: 'StakingInfo',
      delegator: 'StakingInfo',
    },
    StakingInfo: {
      maxRate: 'Perquintill',
      rewardRate: 'RewardRate',
    },
    RewardRate: {
      annual: 'Perquintill',
      perBlock: 'Perquintill',
    },
    Delegator: {
      delegations: 'Vec<Stake>',
      total: 'Balance',
    },
    DelegationCounter: {
      round: 'SessionIndex',
      counter: 'u32',
    },
    DelegationDetails: {
      owner: 'DelegatorIdOf',
      revoked: 'bool',
      permissions: 'Permissions',
    },
    DelegationHierarchyDetails: {
      ctypeHash: 'CtypeHashOf',
    },
    DelegationStorageVersion: {
      _enum: ['V1', 'V2'],
    },
    DidCreationDetails: {
      did: 'DidIdentifierOf',
      newKeyAgreementKeys: 'DidNewKeyAgreementKeys',
      newAssertionMethodKey: 'Option<DidVerificationKey>',
      newCapabilityDelegationKey: 'Option<DidVerificationKey>',
      newServiceEndpoints: 'Option<ServiceEndpoints>',
    },
    ServiceEndpoints: {
      contentHash: 'Hash',
      urls: 'BoundedVec<Url, MaxEndpointUrlsCount>',
      contentType: 'ContentType',
    },
    DidFragmentUpdateAction_ServiceEndpoints: {
      _enum: {
        Ignore: 'Null',
        Change: 'ServiceEndpoints',
        Delete: 'Null',
      },
    },
    DidFragmentUpdateAction_DidVerificationKey: {
      _enum: {
        Ignore: 'Null',
        Change: 'DidVerificationKey',
        Delete: 'Null',
      },
    },
    ContentType: {
      _enum: ['application/json', 'application/ld+json'],
    },
    DidStorageVersion: {
      _enum: ['V1', 'V2'],
    },
    MaxDelegatorsPerCollator: 'u32',
    MaxCollatorsPerDelegator: 'u32',
    StakingStorageVersion: {
      _enum: ['V1_0_0', 'V2_0_0', 'V3_0_0', 'V4', 'V5'],
    },
    MaxDelegatedAttestations: 'u32',
    MaxClaims: 'u32',
    MaxChildren: 'u32',
    DidNewKeyAgreementKeys:
      'BoundedBTreeSet<DidEncryptionKey, MaxNewKeyAgreementKeys>',
    DidKeyAgreementKeys: 'BoundedBTreeSet<KeyIdOf, MaxTotalKeyAgreementKeys>',
    DidVerificationKeysToRevoke:
      'BoundedBTreeSet<KeyIdOf, MaxVerificationKeysToRevoke>',
    MaxNewKeyAgreementKeys: 'u32',
    MaxTotalKeyAgreementKeys: 'u32',
    MaxVerificationKeysToRevoke: 'u32',
    MaxPublicKeysPerDid: 'u32',
    DidPublicKeyMap:
      'BoundedBTreeMap<KeyIdOf, DidPublicKeyDetails, MaxPublicKeysPerDid>',
    MaxUrlLength: 'u32',
    MaxEndpointUrlsCount: 'u32',
    MinCollators: 'u32',
    MaxTopCandidates: 'u32',
    Candidate: {
      id: 'AccountId',
      stake: 'Balance',
      delegators: 'Vec<Stake>',
      total: 'Balance',
      status: 'CandidateStatus',
    },
    CandidateStatus: {
      _enum: {
        Active: 'Null',
        Leaving: 'SessionIndex',
      },
    },
  },
}
