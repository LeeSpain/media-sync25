import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Linkedin, Instagram, Facebook, Twitter, Youtube, Globe, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyFormData {
  name: string;
  industry?: string;
  employee_count?: number;
  annual_revenue?: number;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface LinkData {
  link_type: string;
  label: string;
  url: string;
  is_primary: boolean;
}

interface CompanyFormProps {
  company?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const linkTypes = [
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "website", label: "Website", icon: Globe },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "other", label: "Other", icon: Globe },
];

export default function CompanyForm({ company, onClose, onSuccess }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkData[]>([]);
  const { register, handleSubmit, setValue, watch } = useForm<CompanyFormData>();

  useEffect(() => {
    if (company) {
      // Populate form with existing company data
      Object.keys(company).forEach(key => {
        setValue(key as keyof CompanyFormData, company[key]);
      });
      fetchCompanyLinks();
    }
  }, [company, setValue]);

  const fetchCompanyLinks = async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from("crm_links")
      .select("*")
      .eq("company_id", company.id);
    if (data) setLinks(data);
  };

  const addLink = () => {
    setLinks([...links, { link_type: "website", label: "", url: "", is_primary: false }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof LinkData, value: any) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const companyData = {
        ...data,
        created_by: user.id,
        employee_count: data.employee_count || null,
        annual_revenue: data.annual_revenue || null,
      };

      let companyId = company?.id;

      if (company) {
        const { error } = await supabase
          .from("crm_companies")
          .update(companyData)
          .eq("id", company.id);
        if (error) throw error;
      } else {
        const { data: newCompany, error } = await supabase
          .from("crm_companies")
          .insert(companyData)
          .select()
          .single();
        if (error) throw error;
        companyId = newCompany.id;
      }

      // Handle links
      if (companyId) {
        // Delete existing links if updating
        if (company) {
          await supabase.from("crm_links").delete().eq("company_id", companyId);
        }

        // Insert new links
        const linksToInsert = links
          .filter(link => link.url.trim())
          .map(link => ({
            ...link,
            company_id: companyId,
            created_by: user.id,
          }));

        if (linksToInsert.length > 0) {
          const { error } = await supabase.from("crm_links").insert(linksToInsert);
          if (error) throw error;
        }
      }

      toast.success(`Company ${company ? "updated" : "created"} successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{company ? "Edit Company" : "New Company"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Contact & Address</TabsTrigger>
                <TabsTrigger value="links">Social & Links</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input {...register("name", { required: true })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input {...register("industry")} placeholder="e.g. Technology, Healthcare" />
                  </div>
                  <div>
                    <Label htmlFor="employee_count">Employee Count</Label>
                    <Input 
                      type="number" 
                      {...register("employee_count", { valueAsNumber: true })} 
                      placeholder="e.g. 50" 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="annual_revenue">Annual Revenue ($)</Label>
                  <Input 
                    type="number" 
                    {...register("annual_revenue", { valueAsNumber: true })} 
                    placeholder="e.g. 1000000" 
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea {...register("description")} rows={4} />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" {...register("email")} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input {...register("phone")} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input {...register("website")} placeholder="https://..." />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input {...register("address")} />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input {...register("city")} />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input {...register("state")} />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input {...register("postal_code")} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input {...register("country")} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Social Media & Links</h3>
                  <Button type="button" variant="outline" onClick={addLink}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>

                <div className="space-y-3">
                  {links.map((link, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-3">
                            <Label>Type</Label>
                            <Select
                              value={link.link_type}
                              onValueChange={(value) => updateLink(index, "link_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {linkTypes.map((type) => {
                                  const Icon = type.icon;
                                  return (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center">
                                        <Icon className="w-4 h-4 mr-2" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label>Label</Label>
                            <Input
                              placeholder="e.g. Main Office, Support"
                              value={link.label}
                              onChange={(e) => updateLink(index, "label", e.target.value)}
                            />
                          </div>
                          <div className="col-span-5">
                            <Label>URL</Label>
                            <Input
                              placeholder="https://..."
                              value={link.url}
                              onChange={(e) => updateLink(index, "url", e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeLink(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : company ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}