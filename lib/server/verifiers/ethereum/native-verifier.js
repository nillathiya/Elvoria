// ETH (native) on Ethereum mainnet — spec §13.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyEvmNative } from "../evm/evm-common.js";

export const id = "eth-native-verifier";

export function verify({ method, txHash, addresses }) {
  return verifyEvmNative({ network: NETWORKS.ETH, method, txHash, addresses });
}
