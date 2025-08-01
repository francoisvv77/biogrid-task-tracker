import { toast } from "sonner";

const SMARTSHEET_API_KEY = "mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq";
const SHEET_ID = "4968623136264068";
// Use proxy URL instead of direct API URL to avoid CORS issues
const API_URL = "/api/smartsheet";

// Column IDs for all fields
export const COLUMNS = {
  TASK_ID: 1219205212622724,
  TASK_TYPE: 7974604653678468,
  AMENDMENT_NR: 5481524006440836,
  TASK_SUB_TYPE: 656255259201412,
  PROJECT_ID: 4358673526378372,
  SPONSOR: 5722804839993220,
  PROJECT_NAME: 3471005026307972,
  PRIORITY: 5159854886571908,
  EDC_SYSTEM: 1782155166044036,
  EXTERNAL_DATA: 6285754793414532,
  DOCUMENTATION: 7411654700257156,
  START_DATE: 4033954979729284,
  END_DATE: 8537554607099780,
  PROGRAMMING_SCOPED_HOURS: 5128291400503172,
  CDS_SCOPED_HOURS: 374780282490756,
  DESCRIPTION: 2908055072886660,
  REQUESTOR: 1500680189333380,
  REQUESTOR_EMAIL: 6004279816703876,
  LEAD_BUILDER: 4878379909861252,
  LEAD_CDS: 2876491586817924,
  TEAM: 7130179723546500,
  STATUS: 2626580096176004,
  // Metrics sheet columns
  METRICS_TASK_ID: 1219205212622724,
  METRICS_SPONSOR: 5722804839993220,
  UNITS: 4784697546854276,
  ERRORS: 2532897733169028,
};

// Interface for task data
export interface TaskData {
  id?: string;
  taskType: string;
  amendmentNr?: string;
  taskSubType?: string;
  projectId?: string;
  sponsor: string;
  projectName: string;
  priority?: string;
  edcSystem: string;
  externalData?: string;
  documentation?: string;
  startDate: string;
  endDate: string;
  scopedHours: number; // This will map to Programming Scoped Hours
  cdsHours?: number;   // New CDS Scoped Hours field
  description: string;
  requestor?: string;
  requestorEmail?: string;
  leadBuilder?: string;
  leadCDS?: string;
  // Legacy fields for compatibility
  integrations?: string;
  status?: string;
  allocated?: string;
  team?: string[];
  requestorId?: string;
  rowId?: number; // Smartsheet row ID needed for updates
}

interface SmartsheetRow {
  id?: number;
  toTop?: boolean;
  cells: {
    columnId: number;
    value: any;
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
      { columnId: COLUMNS.AMENDMENT_NR, value: task.amendmentNr || "" },
      { columnId: COLUMNS.TASK_SUB_TYPE, value: task.taskSubType || "" },
      { columnId: COLUMNS.PROJECT_ID, value: task.projectId || "" },
      { columnId: COLUMNS.SPONSOR, value: task.sponsor },
      { columnId: COLUMNS.PROJECT_NAME, value: task.projectName },
      { columnId: COLUMNS.PRIORITY, value: task.priority || "Medium" },
      { columnId: COLUMNS.EDC_SYSTEM, value: task.edcSystem },
      { columnId: COLUMNS.EXTERNAL_DATA, value: task.externalData || "" },
      { columnId: COLUMNS.DOCUMENTATION, value: task.documentation || "" },
      { columnId: COLUMNS.START_DATE, value: task.startDate },
      { columnId: COLUMNS.END_DATE, value: task.endDate },
      { columnId: COLUMNS.PROGRAMMING_SCOPED_HOURS, value: task.scopedHours.toString() },
      { columnId: COLUMNS.CDS_SCOPED_HOURS, value: (task.cdsHours || 0).toString() },
      { columnId: COLUMNS.DESCRIPTION, value: task.description },
      { columnId: COLUMNS.REQUESTOR, value: task.requestor || "" },
      { columnId: COLUMNS.REQUESTOR_EMAIL, value: task.requestorEmail || "" },
      { columnId: COLUMNS.LEAD_BUILDER, value: task.leadBuilder || task.allocated || "" },
      { columnId: COLUMNS.LEAD_CDS, value: task.leadCDS || "" },
      { columnId: COLUMNS.TEAM, value: teamValue },
      { columnId: COLUMNS.STATUS, value: task.status || "Pending Allocation" }
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
    amendmentNr: getCellValue(COLUMNS.AMENDMENT_NR),
    taskSubType: getCellValue(COLUMNS.TASK_SUB_TYPE),
    projectId: getCellValue(COLUMNS.PROJECT_ID),
    sponsor: getCellValue(COLUMNS.SPONSOR),
    projectName: getCellValue(COLUMNS.PROJECT_NAME),
    priority: getCellValue(COLUMNS.PRIORITY),
    edcSystem: getCellValue(COLUMNS.EDC_SYSTEM),
    externalData: getCellValue(COLUMNS.EXTERNAL_DATA),
    documentation: getCellValue(COLUMNS.DOCUMENTATION),
    startDate: getCellValue(COLUMNS.START_DATE),
    endDate: getCellValue(COLUMNS.END_DATE),
    scopedHours: parseInt(getCellValue(COLUMNS.PROGRAMMING_SCOPED_HOURS)) || 0,
    cdsHours: parseInt(getCellValue(COLUMNS.CDS_SCOPED_HOURS)) || 0,
    description: getCellValue(COLUMNS.DESCRIPTION),
    requestor: getCellValue(COLUMNS.REQUESTOR),
    requestorEmail: getCellValue(COLUMNS.REQUESTOR_EMAIL),
    leadBuilder: getCellValue(COLUMNS.LEAD_BUILDER),
    leadCDS: getCellValue(COLUMNS.LEAD_CDS),
    // Legacy fields with default values for compatibility
    integrations: "",
    status: getCellValue(COLUMNS.STATUS) || "Pending Allocation",
    allocated: getCellValue(COLUMNS.LEAD_BUILDER), // Map lead builder to allocated for backwards compatibility
    team: getCellValue(COLUMNS.TEAM) ? getCellValue(COLUMNS.TEAM).split(", ") : [],
    requestorId: getCellValue(COLUMNS.TASK_ID), // Use task ID as requestor ID
    rowId: row.id // Save the Smartsheet row ID
  };
};

