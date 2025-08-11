
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Eye, Edit } from "lucide-react";
import ContactForm from "./ContactForm";
import ContactDetailsModal from "./ContactDetailsModal";

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

const ContactsList = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["crm_contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const contacts = useMemo(() => data ?? [], [data]);

  const handleFormSuccess = () => {
    qc.invalidateQueries({ queryKey: ["crm_contacts"] });
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Contact
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet. Click "New Contact" to add your first contact.</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {(c.first_name || "") + " " + (c.last_name || "") || "Unnamed"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.email || "—"} {c.phone ? "• " + c.phone : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDetails(c.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(c)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetails && (
        <ContactDetailsModal
          contactId={showDetails}
          onClose={() => setShowDetails(null)}
          onEdit={() => {
            const contact = contacts.find(c => c.id === showDetails);
            if (contact) {
              setShowDetails(null);
              handleEdit(contact);
            }
          }}
        />
      )}
    </>
  );
};

export default ContactsList;
