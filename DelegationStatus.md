# Check delegation status

To *check whether your delegation(s) are still active*, you can run the [delegationState.js](./delegationState.js) script:

```
node delegationState.js
```

Please configure your delegations before executing the script for each collator address you delegate to and delegator address which whom you delegate with like so:

```js
const DELEGATIONS = [
    {
        collator: "4qBSZdEoUxPVnUqbX8fjXovgtQXcHK7ZvSf56527XcDZUukq",
        delegators: [
            "4rEDw16xpfGpEohGgXLzn2Lnzq5wREGqGux9KPniVRmQYVMJ",
            "4qN132CPMM6cTCcPVfktus8HXUptmRf3YmkFmYkuBYRjsEY8"
        ]
    },
    {
        collator: "4oRRardEGiqYxzqsDyV4oJUc1GUm4qP6CnBxyAnDbo7nBrCi",
        delegators: [
            "4ru2qCW5hwsKBAPSDqpzMAg1kQsg8srn8JWdyi11hUad33DH",
            "4rLcQDzmSePUL4jCajEupocBBRqGiKJ3XLyu8v7AGChHpa9u"
        ]
    }
];

```