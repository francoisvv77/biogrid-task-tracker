import { toast } from "sonner";

const SMARTSHEET_API_KEY = "mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq";
const SHEET_ID = "Xm5q7pjVVRWXrHPRg73Qv79Xh96CgCVGvXcg4hm1";
// Use proxy URL instead of direct API URL to avoid CORS issues
const API_URL = "/api/smartsheet";

// Column IDs for all fields
export const COLUMNS = {
  TASK_ID: 1542486025785220,
  TASK_TYPE: 3794285839470468 ,
  TASK_SUB_TYPE: 1101306951585668,
  SPONSOR: 292473375248260,
  PROJECT_NAME: 6046085653155716,
  EDC_SYSTEM: 979536072363908,
  INTEGRATIONS: 5483135699734404,
  DESCRIPTION: 8297885466840964,
  START_DATE: 7329347793014660,
  END_DATE: 1699848258801540,
  SCOPED_HOURS: 6203447886172036,
  STATUS: 4675173699768196,
  ALLOCATED: 3951648072486788,
  TEAM: 8455247699857284,
  REQUESTOR: 4796073002618756,
  REQUESTOR_EMAIL: 2544273188933508,
  REQUESTOR_ID: 7047872816304004,
  PRIORITY: 4486824754106244,
  DOCUMENTATION: 6797118633365380
};

// Interface for task data
export interface TaskData {
  id?: string;
  taskType: string;
  taskSubType?: string;
  sponsor: string;
  projectName: string;
  edcSystem: string;
  integrations: string;
  documentation?: string;
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
  rowId?: number; // Smartsheet row ID needed for updates
}

interface SmartsheetRow {
  toTop?: boolean;
  cells: {
    columnId: number;
    value: string | number;
  }[];
}

// Function to generate a unique ID
export const generateUniqueId = (): string => {
  return `TASK-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

// Function to convert a task to Smartsheet row format
const taskToRow = (task: TaskData, rowId?: number) => {
  // Ensure team is an array before trying to join it
  let teamValue = "";
  if (task.team) {
    if (Array.isArray(task.team)) {
      teamValue = task.team.join(", ");
    } else {
      console.warn("Task team is not an array:", task.team);
      teamValue = String(task.team);
    }
  }

  return {
    id: rowId, // Include row ID if available (required for updates)
    cells: [
      { columnId: COLUMNS.TASK_ID, value: task.id || generateUniqueId() },
      { columnId: COLUMNS.TASK_TYPE, value: task.taskType },
      { columnId: COLUMNS.TASK_SUB_TYPE, value: task.taskSubType || "" },
      { columnId: COLUMNS.SPONSOR, value: task.sponsor },
      { columnId: COLUMNS.PROJECT_NAME, value: task.projectName },
      { columnId: COLUMNS.EDC_SYSTEM, value: task.edcSystem },
      { columnId: COLUMNS.INTEGRATIONS, value: task.integrations },
      { columnId: COLUMNS.DESCRIPTION, value: task.description },
      { columnId: COLUMNS.DOCUMENTATION, value: task.documentation || "" },
      { columnId: COLUMNS.START_DATE, value: task.startDate },
      { columnId: COLUMNS.END_DATE, value: task.endDate },
      { columnId: COLUMNS.SCOPED_HOURS, value: task.scopedHours.toString() },
      { columnId: COLUMNS.PRIORITY, value: task.priority || "Medium" },
      { columnId: COLUMNS.STATUS, value: task.status || "Pending Allocation" },
      { columnId: COLUMNS.ALLOCATED, value: task.allocated || "" },
      { columnId: COLUMNS.TEAM, value: teamValue },
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
    taskSubType: getCellValue(COLUMNS.TASK_SUB_TYPE),
    sponsor: getCellValue(COLUMNS.SPONSOR),
    projectName: getCellValue(COLUMNS.PROJECT_NAME),
    edcSystem: getCellValue(COLUMNS.EDC_SYSTEM),
    integrations: getCellValue(COLUMNS.INTEGRATIONS),
    documentation: getCellValue(COLUMNS.DOCUMENTATION),
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
    requestorId: getCellValue(COLUMNS.REQUESTOR_ID),
    rowId: row.id // Save the Smartsheet row ID
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
          "Content-Type": "application/json"
          // Authorization header is added by the proxy
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
          "Content-Type": "application/json"
          // Authorization header is added by the proxy
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
        console.error("Task not found:", task.id);
        throw new Error("Task not found");
      }
      
      // Deep copy the task to avoid reference issues
      const taskToUpdate = { ...task };
      
      // Ensure team is properly formatted
      if (taskToUpdate.team === undefined) {
        console.log("Team is undefined, initializing as empty array");
        taskToUpdate.team = [];
      } else if (!Array.isArray(taskToUpdate.team)) {
        console.error("Team is not an array, fixing:", taskToUpdate.team);
        // Try to convert to array if it's a string
        if (typeof taskToUpdate.team === 'string' && (taskToUpdate.team as string).includes(',')) {
          taskToUpdate.team = (taskToUpdate.team as string).split(',').map(item => item.trim());
        } else {
          taskToUpdate.team = [];
        }
      }
      
      // Use the rowId from the existing task
      const row = taskToRow(taskToUpdate, existingTask.rowId);
      
      console.log("Updating task with data:", JSON.stringify(taskToUpdate, null, 2));
      
      const response = await fetch(`${API_URL}/sheets/${SHEET_ID}/rows`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
          // Authorization header is added by the proxy
        },
        body: JSON.stringify([row])
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to update task");
      }
      
      toast.success("Task updated successfully");
      return taskToUpdate;
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
  },

  addRows: async (sheetId: string, rows: SmartsheetRow[]): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/sheets/${sheetId}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Authorization header is added by the proxy
        },
        body: JSON.stringify(rows),
      });

      if (!response.ok) {
        throw new Error('Failed to add rows to Smartsheet');
      }
    } catch (error) {
      console.error('Error adding rows to Smartsheet:', error);
      throw error;
    }
  },
};

// Alias for backward compatibility if needed
export const addTaskToSmartsheet = smartsheetApi.addTask;
