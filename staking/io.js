const fs = require('fs').promises;

// read menomincs from file
async function readKeysFromFile(path) {
    const content = await fs.readFile(path);
    console.log(JSON.parse(content));
    return JSON.parse(content)
}

// convert list of accounts into collator and delegator buckets
function accountsToCollatorsDelegators(accounts, numCols) {
    const collators = accounts.slice(0, numCols)
    const delegators = accounts.slice(numCols + 1, accounts.length)
    return { collators, delegators }
}

// write menomics to file in order to teardown setup with same privkeys (required for Peregrine)
async function writeKeysToFile(mnemonics, numCols) {
    const { collators, delegators } = accountsToCollatorsDelegators(mnemonics, numCols);
    const fileName = `${new Date().getTime()}_mnemonics.txt`
    await fs.writeFile(fileName, JSON.stringify({ collators, delegators })).catch(console.error)
}

module.exports = {
    accountsToCollatorsDelegators,
    readKeysFromFile,
    writeKeysToFile
}