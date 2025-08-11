import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Building, MapPin, Phone, Mail, Calendar, Briefcase, 
  ExternalLink, Edit, X, Linkedin, Instagram, Facebook, 
  Twitter, Youtube, Globe 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContactDetailsModalProps {
  contactId: string;
  onClose: () => void;
  onEdit: () => void;
}

const linkIcons = {
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  website: Globe,
  email: Mail,
  phone: Phone,
  other: ExternalLink,
};

export default function ContactDetailsModal({ contactId, onClose, onEdit }: ContactDetailsModalProps) {
  const [contact, setContact] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactDetails();
  }, [contactId]);

  const fetchContactDetails = async () => {
    try {
      // Fetch contact with company details
      const { data: contactData, error: contactError } = await supabase
        .from("crm_contacts")
        .select(`
          *,
          crm_companies (*)
        `)
        .eq("id", contactId)
        .single();

      if (contactError) throw contactError;
      
      setContact(contactData);
      if (contactData.crm_companies) {
        setCompany(contactData.crm_companies);
      }

      // Fetch contact links
      const { data: linksData, error: linksError } = await supabase
        .from("crm_links")
        .select("*")
        .eq("contact_id", contactId)
        .order("link_type");

      if (linksError) throw linksError;
      setLinks(linksData || []);

    } catch (error) {
      console.error("Error fetching contact details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8 text-center">
            Loading contact details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8 text-center">
            Contact not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed Contact";
  const initials = `${contact.first_name?.charAt(0) || ""}${contact.last_name?.charAt(0) || ""}` || "?";

  const formatLink = (url: string) => {
    if (url.startsWith("http")) return url;
    if (url.includes("@")) return `mailto:${url}`;
    if (url.match(/^\+?\d/)) return `tel:${url}`;
    return `https://${url}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                {contact.job_title && (
                  <p className="text-muted-foreground flex items-center mt-1">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {contact.job_title}
                    {company && <span className="ml-2">at {company.name}</span>}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="links">Links & Social</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.date_of_birth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {new Date(contact.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {(contact.address || contact.city || contact.state || contact.country) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <div className="font-medium">
                        {contact.address && <p>{contact.address}</p>}
                        <p>
                          {[contact.city, contact.state, contact.postal_code]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {contact.country && <p>{contact.country}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {contact.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {contact.notes}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.personal_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Personal Email</p>
                      <a 
                        href={`mailto:${contact.personal_email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.personal_email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.work_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Work Email</p>
                      <a 
                        href={`mailto:${contact.work_email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.work_email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.mobile_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile Phone</p>
                      <a 
                        href={`tel:${contact.mobile_phone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.mobile_phone}
                      </a>
                    </div>
                  </div>
                )}

                {contact.work_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Work Phone</p>
                      <a 
                        href={`tel:${contact.work_phone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.work_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              {company ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      {company.industry && (
                        <Badge variant="secondary">{company.industry}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.website && (
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a 
                          href={formatLink(company.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a 
                          href={`tel:${company.phone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {company.phone}
                        </a>
                      </div>
                    )}

                    {company.employee_count && (
                      <div>
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="font-medium">{company.employee_count.toLocaleString()}</p>
                      </div>
                    )}

                    {company.annual_revenue && (
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Revenue</p>
                        <p className="font-medium">${company.annual_revenue.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <div>
                      <h4 className="font-semibold mb-2">About</h4>
                      <p className="text-muted-foreground">{company.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No company information available</p>
              )}
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              {links.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {links.map((link) => {
                    const IconComponent = linkIcons[link.link_type as keyof typeof linkIcons] || ExternalLink;
                    return (
                      <div key={link.id} className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {link.label || link.link_type.charAt(0).toUpperCase() + link.link_type.slice(1)}
                          </p>
                          <a 
                            href={formatLink(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center"
                          >
                            {link.url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No links available</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}