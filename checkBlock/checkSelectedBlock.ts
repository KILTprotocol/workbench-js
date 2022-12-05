import { buildApiPromise } from "./buildApiPromise"
import { checkBlock } from "./checkBlock"

async function setup() {
  const api = await buildApiPromise()

  console.log(`Start fun with ${api.runtimeVersion.specName.toString()}`)
  console.log(`Start fun with ${api.runtimeChain.toString()}`)

  // Blocks that caused issues before.
  for (const bNumber of [
    2241767, 2241768
  ]) {
    await checkBlock(api, bNumber)
  }

  console.log(`End fun`)

  await api.disconnect()
}

setup()
