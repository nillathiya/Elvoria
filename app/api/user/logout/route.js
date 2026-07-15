// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs"; // file storage needs fs, not the edge runtime
export const dynamic = "force-dynamic"; // auth state must never be cached
import { withApi } from "@/lib/server/middleware/api-handler";
import { userLogoutController } from "@/lib/server/controllers/user-auth-controller";

export const POST = withApi(userLogoutController);
