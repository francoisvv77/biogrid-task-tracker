import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Crown,
  Users,
  Save,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { smartsheetApi } from '@/services/smartsheetApi';

// Interface for team member metrics
interface TeamMemberMetrics {
  name: string;
  role: 'Lead' | 'Team';
  units: number;
  errors: number;
  passRate: number;
  metricId?: number;
}

// Interface for task metrics
interface TaskMetrics {
  taskId: string;
  teamMembers: TeamMemberMetrics[];
}

// Mock data for demonstration
const mockTaskMetrics: Record<string, TaskMetrics> = {
  'TASK-001': {
    taskId: 'TASK-001',
    teamMembers: [
      { name: 'Lourens Louw', role: 'Lead', units: 100, errors: 2, passRate: 98 },
      { name: 'Heide Engelbrecht', role: 'Team', units: 80, errors: 1, passRate: 98.75 },
    ],
  },
  'TASK-002': {
    taskId: 'TASK-002',
    teamMembers: [
      { name: 'Saeed Hasan', role: 'Lead', units: 150, errors: 3, passRate: 98 },
      { name: 'Bradley Dire', role: 'Team', units: 120, errors: 2, passRate: 98.33 },
    ],
  },
};

const Metrics: React.FC = () => {
  const { tasks, teamMembers } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [builderFilter, setBuilderFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskMetrics, setTaskMetrics] = useState<Record<string, TaskMetrics>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get unique statuses from tasks
  const uniqueStatuses = Array.from(new Set(tasks.map(task => task.status)));

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter(task => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        task.projectName.toLowerCase().includes(term) ||
        task.sponsor.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    // Builder filter
    if (builderFilter !== 'all') {
      const isLeadBuilder = task.allocated === builderFilter;
      const isTeamMember = task.team?.includes(builderFilter);
      if (!isLeadBuilder && !isTeamMember) {
        return false;
      }
    }

    return true;
  });

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Function to calculate pass rate
  const calculatePassRate = (units: number, errors: number): number => {
    if (units === 0) return 0;
    return Number(((units - errors) / units * 100).toFixed(2));
  };

  // Load metrics from Smartsheet
  const loadMetricsFromSmartsheet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/smartsheet/sheets/25HX5VvvvPPqvXw9rGxV63MMHC94W2vG4QgX8cP1`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      const metricsMap: Record<string, TaskMetrics> = {};

      // Process each row from Smartsheet
      data.rows.forEach((row: any) => {
        const cells = row.cells;
        const getCellValue = (columnId: number) => {
          const cell = cells.find((c: any) => c.columnId === columnId);
          return cell ? cell.value : 0;
        };

        const metricId = getCellValue(8272663237840772);
        const employee = getCellValue(281097919483780);
        const project = getCellValue(1552115308908420);
        const taskType = getCellValue(5433382765023108);
        const taskSubType = getCellValue(3181582951337860);
        const units = getCellValue(4784697546854276);
        const errors = getCellValue(2532897733169028);

        // Find the corresponding task
        const task = tasks.find(t => 
          t.projectName === project && 
          t.taskType === taskType && 
          t.taskSubType === taskSubType
        );

        if (task && task.id) {
          if (!metricsMap[task.id]) {
            metricsMap[task.id] = {
              taskId: task.id,
              teamMembers: []
            };
          }

          const existingMember = metricsMap[task.id].teamMembers.find(m => m.name === employee);
          if (existingMember) {
            existingMember.units = units;
            existingMember.errors = errors;
            existingMember.passRate = calculatePassRate(units, errors);
            existingMember.metricId = row.id; // Store the Smartsheet row ID
          } else {
            metricsMap[task.id].teamMembers.push({
              name: employee,
              role: employee === task.allocated ? 'Lead' : 'Team',
              units,
              errors,
              passRate: calculatePassRate(units, errors),
              metricId: row.id // Store the Smartsheet row ID
            });
          }
        }
      });

      setTaskMetrics(metricsMap);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load metrics from Smartsheet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load metrics when component mounts
  useEffect(() => {
    loadMetricsFromSmartsheet();
  }, [tasks]);

  // Get or create metrics for a task
  const getTaskMetrics = (taskId: string): TaskMetrics => {
    if (!taskMetrics[taskId]) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return { taskId, teamMembers: [] };

      const teamMembersList: TeamMemberMetrics[] = [];
      
      // Add lead builder if exists
      if (task.allocated) {
        teamMembersList.push({
          name: task.allocated,
          role: 'Lead',
          units: 0,
          errors: 0,
          passRate: 0
        });
      }

      // Add team members
      task.team?.forEach(memberName => {
        teamMembersList.push({
          name: memberName,
          role: 'Team',
          units: 0,
          errors: 0,
          passRate: 0
        });
      });

      const newMetrics = {
        taskId,
        teamMembers: teamMembersList
      };

      setTaskMetrics(prev => ({
        ...prev,
        [taskId]: newMetrics
      }));

      return newMetrics;
    }

    return taskMetrics[taskId];
  };

  // Update metrics for a team member
  const updateTeamMemberMetrics = (taskId: string, memberName: string, field: 'units' | 'errors', value: number) => {
    setTaskMetrics(prev => {
      const taskMetric = prev[taskId];
      if (!taskMetric) return prev;

      const updatedTeamMembers = taskMetric.teamMembers.map(member => {
        if (member.name === memberName) {
          const updatedMember = {
            ...member,
            [field]: value
          };
          // Recalculate pass rate whenever units or errors change
          updatedMember.passRate = calculatePassRate(updatedMember.units, updatedMember.errors);
          return updatedMember;
        }
        return member;
      });

      return {
        ...prev,
        [taskId]: {
          ...taskMetric,
          teamMembers: updatedTeamMembers
        }
      };
    });
  };

  // Function to save metrics to Smartsheet
  const saveMetricsToSmartsheet = async (taskId: string) => {
    try {
      setIsSubmitting(true);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const taskMetricsData = taskMetrics[taskId];
      if (!taskMetricsData || !taskMetricsData.teamMembers || taskMetricsData.teamMembers.length === 0) return;

      // Create rows for each team member's metrics
      const rows = taskMetricsData.teamMembers.map(metric => {
        // Create a unique metric ID for new records
        const uniqueMetricId = `${taskId}-${metric.name.replace(/\s+/g, '-')}`;
        
        const rowData: any = {
          cells: [
            { columnId: 8272663237840772, value: uniqueMetricId }, // Metric ID (unique identifier)
            { columnId: 281097919483780, value: metric.name }, // Employee
            { columnId: 1552115308908420, value: task.projectName }, // Project
            { columnId: 5433382765023108, value: task.taskType }, // Task Type
            { columnId: 3181582951337860, value: task.taskSubType || '' }, // Task Sub Type
            { columnId: 4784697546854276, value: metric.units }, // Units
            { columnId: 2532897733169028, value: metric.errors }, // Errors
            { columnId: 929783137652612, value: metric.passRate } // Pass Rate
          ]
        };

        // Only add id if it exists (for updates)
        if (metric.metricId) {
          rowData.id = metric.metricId;
        }

        return rowData;
      });

      // Filter out any rows that don't have a metricId (these would be new entries)
      const rowsToUpdate = rows.filter(row => row.id);
      const rowsToAdd = rows.filter(row => !row.id);

      // Update existing rows if any
      if (rowsToUpdate.length > 0) {
        // Update each row individually to avoid duplicate ID issues
        for (const row of rowsToUpdate) {
          await smartsheetApi.updateRows('25HX5VvvvPPqvXw9rGxV63MMHC94W2vG4QgX8cP1', [row]);
        }
      }

      // Add new rows if any
      if (rowsToAdd.length > 0) {
        await smartsheetApi.addRows('25HX5VvvvPPqvXw9rGxV63MMHC94W2vG4QgX8cP1', rowsToAdd);
      }

      toast({
        title: "Success",
        description: "Metrics have been saved to Smartsheet successfully.",
      });
      // Reload metrics after saving
      await loadMetricsFromSmartsheet();
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast({
        title: "Error",
        description: "Failed to save metrics to Smartsheet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to calculate overall pass rate for a task
  const calculateOverallPassRate = (taskId: string): number => {
    const metrics = taskMetrics[taskId];
    if (!metrics || metrics.teamMembers.length === 0) return 0;

    const totalUnits = metrics.teamMembers.reduce((sum, member) => sum + member.units, 0);
    const totalErrors = metrics.teamMembers.reduce((sum, member) => sum + member.errors, 0);

    if (totalUnits === 0) return 0;
    return Number(((totalUnits - totalErrors) / totalUnits * 100).toFixed(2));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quality Metrics</h1>
        <p className="text-muted-foreground">
          Track and analyze quality metrics for all tasks
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-2 items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={builderFilter} onValueChange={setBuilderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Builder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Builders</SelectItem>
                {teamMembers
                  .filter(member => member.role === 'Builder')
                  .map(builder => (
                    <SelectItem key={builder.id} value={builder.name}>
                      {builder.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map(task => {
                  const metrics = getTaskMetrics(task.id || '');
                  const isExpanded = expandedTasks.has(task.id || '');
                  const teamSize = (task.team?.length || 0) + (task.allocated ? 1 : 0);
                  const overallPassRate = calculateOverallPassRate(task.id || '');

                  return (
                    <React.Fragment key={task.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleTaskExpansion(task.id || '')}
                      >
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>{task.sponsor}</TableCell>
                        <TableCell>{task.projectName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {teamSize}
                          </div>
                        </TableCell>
                        <TableCell>{task.status}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              overallPassRate >= 95 ? 'bg-green-500' :
                              overallPassRate >= 90 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className={`
                              ${overallPassRate >= 95 ? 'text-green-600' :
                                overallPassRate >= 90 ? 'text-yellow-600' :
                                'text-red-600'}
                            `}>
                              {overallPassRate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="py-4">
                              <h4 className="font-medium mb-4">Team Metrics</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {metrics.teamMembers.map((member, index) => (
                                  <Card key={index}>
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm">{member.name}</CardTitle>
                                        <div className="flex items-center gap-1">
                                          {member.role === 'Lead' ? (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                          ) : (
                                            <Users className="h-4 w-4 text-blue-500" />
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {member.role}
                                          </span>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-sm text-muted-foreground">Units:</label>
                                          <Input
                                            type="number"
                                            value={member.units}
                                            onChange={(e) => updateTeamMemberMetrics(task.id || '', member.name, 'units', parseInt(e.target.value) || 0)}
                                            className="w-full"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm text-muted-foreground">Errors:</label>
                                          <Input
                                            type="number"
                                            value={member.errors}
                                            onChange={(e) => updateTeamMemberMetrics(task.id || '', member.name, 'errors', parseInt(e.target.value) || 0)}
                                            className="w-full"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm text-muted-foreground">Pass Rate:</label>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              value={member.passRate}
                                              disabled
                                              className="w-full bg-muted"
                                            />
                                            <span className="text-sm text-muted-foreground">%</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                              
                              {/* Save Button for this task */}
                              <div className="mt-4 flex justify-end">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveMetricsToSmartsheet(task.id || '');
                                  }}
                                  disabled={isSubmitting}
                                  className="gap-2"
                                >
                                  <Save className="h-4 w-4" />
                                  {isSubmitting ? 'Saving...' : 'Save Metrics to Smartsheet'}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics; 