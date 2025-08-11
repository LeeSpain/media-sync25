import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserPlus, Eye, Shield, User, Calendar, Mail, Phone, Building } from "lucide-react";
import { format } from "date-fns";

type UserWithProfile = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_roles: Array<{
    role: 'admin' | 'user';
  }>;
  crm_contacts: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    crm_companies: {
      name: string;
    } | null;
  }>;
};

const Members = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<UserWithProfile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      // Get all profiles with their associated data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          avatar_url,
          created_at
        `);
      
      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Get CRM contacts separately
      const { data: crmContacts, error: contactsError } = await supabase
        .from('crm_contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          created_by,
          crm_companies (
            name
          )
        `);
      
      if (contactsError) throw contactsError;
      
      // Build the member data
      const members: UserWithProfile[] = profiles.map((profile) => {
        const roles = userRoles.filter(role => role.user_id === profile.id);
        const contacts = crmContacts.filter(contact => contact.created_by === profile.id);
        
        return {
          id: profile.id,
          email: '', // Will be filled from auth
          created_at: profile.created_at,
          last_sign_in_at: null,
          profiles: {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          },
          user_roles: roles.map(r => ({ role: r.role as 'admin' | 'user' })),
          crm_contacts: contacts.map(c => ({
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            phone: c.phone,
            job_title: c.job_title,
            crm_companies: c.crm_companies
          }))
        };
      });
      
      return members;
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update role", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredMembers = members.filter(member => 
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.crm_contacts?.[0]?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.crm_contacts?.[0]?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (roles: Array<{ role: 'admin' | 'user' }>) => {
    const isAdmin = roles.some(r => r.role === 'admin');
    return (
      <Badge variant={isAdmin ? "destructive" : "secondary"}>
        {isAdmin ? 'Admin' : 'User'}
      </Badge>
    );
  };

  const getInitials = (member: UserWithProfile) => {
    const contact = member.crm_contacts?.[0];
    if (contact?.first_name && contact?.last_name) {
      return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
    }
    if (member.profiles?.display_name) {
      return member.profiles.display_name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase();
    }
    return member.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="p-6 space-y-6">
      <SEO 
        title="Members Management" 
        description="Manage members, view profiles, and assign roles" 
        canonical={window.location.href} 
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Members Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and view detailed profiles</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const contact = member.crm_contacts?.[0];
                  const company = contact?.crm_companies?.name;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.profiles?.avatar_url || ''} />
                            <AvatarFallback>{getInitials(member)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {contact?.first_name && contact?.last_name 
                                ? `${contact.first_name} ${contact.last_name}`
                                : member.profiles?.display_name || 'Unnamed User'
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                            {contact?.job_title && (
                              <div className="text-xs text-muted-foreground">{contact.job_title}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.user_roles)}</TableCell>
                      <TableCell>
                        {company ? (
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span className="text-sm">{company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No company</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(member.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.last_sign_in_at ? (
                          <span className="text-sm">
                            {format(new Date(member.last_sign_in_at), 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedMember(member)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Member Details</DialogTitle>
                              </DialogHeader>
                              {selectedMember && (
                                <MemberDetailsDialog member={selectedMember} />
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Select
                            value={member.user_roles.some(r => r.role === 'admin') ? 'admin' : 'user'}
                            onValueChange={(role: 'admin' | 'user') => 
                              updateRoleMutation.mutate({ userId: member.id, role })
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>User</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center space-x-1">
                                  <Shield className="h-3 w-3" />
                                  <span>Admin</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const MemberDetailsDialog = ({ member }: { member: UserWithProfile }) => {
  const contact = member.crm_contacts?.[0];
  const company = contact?.crm_companies;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={member.profiles?.avatar_url || ''} />
          <AvatarFallback className="text-lg">
            {member.profiles?.display_name?.split(' ').map(n => n[0]).join('') || member.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">
            {contact?.first_name && contact?.last_name 
              ? `${contact.first_name} ${contact.last_name}`
              : member.profiles?.display_name || 'Unnamed User'
            }
          </h3>
          <p className="text-muted-foreground">{member.email}</p>
          {contact?.job_title && <p className="text-sm text-muted-foreground">{contact.job_title}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Email:</span>
              <p className="text-sm text-muted-foreground">{contact?.email || member.email}</p>
            </div>
            {contact?.phone && (
              <div>
                <span className="text-sm font-medium">Phone:</span>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {company && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{company.name}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Account Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Role:</span>
              <div className="mt-1">
                {member.user_roles.some(r => r.role === 'admin') ? (
                  <Badge variant="destructive">Admin</Badge>
                ) : (
                  <Badge variant="secondary">User</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Member since:</span>
              <p className="text-sm text-muted-foreground">
                {format(new Date(member.created_at), 'MMMM dd, yyyy')}
              </p>
            </div>
            {member.last_sign_in_at && (
              <div>
                <span className="text-sm font-medium">Last sign in:</span>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(member.last_sign_in_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Members;