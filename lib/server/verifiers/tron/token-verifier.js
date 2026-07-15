// TRC-20 tokens (USDT TRC20…) on TRON — spec §13, §16.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyTronToken } from "./tron-common.js";

export const id = "tron-token-verifier";

export function verify({ method, txHash, addresses }) {
  return verifyTronToken({ network: NETWORKS.TRON, method, txHash, addresses });
}
