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

interface ContactFormData {
  first_name: string;
  last_name: string;
  personal_email?: string;
  work_email?: string;
  mobile_phone?: string;
  work_phone?: string;
  job_title?: string;
  company_id?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
}

interface LinkData {
  link_type: string;
  label: string;
  url: string;
  is_primary: boolean;
}

interface ContactFormProps {
  contact?: any;
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

export default function ContactForm({ contact, onClose, onSuccess }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const { register, handleSubmit, setValue, watch } = useForm<ContactFormData>();

  useEffect(() => {
    fetchCompanies();
    if (contact) {
      // Populate form with existing contact data
      Object.keys(contact).forEach(key => {
        setValue(key as keyof ContactFormData, contact[key]);
      });
      fetchContactLinks();
    }
  }, [contact, setValue]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("crm_companies")
      .select("id, name")
      .order("name");
    if (data) setCompanies(data);
  };

  const fetchContactLinks = async () => {
    if (!contact?.id) return;
    const { data } = await supabase
      .from("crm_links")
      .select("*")
      .eq("contact_id", contact.id);
    if (data) setLinks(data);
  };

  const addLink = () => {
    setLinks([...links, { link_type: "linkedin", label: "", url: "", is_primary: false }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof LinkData, value: any) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const contactData = {
        ...data,
        created_by: user.id,
        date_of_birth: data.date_of_birth || null,
      };

      let contactId = contact?.id;

      if (contact) {
        const { error } = await supabase
          .from("crm_contacts")
          .update(contactData)
          .eq("id", contact.id);
        if (error) throw error;
      } else {
        const { data: newContact, error } = await supabase
          .from("crm_contacts")
          .insert(contactData)
          .select()
          .single();
        if (error) throw error;
        contactId = newContact.id;
      }

      // Handle links
      if (contactId) {
        // Delete existing links if updating
        if (contact) {
          await supabase.from("crm_links").delete().eq("contact_id", contactId);
        }

        // Insert new links
        const linksToInsert = links
          .filter(link => link.url.trim())
          .map(link => ({
            ...link,
            contact_id: contactId,
            created_by: user.id,
          }));

        if (linksToInsert.length > 0) {
          const { error } = await supabase.from("crm_links").insert(linksToInsert);
          if (error) throw error;
        }
      }

      toast.success(`Contact ${contact ? "updated" : "created"} successfully`);
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
          <CardTitle>{contact ? "Edit Contact" : "New Contact"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="contact">Contact Details</TabsTrigger>
                <TabsTrigger value="links">Social & Links</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input {...register("first_name", { required: true })} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input {...register("last_name")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input {...register("job_title")} />
                  </div>
                  <div>
                    <Label htmlFor="company_id">Company</Label>
                    <Select onValueChange={(value) => setValue("company_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input type="date" {...register("date_of_birth")} />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register("notes")} rows={3} />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="personal_email">Personal Email</Label>
                    <Input type="email" {...register("personal_email")} />
                  </div>
                  <div>
                    <Label htmlFor="work_email">Work Email</Label>
                    <Input type="email" {...register("work_email")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobile_phone">Mobile Phone</Label>
                    <Input {...register("mobile_phone")} />
                  </div>
                  <div>
                    <Label htmlFor="work_phone">Work Phone</Label>
                    <Input {...register("work_phone")} />
                  </div>
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
                              placeholder="e.g. Personal, Work"
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
                {loading ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}