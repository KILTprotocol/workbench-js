This package aims to fill and empty collator and delegator slots of a temp KILT parachain.

## Set the env

You need to set three environment variables in order to run the script:

* `FAUCET`: The private key (hex/seed phrase) for the origin which sends funds to the collators and delegators.
Needs ~1.4 MKILT for 68 new collators and 70*35 delegators.
* `WS_ADDRESS`: The endpoint of your temporary chain
* `ACTION`: Either `up` for filling slots or `down` for removing the temporarily added collators and delegators.


## How to run

```
node index.js
```

### Up

The script will fill up to 70 collator candidates and all existing candidates with delegators (70 * 35).
The temporary accounts' seeds will be based on the `FAUCET` seed phrase and a number:

* Collator: `${baseSeed}//c//${index}`
* Delegator: `${baseSeed}//c//${colIndex}//d//${delIndex}`

### Down

For destruction, we assume all temporarily added collators have made it to the validators yet, e.g. less than two epochs (4 hours in total) have passed since adding the collators.

They will be removed via SUDO call.
Thus, the `FAUCET` seed is expected to have sudo power.
For KILT Dev chains, this will be `//Alice`, e.g. `0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a`.

Without sudo, the candidates would have to call `initLeaveCandidates`, then wait up to two sessions and exit by calling `executeLeaveCandidates`.