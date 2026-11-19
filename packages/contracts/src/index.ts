export type ModuleStatus = "in-development" | "coming-soon";

export interface WorkspaceApplication {
  slug: string;
  title: string;
  description: string;
  status: ModuleStatus;
}
