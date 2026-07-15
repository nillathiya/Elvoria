// BEP-20 tokens (USDT, USDC…) on BNB Smart Chain — spec §13, §16.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyEvmToken } from "../evm/evm-common.js";

export const id = "bsc-token-verifier";

export function verify({ method, txHash, addresses }) {
  return verifyEvmToken({ network: NETWORKS.BSC, method, txHash, addresses });
}
