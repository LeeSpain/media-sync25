import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  Filter,
  Search,
  Target,
  Plus,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Tag
} from "lucide-react";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  created_at: string;
  crm_companies?: {
    name: string;
    industry: string | null;
  };
};

type Segment = {
  id: string;
  name: string;
  description: string;
  criteria: any;
  contact_count: number;
  created_at: string;
};

const segmentTemplates = [
  {
    name: "High-Value Prospects",
    description: "Contacts from companies with 100+ employees",
    criteria: {
      company_size: "large",
      engagement_score: "high"
    }
  },
  {
    name: "Recent Signups",
    description: "Contacts added in the last 30 days",
    criteria: {
      created_within: 30,
      status: "new"
    }
  },
  {
    name: "Decision Makers",
    description: "Contacts with C-level or VP titles",
    criteria: {
      job_titles: ["CEO", "CTO", "CMO", "VP", "Director"]
    }
  },
  {
    name: "Industry Specific",
    description: "Contacts from technology companies",
    criteria: {
      industry: "technology"
    }
  }
];

export default function EmailSegmentation() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    criteria: {}
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadSegments();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select(`
          *,
          crm_companies (
            name,
            industry
          )
        `)
        .eq("created_by", user.id)
        .not("email", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Failed to load contacts:", error);
      toast({
        title: "Failed to load contacts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    if (!user) return;

    try {
      // Mock segments for now - in real implementation, this would be from a segments table
      const mockSegments: Segment[] = [
        {
          id: "1",
          name: "All Contacts",
          description: "All contacts with email addresses",
          criteria: {},
          contact_count: contacts.length,
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          name: "Decision Makers",
          description: "C-level and VP contacts",
          criteria: { job_titles: ["CEO", "CTO", "CMO", "VP"] },
          contact_count: contacts.filter(c => 
            c.job_title && ["CEO", "CTO", "CMO", "VP"].some(title => 
              c.job_title?.toLowerCase().includes(title.toLowerCase())
            )
          ).length,
          created_at: new Date().toISOString()
        }
      ];
      
      setSegments(mockSegments);
    } catch (error: any) {
      console.error("Failed to load segments:", error);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.crm_companies?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJobTitle = !jobTitleFilter || 
      contact.job_title?.toLowerCase().includes(jobTitleFilter.toLowerCase());
    
    const matchesIndustry = !industryFilter || 
      contact.crm_companies?.industry?.toLowerCase().includes(industryFilter.toLowerCase());
    
    return matchesSearch && matchesJobTitle && matchesIndustry;
  });

  const handleContactSelect = (contactId: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleCreateSegment = async () => {
    if (!user || !newSegment.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a segment name",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      // In a real implementation, this would save to a segments table
      const segmentData = {
        id: Date.now().toString(),
        name: newSegment.name.trim(),
        description: newSegment.description.trim(),
        criteria: {
          contact_ids: selectedContacts,
          filters: {
            job_title: jobTitleFilter,
            industry: industryFilter,
            search: searchQuery
          }
        },
        contact_count: selectedContacts.length,
        created_at: new Date().toISOString()
      };

      setSegments(prev => [segmentData, ...prev]);
      
      toast({
        title: "Segment created",
        description: `Created segment "${newSegment.name}" with ${selectedContacts.length} contacts`
      });

      // Reset form
      setNewSegment({ name: "", description: "", criteria: {} });
      setSelectedContacts([]);
      setSearchQuery("");
      setJobTitleFilter("");
      setIndustryFilter("");

    } catch (error: any) {
      toast({
        title: "Failed to create segment",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const uniqueJobTitles = [...new Set(contacts.map(c => c.job_title).filter(Boolean))];
  const uniqueIndustries = [...new Set(contacts.map(c => c.crm_companies?.industry).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audience Segmentation</h2>
          <p className="text-muted-foreground">Create targeted segments for personalized campaigns</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          {contacts.length} Total Contacts
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters & Contact Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name, email, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All job titles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All job titles</SelectItem>
                      {uniqueJobTitles.map(title => (
                        <SelectItem key={title} value={title!}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All industries</SelectItem>
                      {uniqueIndustries.map(industry => (
                        <SelectItem key={industry} value={industry!}>
                          {industry}
                        </SelectItem>
                 ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select all ({filteredContacts.length} contacts)</Label>
                </div>
                <Badge variant="secondary">
                  {selectedContacts.length} selected
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Contacts ({filteredContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.job_title && (
                          <Badge variant="outline" className="text-xs">
                            {contact.job_title}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.crm_companies?.name && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span className="truncate">{contact.crm_companies.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Creation & Management */}
        <div className="space-y-6">
          {/* Create New Segment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Segment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Segment Name</Label>
                <Input
                  placeholder="e.g., High-Value Prospects"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description..."
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Current Selection:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {selectedContacts.length} contacts selected</p>
                  {searchQuery && <p>• Search: "{searchQuery}"</p>}
                  {jobTitleFilter && <p>• Job title: {jobTitleFilter}</p>}
                  {industryFilter && <p>• Industry: {industryFilter}</p>}
                </div>
              </div>
              
              <Button 
                onClick={handleCreateSegment} 
                disabled={creating || selectedContacts.length === 0}
                className="w-full"
              >
                {creating ? "Creating..." : `Create Segment (${selectedContacts.length} contacts)`}
              </Button>
            </CardContent>
          </Card>

          {/* Segment Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Segments
              </CardTitle>
              <CardDescription>
                Pre-built segment templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {segmentTemplates.map((template, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => {
                      setNewSegment({
                        name: template.name,
                        description: template.description,
                        criteria: template.criteria
                      });
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Existing Segments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Saved Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {segments.map((segment) => (
                <div key={segment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{segment.name}</h4>
                      <p className="text-xs text-muted-foreground">{segment.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {segment.contact_count}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}