// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { setMethodStatusController } from "@/lib/server/controllers/deposit-method-controller";

export const PATCH = withApi(setMethodStatusController);
