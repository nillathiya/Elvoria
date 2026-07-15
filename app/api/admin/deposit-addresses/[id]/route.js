// Thin route — logic lives in the controller (spec §23).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { withApi } from "@/lib/server/middleware/api-handler";
import { updateAddressController, deleteAddressController } from "@/lib/server/controllers/deposit-address-controller";

export const PUT = withApi(updateAddressController);
export const DELETE = withApi(deleteAddressController);
