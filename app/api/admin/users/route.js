// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { listUsersController } from "@/lib/server/controllers/user-controller";

export const GET = withApi(listUsersController);
