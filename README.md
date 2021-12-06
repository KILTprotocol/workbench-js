This repository serves as a simple collection of useful scripts for the KILT Spiritnet.

 ⚠️ None of the scripts have been audited and were only used in dev environments, so use them at your own risk. ⚠️

## Staking rewards

Simple script to determine the amount of staking rewards a target address gathered within some interval of blocks.
The target address should either be a collator or a delegator.

The script traverses from the starting to the end block and checks whether the `parachainStaking.Rewarded` event targetted the configured target address.
For each occurence, the corresponding reward and total amount since the starting block will be printed out.

```
Checking block 137687 with hash 0x7b6ca75b5fd22b3a8222cc823fed65072cc4efb88dac6db07a0ebac94dc53563.
         4tDf2xTK1opjuzSBtok6c9nvuNcugp4Qat4E1dK7gPanZWVg received 0.182522899076976 KILT.
         Total rewards since start (#132305): 61.692739888018224 KILT.
```

Eventually, the entire table of rewards will be printed, which you could easily convert into a CSV.
```
┌─────────┬─────────────┬──────────────────────────────────────────────────────────────────────┬───────────────────┐
│ (index) │ blockNumber │                              blockHash                               │      amount       │
├─────────┼─────────────┼──────────────────────────────────────────────────────────────────────┼───────────────────┤
│    0    │   132316    │ '0x4405d730be360fbaeca44b9dbecbb651f39b14f4ef7c5345ffa029a3b0252318' │ 0.182522899076976 │
│    1    │   132331    │ '0xdb510d673c51d70a6cdb8872a383d9db44c114896675d81dda1cc1cb5efa9b4f' │ 0.182522899076976 │
│    2    │   132344    │ '0xbd4fa97a2bbda92f1c27470060c4ccd2ed1ba44a244a07aa4869af364ade2d67' │ 0.182522899076976 │
└─────────┴─────────────┴──────────────────────────────────────────────────────────────────────┴───────────────────┘
Total rewards: 0.5475686972309279
```

### How to use

Before executing the script, please configure the following parameters, either within [the script][./index.js] or via environment variables.

1. `KILT_ADDRESS`
2. `START_BLOCK`
3. `END_BLOCK`
4. Optional: `WS_ADDRESS`. Per default, we are using `wss:://spiritnet.kilt.io`.

### Example usage
```
KILT_ADDRESS="4tDf2xTK1opjuzSBtok6c9nvuNcugp4Qat4E1dK7gPanZWVg" START_BLOCK="0" END_BLOCK="100000" node stakingRewards.js
```

