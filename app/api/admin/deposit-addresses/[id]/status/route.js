// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { setAddressStatusController } from "@/lib/server/controllers/deposit-address-controller";

export const PATCH = withApi(setAddressStatusController);
