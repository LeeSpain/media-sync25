import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    phone?: string;
    email?: string;
    workEmail?: string;
    workPhone?: string;
    mobilePhone?: string;
    personalEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    dateOfBirth?: string;
    notes?: string;
    company?: {
      id: string;
      name: string;
      industry?: string;
      website?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      employeeCount?: number;
      annualRevenue?: number;
      description?: string;
    };
    socialLinks?: {
      id: string;
      linkType: string;
      url: string;
      label?: string;
      isPrimary?: boolean;
    }[];
  };
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfile | null> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      // Try to find matching CRM contact by email
      const { data: contact } = await supabase
        .from("crm_contacts")
        .select(`
          id,
          first_name,
          last_name,
          job_title,
          phone,
          email,
          work_email,
          work_phone,
          mobile_phone,
          personal_email,
          address,
          city,
          state,
          country,
          postal_code,
          date_of_birth,
          notes,
          crm_companies (
            id,
            name,
            industry,
            website,
            phone,
            email,
            address,
            city,
            state,
            country,
            postal_code,
            employee_count,
            annual_revenue,
            description
          ),
          crm_links (
            id,
            link_type,
            url,
            label,
            is_primary
          )
        `)
        .or(`email.eq.${user.email},work_email.eq.${user.email},personal_email.eq.${user.email}`)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email || "",
        displayName: profile?.display_name,
        avatarUrl: profile?.avatar_url,
        contact: contact ? {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          jobTitle: contact.job_title,
          phone: contact.phone,
          email: contact.email,
          workEmail: contact.work_email,
          workPhone: contact.work_phone,
          mobilePhone: contact.mobile_phone,
          personalEmail: contact.personal_email,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          postalCode: contact.postal_code,
          dateOfBirth: contact.date_of_birth,
          notes: contact.notes,
          company: contact.crm_companies ? {
            id: contact.crm_companies.id,
            name: contact.crm_companies.name,
            industry: contact.crm_companies.industry,
            website: contact.crm_companies.website,
            phone: contact.crm_companies.phone,
            email: contact.crm_companies.email,
            address: contact.crm_companies.address,
            city: contact.crm_companies.city,
            state: contact.crm_companies.state,
            country: contact.crm_companies.country,
            postalCode: contact.crm_companies.postal_code,
            employeeCount: contact.crm_companies.employee_count,
            annualRevenue: contact.crm_companies.annual_revenue,
            description: contact.crm_companies.description,
          } : undefined,
          socialLinks: contact.crm_links?.map(link => ({
            id: link.id,
            linkType: link.link_type,
            url: link.url,
            label: link.label,
            isPrimary: link.is_primary,
          })) || [],
        } : undefined,
      };
    },
  });
}