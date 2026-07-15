// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { listMethodsController, createMethodController } from "@/lib/server/controllers/deposit-method-controller";

export const GET = withApi(listMethodsController);
export const POST = withApi(createMethodController);
