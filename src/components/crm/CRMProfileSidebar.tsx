import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Building, DollarSign, Activity, Plus, 
  Phone, Mail, MapPin, ExternalLink, Linkedin,
  Instagram, Facebook, Twitter, Youtube, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface CRMStats {
  contactsCount: number;
  companiesCount: number;
  dealsCount: number;
  totalValue: number;
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

export default function CRMProfileSidebar() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);

  // Fetch CRM stats
  const { data: stats } = useQuery({
    queryKey: ["crm_stats"],
    queryFn: async () => {
      const [contactsRes, companiesRes, dealsRes] = await Promise.all([
        supabase.from("crm_contacts").select("id", { count: "exact" }),
        supabase.from("crm_companies").select("id", { count: "exact" }),
        supabase.from("crm_deals").select("value"),
      ]);

      const totalValue = dealsRes.data?.reduce((sum, deal) => sum + Number(deal.value || 0), 0) || 0;

      return {
        contactsCount: contactsRes.count || 0,
        companiesCount: companiesRes.count || 0,
        dealsCount: dealsRes.data?.length || 0,
        totalValue,
      } as CRMStats;
    },
  });

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
    fetchRecentContacts();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile({
        ...profile,
        email: user.email,
        display_name: profile?.display_name || user.email?.split("@")[0] || "User",
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      const { data } = await supabase
        .from("crm_contacts")
        .select(`
          id,
          first_name,
          last_name,
          personal_email,
          work_email,
          mobile_phone,
          job_title,
          crm_companies (name),
          crm_links (link_type, url, label)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentContacts(data || []);
    } catch (error) {
      console.error("Error fetching recent contacts:", error);
    }
  };

  const formatLink = (url: string) => {
    if (url.startsWith("http")) return url;
    if (url.includes("@")) return `mailto:${url}`;
    if (url.match(/^\+?\d/)) return `tel:${url}`;
    return `https://${url}`;
  };

  if (!userProfile) {
    return (
      <div className="w-80 bg-background border-l p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border-l h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* User Profile Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={userProfile.avatar_url || "/placeholder.svg"}
                    alt={`${userProfile.display_name} avatar`}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <AvatarFallback>
                    {userProfile.display_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{userProfile.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* CRM Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                CRM Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Contacts</span>
                </div>
                <Badge variant="secondary">{stats?.contactsCount || 0}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Companies</span>
                </div>
                <Badge variant="secondary">{stats?.companiesCount || 0}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Deals</span>
                </div>
                <Badge variant="secondary">{stats?.dealsCount || 0}</Badge>
              </div>
              
              {stats?.totalValue && stats.totalValue > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                  <p className="font-semibold text-green-600">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts yet</p>
              ) : (
                <div className="space-y-3">
                  {recentContacts.map((contact) => {
                    const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed";
                    const initials = `${contact.first_name?.charAt(0) || ""}${contact.last_name?.charAt(0) || ""}` || "?";
                    const primaryEmail = contact.work_email || contact.personal_email;
                    const socialLinks = contact.crm_links?.filter(link => 
                      ["linkedin", "instagram", "facebook", "twitter"].includes(link.link_type)
                    ) || [];

                    return (
                      <div key={contact.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{fullName}</p>
                          {contact.job_title && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.job_title}
                              {contact.crm_companies && ` at ${contact.crm_companies.name}`}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-1">
                            {primaryEmail && (
                              <a 
                                href={`mailto:${primaryEmail}`}
                                className="text-xs text-primary hover:underline"
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                            {contact.mobile_phone && (
                              <a 
                                href={`tel:${contact.mobile_phone}`}
                                className="text-xs text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                            {socialLinks.slice(0, 3).map((link, idx) => {
                              const IconComponent = linkIcons[link.link_type as keyof typeof linkIcons] || ExternalLink;
                              return (
                                <a
                                  key={idx}
                                  href={formatLink(link.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  <IconComponent className="w-3 h-3" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}