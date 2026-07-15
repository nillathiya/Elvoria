// BNB (native) on BNB Smart Chain — spec §13.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyEvmNative } from "../evm/evm-common.js";

export const id = "bsc-native-verifier";

export function verify({ method, txHash, addresses }) {
  // The network is bound here, not taken from the request: a peer selecting a
  // method must not be able to steer verification at another chain (§26.14).
  return verifyEvmNative({ network: NETWORKS.BSC, method, txHash, addresses });
}
