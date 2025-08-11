
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");

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

  const onAdd = async () => {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      toast({ title: "Not signed in", description: "Please log in to add contacts." });
      return;
    }
    const created_by = userData.user.id;
    const payload = {
      created_by,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
    };
    const { error } = await supabase.from("crm_contacts").insert([payload]);
    if (error) {
      console.error("Add contact error:", error);
      toast({ title: "Error", description: error.message });
      return;
    }
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    toast({ title: "Contact added" });
    qc.invalidateQueries({ queryKey: ["crm_contacts"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick add contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={onAdd}>Add contact</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet. Create your first contact above.</p>
          ) : (
            <ul className="divide-y">
              {contacts.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {(c.first_name || "") + " " + (c.last_name || "") || "Unnamed"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.email || "—"} {c.phone ? "• " + c.phone : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsList;
