import { buildApiPromise } from "./buildApiPromise"
import { checkBlock } from "./checkBlock"

async function setup() {
  const api = await buildApiPromise()

  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  // OK
  for (const bNumber of [
    156, 67016, 67332, 67373, 73929, 74507, 80942,
  ]) {
    await checkBlock(api, bNumber)
  }

  console.log("\n\n\n\n")

  // NOT OK
  for (const bNumber of [
    74333, 79544, 79549, 142865, 263391,
    263606, 269649, 279827, 307750, 2241768, 2241767
  ]) {
    await checkBlock(api, bNumber)
  }

  console.log(`End fun`)

  await api.disconnect()
}

setup()
