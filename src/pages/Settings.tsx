import React, { useState } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Users, Database, TagIcon, Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';

const mockUpdateSettings = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};

const TeamMembersSettings: React.FC = () => {
  const { teamMembers } = useAppContext();
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', role: 'Builder' });
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddMember = async () => {
    if (!newTeamMember.name || !newTeamMember.email) {
      toast.error('Please enter both name and email');
      return;
    }
    
    try {
      await mockUpdateSettings();
      toast.success(`Added team member: ${newTeamMember.name}`);
      setNewTeamMember({ name: '', email: '', role: 'Builder' });
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team Members</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1"
        >
          {isAdding ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Member</>}
        </Button>
      </div>
      
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/20 p-4 rounded-md space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newTeamMember.name}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={newTeamMember.email}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                placeholder="Enter email"
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={newTeamMember.role}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Director">Director</option>
                <option value="Build Manager">Build Manager</option>
                <option value="Builder">Builder</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAddMember}>
              Add Member
            </Button>
          </div>
        </motion.div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const EdcSystemsSettings: React.FC = () => {
  const { edcSystems } = useAppContext();
  const [newSystem, setNewSystem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddSystem = async () => {
    if (!newSystem) {
      toast.error('Please enter a system name');
      return;
    }
    
    try {
      await mockUpdateSettings();
      toast.success(`Added EDC system: ${newSystem}`);
      setNewSystem('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to add EDC system');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">EDC Systems</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1"
        >
          {isAdding ? 'Cancel' : <><Plus className="h-4 w-4" /> Add System</>}
        </Button>
      </div>
      
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/20 p-4 rounded-md space-y-4"
        >
          <div>
            <label className="text-sm font-medium">System Name</label>
            <Input
              value={newSystem}
              onChange={(e) => setNewSystem(e.target.value)}
              placeholder="Enter EDC system name"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAddSystem}>
              Add System
            </Button>
          </div>
        </motion.div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {edcSystems.map((system, index) => (
              <TableRow key={index}>
                <TableCell>{system}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const TaskStatusesSettings: React.FC = () => {
  const { taskStatuses } = useAppContext();
  const [newStatus, setNewStatus] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddStatus = async () => {
    if (!newStatus) {
      toast.error('Please enter a status name');
      return;
    }
    
    try {
      await mockUpdateSettings();
      toast.success(`Added task status: ${newStatus}`);
      setNewStatus('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to add task status');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Task Statuses</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1"
        >
          {isAdding ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Status</>}
        </Button>
      </div>
      
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/20 p-4 rounded-md space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Status Name</label>
            <Input
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="Enter task status name"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAddStatus}>
              Add Status
            </Button>
          </div>
        </motion.div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskStatuses.map((status, index) => (
              <TableRow key={index}>
                <TableCell>{status}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const RequestorsSettings: React.FC = () => {
  const { requestors, addRequestor, removeRequestor } = useAppContext();
  const [newRequestor, setNewRequestor] = useState({ name: '', email: '' });
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddRequestor = async () => {
    if (!newRequestor.name || !newRequestor.email) {
      toast.error('Please enter both name and email');
      return;
    }
    
    try {
      await addRequestor(newRequestor);
      toast.success(`Added requestor: ${newRequestor.name}`);
      setNewRequestor({ name: '', email: '' });
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to add requestor');
    }
  };

  const handleDeleteRequestor = async (id: string) => {
    try {
      await removeRequestor(id);
      toast.success('Requestor removed successfully');
    } catch (error) {
      toast.error('Failed to remove requestor');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Requestors</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1"
        >
          {isAdding ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Requestor</>}
        </Button>
      </div>
      
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/20 p-4 rounded-md space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newRequestor.name}
                onChange={(e) => setNewRequestor({ ...newRequestor, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={newRequestor.email}
                onChange={(e) => setNewRequestor({ ...newRequestor, email: e.target.value })}
                placeholder="Enter email"
                type="email"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAddRequestor}>
              Add Requestor
            </Button>
          </div>
        </motion.div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No requestors added yet
                </TableCell>
              </TableRow>
            ) : (
              requestors.map((requestor) => (
                <TableRow key={requestor.id}>
                  <TableCell>{requestor.name}</TableCell>
                  <TableCell>{requestor.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteRequestor(requestor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="team-members" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team-members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team Members</span>
          </TabsTrigger>
          <TabsTrigger value="edc-systems" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>EDC Systems</span>
          </TabsTrigger>
          <TabsTrigger value="task-statuses" className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <span>Task Statuses</span>
          </TabsTrigger>
          <TabsTrigger value="requestors" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Requestors</span>
          </TabsTrigger>
        </TabsList>
        
        <Card className="mt-6 border shadow-sm">
          <CardContent className="pt-6">
            <TabsContent value="team-members" className="mt-0">
              <TeamMembersSettings />
            </TabsContent>
            
            <TabsContent value="edc-systems" className="mt-0">
              <EdcSystemsSettings />
            </TabsContent>
            
            <TabsContent value="task-statuses" className="mt-0">
              <TaskStatusesSettings />
            </TabsContent>

            <TabsContent value="requestors" className="mt-0">
              <RequestorsSettings />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Settings;

