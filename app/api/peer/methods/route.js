// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { peerMethodsController } from "@/lib/server/controllers/peer-verification-controller";

export const GET = withApi(peerMethodsController);
