export type NotificationEvent =
  | "session.complete"
  | "session.error"
  | "intervention.required"
  | "cost.threshold"
  | "report.ready"
  | "custom";

export interface NotifierConfig {
  /** Apprise URLs discovered from NOTIFY_* env vars */
  urls: string[];
  /** Whether notifications are enabled */
  enabled: boolean;
}

export interface NotificationPayload {
  event: NotificationEvent;
  title: string;
  body: string;
  tags?: string[];
}
