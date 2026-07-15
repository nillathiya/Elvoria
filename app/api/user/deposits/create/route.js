// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { createDepositController } from "@/lib/server/controllers/user-deposit-controller";

export const POST = withApi(createDepositController);
