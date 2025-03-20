
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TaskData, smartsheetApi } from '../services/smartsheetApi';

// Define the team members
export const TEAM_MEMBERS = [
  { id: 'fvv', name: 'Francois van Vuuren', email: 'francois.vanvuuren@bioforumgroup.com', role: 'Director' },
  { id: 'pjv', name: 'Peter-John Vivier', email: 'peter.john.vivier@bioforumgroup.com', role: 'Build Manager' },
  { id: 'll', name: 'Lourens Louw', email: 'lourens.louw@bioforumgroup.com', role: 'Builder' },
  { id: 'he', name: 'Heide Engelbrecht', email: 'heide.engelbrecht@bioforumgroup.com', role: 'Builder' },
  { id: 'sh', name: 'Saeed Hasan', email: 'saeed.hasan@bioforum.co.il', role: 'Builder' },
  { id: 'bd', name: 'Bradley Dire', email: 'bradley.dire@bioforumgroup.com', role: 'Builder' },
  { id: 'ad', name: 'Alona Dayan', email: 'alona.dayan@bioforumgroup.com', role: 'Builder' },
  { id: 'dm', name: 'Danie Mong', email: 'Danie.mong@bioforumgroup.com', role: 'Builder' },
  { id: 'aw', name: 'Ariena Wilson', email: 'Ariena.wilson@bioforumgroup.com', role: 'Builder' },
  { id: 'ml', name: 'Mosa Lephoi', email: 'Mosa.lephoi@bioforumgroup.com', role: 'Builder' },
  { id: 'ks', name: 'Kaelo Setlogelo', email: 'Kaelo.setlogelo@bioforumgroup.com', role: 'Builder' },
];

// Define the EDC systems
export const EDC_SYSTEMS = [
  'Rave',
  'Viedoc',
  'Veeva',
  'Medrio',
  'iMednet',
  'OpenClinica'
];

// Define the task statuses
export const TASK_STATUSES = [
  'Pending Allocation',
  'Assigned',
  'In Progress',
  'In Validation',
  'Completed',
  'On Hold',
  'Cancelled'
];

// Define the app context type
interface AppContextType {
  tasks: TaskData[];
  teamMembers: typeof TEAM_MEMBERS;
  edcSystems: typeof EDC_SYSTEMS;
  taskStatuses: typeof TASK_STATUSES;
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (task: TaskData) => Promise<TaskData | null>;
  updateTask: (task: TaskData) => Promise<TaskData | null>;
  allocateTask: (taskId: string, leadBuilder: string, team: string[]) => Promise<boolean>;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers] = useState(TEAM_MEMBERS);
  const [edcSystems] = useState(EDC_SYSTEMS);
  const [taskStatuses] = useState(TASK_STATUSES);

  // Function to refresh tasks
  const refreshTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await smartsheetApi.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
      setError("Failed to fetch tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a task
  const addTask = async (task: TaskData) => {
    try {
      const newTask = await smartsheetApi.addTask(task);
      if (newTask) {
        await refreshTasks();
      }
      return newTask;
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task. Please try again.");
      return null;
    }
  };

  // Function to update a task
  const updateTask = async (task: TaskData) => {
    try {
      const updatedTask = await smartsheetApi.updateTask(task);
      if (updatedTask) {
        await refreshTasks();
      }
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
      return null;
    }
  };

  // Function to allocate a task
  const allocateTask = async (taskId: string, leadBuilder: string, team: string[]) => {
    try {
      const success = await smartsheetApi.allocateTask(taskId, leadBuilder, team);
      if (success) {
        await refreshTasks();
      }
      return success;
    } catch (error) {
      console.error("Error allocating task:", error);
      setError("Failed to allocate task. Please try again.");
      return false;
    }
  };

  // Fetch tasks when the component mounts
  useEffect(() => {
    refreshTasks();
  }, []);

  // Create the context value
  const contextValue: AppContextType = {
    tasks,
    teamMembers,
    edcSystems,
    taskStatuses,
    loading,
    error,
    refreshTasks,
    addTask,
    updateTask,
    allocateTask
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Create a hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
