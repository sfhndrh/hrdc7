/** Stored on `Trainer.deliveryModes` — keep in sync with registration UI. */
export const DELIVERY_MODE_OPTIONS = [
  "On-site",
  "Virtual / online",
  "Hybrid",
] as const;

export type DeliveryModeOption = (typeof DELIVERY_MODE_OPTIONS)[number];
