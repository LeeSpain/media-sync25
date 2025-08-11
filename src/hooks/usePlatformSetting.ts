import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Generic hook to load and save a JSON setting in platform_settings keyed by `key`
// Shape example: { enabled: boolean, ... }
export function usePlatformSetting<T extends Record<string, any>>(key: string, initial: T) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["platform_setting", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value, created_by, created_at")
        .eq("key", key)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<T>) => {
      const current = { ...(initial as T), ...(((query.data?.[0] as any)?.value as T) ?? {}) };
      const next = { ...current, ...partial } as T;

      const { data: userRes, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Try update existing row for this user+key
      const { data: updated, error: updateError } = await supabase
        .from("platform_settings")
        .update({ value: next })
        .eq("key", key)
        .eq("created_by", userId)
        .select();

      if (updateError) throw updateError;

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from("platform_settings")
          .insert({ key, value: next, created_by: userId });

        if (insertError) throw insertError;
      }

      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform_setting", key] });
      toast({ title: "Saved", description: "Settings updated successfully." });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message ?? "Please try again." });
    },
  });

  const persisted = (((query.data?.[0] as any)?.value as T) ?? ({} as T));
  const value = { ...(initial as T), ...persisted } as T;

  return {
    value,
    isLoading: query.isLoading,
    save: (partial: Partial<T>) => mutation.mutateAsync(partial),
    saving: mutation.isPending,
  };
}
