import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CampaignSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "paused"]).default("draft"),
  start_at: z.date().optional(),
  end_at: z.date().optional(),
});

export type NewCampaign = z.infer<typeof CampaignSchema>;

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "completed" | "paused";
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (campaign: Campaign) => void;
}

const DateField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder: string;
}) => {
  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : <span>{placeholder}</span>}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};

export function CreateCampaignDialog({ open, onOpenChange, onCreated }: CreateCampaignDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NewCampaign>({
    resolver: zodResolver(CampaignSchema),
    defaultValues: { status: "draft" },
  });

  const onSubmit = async (values: NewCampaign) => {
    try {
      setSubmitting(true);
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        toast({ title: "Not signed in", description: "Please log in to create campaigns." });
        return;
      }

      const payload = {
        name: values.name,
        description: values.description ?? null,
        status: values.status,
        start_at: values.start_at ? values.start_at.toISOString() : null,
        end_at: values.end_at ? values.end_at.toISOString() : null,
        created_by: userRes.user.id,
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert([payload])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        onCreated(data as Campaign);
        toast({ title: "Campaign created", description: `${data.name} saved successfully.` });
        form.reset({ status: "draft" });
        onOpenChange(false);
      } else {
        toast({ title: "Saved", description: "Campaign was created." });
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message ?? "Failed to create campaign" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>Define your campaign details and schedule.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Q4 Product Launch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Goals, audiences, channels..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Draft" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <DateField
                    label="Start date"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick a date"
                  />
                )}
              />
              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <DateField
                    label="End date"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick a date"
                  />
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCampaignDialog;
