// ERC-20 tokens on Ethereum mainnet — spec §13, §16.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyEvmToken } from "../evm/evm-common.js";

export const id = "eth-token-verifier";

export function verify({ method, txHash, addresses }) {
  return verifyEvmToken({ network: NETWORKS.ETH, method, txHash, addresses });
}
