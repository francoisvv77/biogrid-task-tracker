
// This is a placeholder for updating the AppContext.tsx file
// We need to add requestors state and management functions

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TaskData, addTaskToSmartsheet } from '@/services/smartsheetApi';

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
  addTask: (task: TaskData) => Promise<boolean>;
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
  
  // Team members state - prefilled with initial data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Francois van Vuuren', email: 'francois.vanvuuren@bioforumgroup.com', role: 'Director' },
    { id: '2', name: 'Peter-John Vivier', email: 'peter.john.vivier@bioforumgroup.com', role: 'Build Manager' },
    { id: '3', name: 'Lourens Louw', email: 'lourens.louw@bioforumgroup.com', role: 'Builder' },
    { id: '4', name: 'Heide Engelbrecht', email: 'heide.engelbrecht@bioforumgroup.com', role: 'Builder' },
    { id: '5', name: 'Saeed Hasan', email: 'saeed.hasan@bioforum.co.il', role: 'Builder' },
    { id: '6', name: 'Bradley Dire', email: 'bradley.dire@bioforumgroup.com', role: 'Builder' },
    { id: '7', name: 'Alona Dayan', email: 'alona.dayan@bioforumgroup.com', role: 'Builder' },
    { id: '8', name: 'Danie Mong', email: 'Danie.mong@bioforumgroup.com', role: 'Builder' },
    { id: '9', name: 'Ariena Wilson', email: 'Ariena.wilson@bioforumgroup.com', role: 'Builder' },
    { id: '10', name: 'Mosa Lephoi', email: 'Mosa.lephoi@bioforumgroup.com', role: 'Builder' },
    { id: '11', name: 'Kaelo Setlogelo', email: 'Kaelo.setlogelo@bioforumgroup.com', role: 'Builder' },
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
  const [requestors, setRequestors] = useState<Requestor[]>([]);
  
  // Function to add a new task
  const addTask = async (task: TaskData): Promise<boolean> => {
    try {
      // In a real app, this would call an API
      // For now, we'll just add it to our local state
      setTasks([...tasks, task]);
      
      // Also add to Smartsheet
      const result = await addTaskToSmartsheet(task);
      return result;
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
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
      return false;
    }
  };
  
  const value = {
    tasks,
    teamMembers,
    edcSystems,
    taskStatuses,
    requestors,
    addTask,
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
