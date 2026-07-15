// TRX (native) on TRON — spec §13.
import { NETWORKS } from "../../config/blockchain-config.js";
import { verifyTronNative } from "./tron-common.js";

export const id = "tron-native-verifier";

export function verify({ method, txHash, addresses }) {
  return verifyTronNative({ network: NETWORKS.TRON, method, txHash, addresses });
}
