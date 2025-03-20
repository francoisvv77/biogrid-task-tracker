
import { toast } from "sonner";

const SMARTSHEET_API_KEY = "mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq";
const SHEET_ID = "Xm5q7pjVVRWXrHPRg73Qv79Xh96CgCVGvXcg4hm1";
const API_URL = "https://api.smartsheet.com/2.0";

// Column IDs for all fields
export const COLUMNS = {
  TASK_ID: 7329347793014660,
  TASK_TYPE: 292473375248260,
  SPONSOR: 8455247699857284,
  PROJECT_NAME: 1825748165644164,
  EDC_SYSTEM: 3951648072486788,
  INTEGRATIONS: 5921972909461380,
  DESCRIPTION: 1418373282090884,
  START_DATE: 1699848258801540,
  END_DATE: 6203447886172036,
  SCOPED_HOURS: 3951648072486788,
  STATUS: 4796073002618756,
  ALLOCATED: 2544273188933508,
  TEAM: 7047872816304004,
  REQUESTOR: 7329347793014660,
  REQUESTOR_EMAIL: 1825748165644164,
  REQUESTOR_ID: 292473375248260,
  PRIORITY: 8297885466840964
};

// Interface for task data
export interface TaskData {
  id?: string;
  taskType: string;
  sponsor: string;
  projectName: string;
  edcSystem: string;
  integrations: string;
  description: string;
  startDate: string;
  endDate: string;
  scopedHours: number;
  priority?: string;
  status?: string;
  allocated?: string;
  team?: string[];
  requestor?: string;
  requestorEmail?: string;
  requestorId?: string;
}

// Function to generate a unique ID
export const generateUniqueId = (): string => {
  return `TASK-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

// Function to convert a task to Smartsheet row format
const taskToRow = (task: TaskData) => {
  return {
    cells: [
      { columnId: COLUMNS.TASK_ID, value: task.id || generateUniqueId() },
      { columnId: COLUMNS.TASK_TYPE, value: task.taskType },
      { columnId: COLUMNS.SPONSOR, value: task.sponsor },
      { columnId: COLUMNS.PROJECT_NAME, value: task.projectName },
      { columnId: COLUMNS.EDC_SYSTEM, value: task.edcSystem },
      { columnId: COLUMNS.INTEGRATIONS, value: task.integrations },
      { columnId: COLUMNS.DESCRIPTION, value: task.description },
      { columnId: COLUMNS.START_DATE, value: task.startDate },
      { columnId: COLUMNS.END_DATE, value: task.endDate },
      { columnId: COLUMNS.SCOPED_HOURS, value: task.scopedHours.toString() },
      { columnId: COLUMNS.PRIORITY, value: task.priority || "Medium" },
      { columnId: COLUMNS.STATUS, value: task.status || "Pending Allocation" },
      { columnId: COLUMNS.ALLOCATED, value: task.allocated || "" },
      { columnId: COLUMNS.TEAM, value: task.team ? task.team.join(", ") : "" },
      { columnId: COLUMNS.REQUESTOR, value: task.requestor || "" },
      { columnId: COLUMNS.REQUESTOR_EMAIL, value: task.requestorEmail || "" },
      { columnId: COLUMNS.REQUESTOR_ID, value: task.requestorId || generateUniqueId() }
    ]
  };
};

// Function to convert Smartsheet row to task format
export const rowToTask = (row: any): TaskData => {
  const cells = row.cells;
  const getCellValue = (columnId: number) => {
    const cell = cells.find((c: any) => c.columnId === columnId);
    return cell && cell.value ? cell.value : "";
  };

  return {
    id: getCellValue(COLUMNS.TASK_ID),
    taskType: getCellValue(COLUMNS.TASK_TYPE),
    sponsor: getCellValue(COLUMNS.SPONSOR),
    projectName: getCellValue(COLUMNS.PROJECT_NAME),
    edcSystem: getCellValue(COLUMNS.EDC_SYSTEM),
    integrations: getCellValue(COLUMNS.INTEGRATIONS),
    description: getCellValue(COLUMNS.DESCRIPTION),
    startDate: getCellValue(COLUMNS.START_DATE),
    endDate: getCellValue(COLUMNS.END_DATE),
    scopedHours: parseInt(getCellValue(COLUMNS.SCOPED_HOURS)) || 0,
    priority: getCellValue(COLUMNS.PRIORITY),
    status: getCellValue(COLUMNS.STATUS),
    allocated: getCellValue(COLUMNS.ALLOCATED),
    team: getCellValue(COLUMNS.TEAM) ? getCellValue(COLUMNS.TEAM).split(", ") : [],
    requestor: getCellValue(COLUMNS.REQUESTOR),
    requestorEmail: getCellValue(COLUMNS.REQUESTOR_EMAIL),
    requestorId: getCellValue(COLUMNS.REQUESTOR_ID)
  };
};

// API functions
export const smartsheetApi = {
  // Get all tasks from Smartsheet
  getTasks: async (): Promise<TaskData[]> => {
    try {
      const response = await fetch(`${API_URL}/sheets/${SHEET_ID}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SMARTSHEET_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        console.error("Smartsheet API error:", await response.text());
        throw new Error("Failed to fetch tasks");
      }
      
      const data = await response.json();
      return data.rows.map(rowToTask);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks. Please try again.");
      return [];
    }
  },
  
  // Add a new task to Smartsheet
  addTask: async (task: TaskData): Promise<boolean> => {
    try {
      // Ensure task has a unique ID
      if (!task.id) {
        task.id = generateUniqueId();
      }
      
      // Set default status if not provided
      if (!task.status) {
        task.status = "Pending Allocation";
      }
      
      const row = taskToRow(task);
      console.log("Sending task to Smartsheet:", JSON.stringify(row));
      
      const response = await fetch(`${API_URL}/sheets/${SHEET_ID}/rows`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SMARTSHEET_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([row])
      });
      
      const responseData = await response.text();
      console.log("Smartsheet API response:", responseData);
      
      if (!response.ok) {
        console.error("Error response:", responseData);
        throw new Error("Failed to create task");
      }
      
      toast.success("Task created successfully");
      return true;
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to create task. Please try again.");
      return false;
    }
  },
  
  // Update a task in Smartsheet
  updateTask: async (task: TaskData): Promise<TaskData | null> => {
    try {
      // Find the row ID for the task
      const allTasks = await smartsheetApi.getTasks();
      const existingTask = allTasks.find(t => t.id === task.id);
      
      if (!existingTask) {
        throw new Error("Task not found");
      }
      
      const row = taskToRow(task);
      
      const response = await fetch(`${API_URL}/sheets/${SHEET_ID}/rows`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${SMARTSHEET_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([row])
      });
      
      if (!response.ok) {
        console.error("Error response:", await response.text());
        throw new Error("Failed to update task");
      }
      
      toast.success("Task updated successfully");
      return task;
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task. Please try again.");
      return null;
    }
  },
  
  // Allocate a task to team members
  allocateTask: async (taskId: string, leadBuilder: string, team: string[]): Promise<boolean> => {
    try {
      // Find the task first
      const allTasks = await smartsheetApi.getTasks();
      const task = allTasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      // Update the task with allocation information
      task.allocated = leadBuilder;
      task.team = team;
      task.status = "Assigned";
      
      const result = await smartsheetApi.updateTask(task);
      return !!result;
    } catch (error) {
      console.error("Error allocating task:", error);
      toast.error("Failed to allocate task. Please try again.");
      return false;
    }
  }
};

// Alias for backward compatibility if needed
export const addTaskToSmartsheet = smartsheetApi.addTask;
