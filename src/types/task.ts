export interface TaskData {
  id: string;
  name: string;
  project: string;
  sponsor: string;
  status: string;
  edcSystem: string;
  taskType: string;
  allocated?: string;
  team?: string[];
  scopedHours?: number;
  startDate?: string;
  endDate?: string;
  projectName?: string;
} 