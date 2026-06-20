import type { Status } from "@/types/erp";

export function statusTone(status: Status | string) {
  if (["Completed", "Healthy", "Confirmed"].includes(status)) return "success";
  if (["Delayed", "Draft", "In Progress"].includes(status)) return "warning";
  if (["Critical", "High"].includes(status)) return "danger";
  return "neutral";
}
