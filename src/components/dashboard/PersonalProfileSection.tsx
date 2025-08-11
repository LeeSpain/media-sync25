import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  ExternalLink,
  Edit
} from "lucide-react";
import { useState } from "react";
import { PersonalProfileEditModal } from "./PersonalProfileEditModal";

export function PersonalProfileSection() {
  const { data: userProfile, isLoading } = useUserProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  const { contact } = userProfile;
  const fullName = contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() : userProfile.displayName;
  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase() : userProfile.email[0].toUpperCase();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-8"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile.avatarUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {fullName || "No name set"}
              </h3>
              {contact?.jobTitle && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Briefcase className="h-3 w-3" />
                  {contact.jobTitle}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {userProfile.email}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          {contact && (
            <div className="space-y-3">
              {/* Phone Numbers */}
              {(contact.phone || contact.workPhone || contact.mobilePhone) && (
                <div className="space-y-1">
                  {contact.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-muted-foreground">Phone:</span>
                      {contact.phone}
                    </p>
                  )}
                  {contact.workPhone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-muted-foreground">Work:</span>
                      {contact.workPhone}
                    </p>
                  )}
                  {contact.mobilePhone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-muted-foreground">Mobile:</span>
                      {contact.mobilePhone}
                    </p>
                  )}
                </div>
              )}

              {/* Address */}
              {contact.address && (
                <p className="text-sm flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  <span>
                    {contact.address}
                    {contact.city && `, ${contact.city}`}
                    {contact.state && `, ${contact.state}`}
                    {contact.country && `, ${contact.country}`}
                    {contact.postalCode && ` ${contact.postalCode}`}
                  </span>
                </p>
              )}

              {/* Company Info */}
              {contact.company && (
                <div className="border-t pt-3">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    Company
                  </h4>
                  <div className="space-y-1 pl-6">
                    <p className="font-medium">{contact.company.name}</p>
                    {contact.company.industry && (
                      <Badge variant="secondary" className="text-xs">
                        {contact.company.industry}
                      </Badge>
                    )}
                    {contact.company.website && (
                      <p className="text-sm">
                        <a 
                          href={contact.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {contact.company.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    )}
                    {contact.company.description && (
                      <p className="text-sm text-muted-foreground">
                        {contact.company.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {contact.socialLinks && contact.socialLinks.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2">Social Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {contact.socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors flex items-center gap-1"
                      >
                        {link.label || link.linkType}
                        <ExternalLink className="h-2 w-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!contact && (
            <div className="text-center py-4 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                No CRM contact profile found
              </p>
              <p className="text-xs text-muted-foreground">
                Create a contact in CRM with your email to see detailed profile information
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PersonalProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
      />
    </>
  );
}