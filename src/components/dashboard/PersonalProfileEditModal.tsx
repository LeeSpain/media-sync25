import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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
    workPhone?: string;
    mobilePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
  };
}

interface PersonalProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export function PersonalProfileEditModal({ isOpen, onClose, userProfile }: PersonalProfileEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [displayName, setDisplayName] = useState(userProfile.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");
  
  // Contact fields
  const [firstName, setFirstName] = useState(userProfile.contact?.firstName || "");
  const [lastName, setLastName] = useState(userProfile.contact?.lastName || "");
  const [jobTitle, setJobTitle] = useState(userProfile.contact?.jobTitle || "");
  const [phone, setPhone] = useState(userProfile.contact?.phone || "");
  const [workPhone, setWorkPhone] = useState(userProfile.contact?.workPhone || "");
  const [mobilePhone, setMobilePhone] = useState(userProfile.contact?.mobilePhone || "");
  const [address, setAddress] = useState(userProfile.contact?.address || "");
  const [city, setCity] = useState(userProfile.contact?.city || "");
  const [state, setState] = useState(userProfile.contact?.state || "");
  const [country, setCountry] = useState(userProfile.contact?.country || "");
  const [postalCode, setPostalCode] = useState(userProfile.contact?.postalCode || "");
  const [notes, setNotes] = useState(userProfile.contact?.notes || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userProfile.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        });

      if (profileError) throw profileError;

      // Update or create contact if we have contact data
      if (userProfile.contact?.id) {
        // Update existing contact
        const { error: contactError } = await supabase
          .from("crm_contacts")
          .update({
            first_name: firstName,
            last_name: lastName,
            job_title: jobTitle,
            phone: phone,
            work_phone: workPhone,
            mobile_phone: mobilePhone,
            address: address,
            city: city,
            state: state,
            country: country,
            postal_code: postalCode,
            notes: notes,
          })
          .eq("id", userProfile.contact.id);

        if (contactError) throw contactError;
      } else if (firstName || lastName || jobTitle || phone) {
        // Create new contact if we have some contact data
        const { error: contactError } = await supabase
          .from("crm_contacts")
          .insert({
            first_name: firstName,
            last_name: lastName,
            job_title: jobTitle,
            email: userProfile.email,
            phone: phone,
            work_phone: workPhone,
            mobile_phone: mobilePhone,
            address: address,
            city: city,
            state: state,
            country: country,
            postal_code: postalCode,
            notes: notes,
            created_by: userProfile.id,
          });

        if (contactError) throw contactError;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit My Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Basic Profile */}
          <div className="space-y-4">
            <h3 className="font-medium">Basic Information</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Contact Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Your job title"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="workPhone">Work Phone</Label>
                <Input
                  id="workPhone"
                  value={workPhone}
                  onChange={(e) => setWorkPhone(e.target.value)}
                  placeholder="Work phone"
                />
              </div>
              <div>
                <Label htmlFor="mobilePhone">Mobile Phone</Label>
                <Input
                  id="mobilePhone"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="Mobile phone"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-medium">Address</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal code"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-medium">Notes</h3>
            <div>
              <Label htmlFor="notes">Personal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about yourself"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}