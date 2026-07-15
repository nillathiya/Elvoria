// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { adminMeController } from "@/lib/server/controllers/admin-auth-controller";

export const GET = withApi(adminMeController);
