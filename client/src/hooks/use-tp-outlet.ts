import { useOutletContext } from "react-router-dom";
import type { TpOrg } from "@/lib/tp-platform";

export type TpOutletContext = {
  org: TpOrg | null;
  approved: boolean;
  isAdmin: boolean;
};

export function useTpOutlet() {
  return useOutletContext<TpOutletContext>();
}
