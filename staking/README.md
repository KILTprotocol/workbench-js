This project aims to temporarily fill all collator and delegator slots of a network.
It is meant to be used for testing purposes only, e.g. when a runtime upgrade migrates the state of delegators.

You can reverse the process by executing [teardown.js](./teardown.js), which is recommended for non-temporary networks such as Staging and Peregrine.

## Init

The flow of the [init script](./index.js) is

1. Init n + (1 + m) accounts _where n = number of collators_
2. Fund all accounts from Faucet
3. Spawn `n` new collators and `n * MAX_DELEGATORS_PER_COLLATOR` many delegators in a single block
4. Write wallet keys to file or log with timestamp (such that it does not overwrite existing files)

Then, you can execute the runtime upgrade.

** NOTE: Currently, the script does not work with 35 collators. 
The simple and hacky solution is to execute it twice two reach max collators and delegators.
E.g. once with 20 collators and a second time with 15 collators to reach 35 * 35 delegators
**

## Teardown

Since we write the menomics to a file, you can specify the file name in your `.env` and execute the [teardown scrip](./teardown.js).

_NOTE: For collators, it does not suffice to just initiate the leave intent. They would have to wait two sessions and then call `api.tx.parachainStaking.executeLeaveCandidates(collatorAddress)`.
This part was left out for simplicity_

1. Read mnemonics from latest file (requires setting filename in `.env`)
2. Execute `api.tx.parachainStaking.initLeaveCandidates()` and `api.tx.parachainStaking.leaveDelegators()` for all accounts

## TODO

### Must

* [ ] Fix script to work with max amount of collators (e.g. 37)

### Optional 

Add following hooks for POST UPGRADE phase:

* [ ] Stake more, less, leave, rejoin with Collator
* [ ] Stake more, less, leave, rejoin with Delegator