// API functions
export const smartsheetApi = {
  // Get all tasks from Smartsheet
  getTasks: async (): Promise<TaskData[]> => {
    try {
      console.log('Fetching tasks from:', `${API_URL}/sheets/${SHEET_ID}`);
      console.log('Full URL:', `${window.location.origin}${API_URL}/sheets/${SHEET_ID}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
      
      // First test if the API endpoint exists
      try {
        const testResponse = await fetch('/api/test');
        console.log('Test API response:', testResponse.status, testResponse.ok);
      } catch (testError) {
        console.error('Test API failed:', testError);
      }
      
      const response = await fetch(`${API_URL}/sheets/${SHEET_ID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
          // Authorization header is added by the proxy
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Read the response body once and handle both error and success cases
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error("Smartsheet API error:", responseText);
        console.error("Response was not JSON, got HTML or other content");
        throw new Error(`Failed to fetch tasks: ${response.status} - ${responseText.substring(0, 200)}...`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response content (first 500 chars):', responseText.substring(0, 500));
        throw new Error(`API returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      console.log('Smartsheet response data:', data);
      console.log('Number of rows returned:', data.rows ? data.rows.length : 0);
      
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
  allocateTask: async (taskId: string, leadBuilder: string, leadCDS: string, team: string[]): Promise<boolean> => {
    try {
      // Find the task first
      const allTasks = await smartsheetApi.getTasks();
      const task = allTasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      // Update the task with allocation information
      task.leadBuilder = leadBuilder;
      task.allocated = leadBuilder; // Keep for backwards compatibility
      task.leadCDS = leadCDS;
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
        const errorText = await response.text();
        console.error('Smartsheet API error:', errorText);
        throw new Error('Failed to add rows to Smartsheet');
      }
    } catch (error) {
      console.error('Error adding rows to Smartsheet:', error);
      throw error;
    }
  },

  updateRows: async (sheetId: string, rows: SmartsheetRow[]): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/sheets/${sheetId}/rows`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
          // Authorization header is added by the proxy
        },
        body: JSON.stringify(rows),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Smartsheet API error:', errorText);
        throw new Error('Failed to update rows in Smartsheet');
      }
    } catch (error) {
      console.error('Error updating rows in Smartsheet:', error);
      throw error;
    }
  },

  getMetrics: async (): Promise<SmartsheetRow[]> => {
    try {
      console.log('Fetching metrics from sheet:', '4968623136264068');
      const response = await fetch(`${API_URL}/sheets/4968623136264068`, {
        headers: {
          'Content-Type': 'application/json'
          // Authorization header is added by the proxy
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch metrics:', response.status, response.statusText);
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      console.log('Metrics API response:', data);
      
      if (!data.rows) {
        console.warn('No rows found in metrics data');
        return [];
      }

      // Log the column IDs we're looking for
      console.log('Looking for column IDs:', {
        TASK_ID: COLUMNS.TASK_ID,
        UNITS: COLUMNS.UNITS,
        ERRORS: COLUMNS.ERRORS
      });

      // Log the first row's cells to check structure
      if (data.rows.length > 0) {
        console.log('First row cells:', data.rows[0].cells.map(cell => ({
          columnId: cell.columnId,
          value: cell.value
        })));
      }

      return data.rows;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }
  },
};

// Alias for backward compatibility if needed
export const addTaskToSmartsheet = smartsheetApi.addTask;
