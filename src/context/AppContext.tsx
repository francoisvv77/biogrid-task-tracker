import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TaskData, smartsheetApi } from '@/services/smartsheetApi';

// Define the requestor type
interface Requestor {
  id: string;
  name: string;
  email: string;
}

// Define the team member type
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define the context shape
interface AppContextType {
  tasks: TaskData[];
  teamMembers: TeamMember[];
  edcSystems: string[];
  taskStatuses: string[];
  requestors: Requestor[];
  loading: boolean;
  error: string | null;
  addTask: (task: TaskData) => Promise<boolean>;
  updateTask: (task: TaskData) => Promise<TaskData | null>;
  allocateTask: (taskId: string, leadBuilder: string, leadCDS: string, team: string[]) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
  addRequestor: (requestor: { name: string; email: string }) => Promise<boolean>;
  removeRequestor: (id: string) => Promise<boolean>;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate a unique ID for entities
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Tasks state
  const [tasks, setTasks] = useState<TaskData[]>([]);
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Team members state - prefilled with initial data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Francois van Vuuren', email: 'francois.vanvuuren@bioforumgroup.com', role: 'Director' },
    { id: '2', name: 'Kenneth Dettmer', email: 'kenneth.dettmer@bioforumgroup.com', role: 'BioGRID Designer' },
    { id: '3', name: 'Graham Bubb', email: 'graham.bubb@bioforumgroup.com', role: 'BioGRID Designer' },
    { id: '4', name: 'Hanno Prinsloo', email: 'hanno.prinsloo@bioforumgroup.com', role: 'BioGRID Designer' },
    { id: '5', name: 'Tanja janse van Rensburg', email: 'tanja.jansevanrensburg@bioforum.co.il', role: 'BioGRID Designer' },
    { id: '6', name: 'Marli Muller', email: 'marli.muller@bioforumgroup.com', role: 'CDS' },
    { id: '7', name: 'Quinton Kaplan', email: 'quinton.kaplan@bioforumgroup.com', role: 'BioGRID Designer' },
    { id: '8', name: 'Maryna Kapp', email: 'maryna.kapp@bioforumgroup.com', role: 'CDS' },
    { id: '9', name: 'Nadia McCrindle', email: 'nadia.mccrindle@bioforumgroup.com', role: 'CDS' },
  // { id: '8', name: 'Alona Dayan', email: 'alona.dayan@bioforumgroup.com', role: 'Builder' },
  //  { id: '9', name: 'Danie Mong', email: 'Danie.mong@bioforumgroup.com', role: 'Builder' },
  // { id: '10', name: 'Ariena Wilson', email: 'Ariena.wilson@bioforumgroup.com', role: 'Builder' },
  //  { id: '11', name: 'Mosa Lephoi', email: 'Mosa.lephoi@bioforumgroup.com', role: 'Builder' },
  //   { id: '12', name: 'Kaelo Setlogelo', email: 'Kaelo.setlogelo@bioforumgroup.com', role: 'Builder' },
  ]);
  
  // EDC systems state - prefilled with initial data
  const [edcSystems, setEdcSystems] = useState<string[]>([
    'Rave',
    'Viedoc',
    'Veeva',
    'Medrio',
    'iMednet',
    'OpenClinica',
  ]);
  
  // Task statuses state - prefilled with initial data
  const [taskStatuses, setTaskStatuses] = useState<string[]>([
    'Pending Allocation',
    'Assigned',
    'In Progress',
    'In Validation',
    'Completed',
    'On Hold',
    'Cancelled',
  ]);

  // Requestors state
  const [requestors, setRequestors] = useState<Requestor[]>([
    { id: generateId(), name: 'Requestor', email: 'requestor@bioforumgroup.com' }
  ]);

  // Fetch tasks on component mount
  useEffect(() => {
    refreshTasks();
  }, []);
  
  // Function to refresh tasks from the API
  const refreshTasks = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await smartsheetApi.getTasks();
      setTasks(fetchedTasks);
      
      // Extract unique requestors from tasks
      const uniqueRequestors = new Map();
      
      // Add initial requestors
      requestors.forEach(r => {
        if (r.name && r.email) {
          uniqueRequestors.set(r.id, r);
        }
      });
      
      // Add requestors from tasks
      fetchedTasks.forEach(task => {
        if (task.requestor && task.requestorEmail && task.requestorId) {
          if (!uniqueRequestors.has(task.requestorId)) {
            uniqueRequestors.set(task.requestorId, {
              id: task.requestorId,
              name: task.requestor,
              email: task.requestorEmail
            });
          }
        }
      });
      
      // Update requestors state with unique list
      setRequestors(Array.from(uniqueRequestors.values()));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to add a new task
  const addTask = async (task: TaskData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Using smartsheetApi.addTask instead of addTaskToSmartsheet
      const result = await smartsheetApi.addTask(task);
      if (result) {
        // Refresh tasks after successful addition
        await refreshTasks();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to allocate a task
  const allocateTask = async (taskId: string, leadBuilder: string, leadCDS: string, team: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await smartsheetApi.allocateTask(taskId, leadBuilder, leadCDS, team);
      if (result) {
        // Refresh tasks after successful allocation
        await refreshTasks();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error allocating task:', error);
      setError('Failed to allocate task. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new requestor
  const addRequestor = async (requestorData: { name: string; email: string }): Promise<boolean> => {
    try {
      const newRequestor: Requestor = {
        id: generateId(),
        name: requestorData.name,
        email: requestorData.email
      };
      
      setRequestors(prev => [...prev, newRequestor]);
      return true;
    } catch (error) {
      console.error('Error adding requestor:', error);
      setError('Failed to add requestor. Please try again.');
      return false;
    }
  };

  // Function to remove a requestor
  const removeRequestor = async (id: string): Promise<boolean> => {
    try {
      setRequestors(prev => prev.filter(requestor => requestor.id !== id));
      return true;
    } catch (error) {
      console.error('Error removing requestor:', error);
      setError('Failed to remove requestor. Please try again.');
      return false;
    }
  };
  
  const value = {
    tasks,
    teamMembers,
    edcSystems,
    taskStatuses,
    requestors,
    loading,
    error,
    addTask,
    updateTask: smartsheetApi.updateTask,
    allocateTask,
    refreshTasks,
    addRequestor,
    removeRequestor,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};