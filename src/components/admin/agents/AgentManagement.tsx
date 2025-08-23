import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Plus, Wrench } from "lucide-react";

// Lightweight types (avoid importing generated types)
type Agent = {
  id: string;
  name: string;
  description: string | null;
  model: string;
  temperature: number;
  active: boolean;
  avatar_url: string | null;
  instructions: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  requires_secret: boolean;
};

type AgentTool = {
  agent_id: string;
  tool_id: string;
  enabled: boolean;
};

function useAgents() {
  return useQuery({
    queryKey: ["ai_agents"],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Agent[]) ?? [];
    },
  });
}

function useTools() {
  return useQuery({
    queryKey: ["ai_tools"],
    queryFn: async (): Promise<Tool[]> => {
      const { data, error } = await supabase
        .from("ai_tools")
        .select("id, name, slug, description, requires_secret")
        .order("name");
      if (error) throw error;
      return (data as Tool[]) ?? [];
    },
  });
}

function useAgentTools(agentId: string | null) {
  return useQuery({
    queryKey: ["ai_agent_tools", agentId],
    enabled: !!agentId,
    queryFn: async (): Promise<AgentTool[]> => {
      const { data, error } = await supabase
        .from("ai_agent_tools")
        .select("agent_id, tool_id, enabled")
        .eq("agent_id", agentId);
      if (error) throw error;
      return (data as AgentTool[]) ?? [];
    },
  });
}

export default function AgentManagement() {
  const qc = useQueryClient();
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: tools } = useTools();

  const [editing, setEditing] = useState<Agent | null>(null);
  const [open, setOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (partial: Partial<Agent>) => {
      const { data: userRes, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const payload = {
        name: partial.name || "New Agent",
        description: partial.description ?? null,
        model: partial.model || "gpt-4o-mini",
        temperature: typeof partial.temperature === "number" ? partial.temperature : 0.2,
        active: partial.active ?? true,
        avatar_url: partial.avatar_url ?? null,
        instructions: partial.instructions ?? null,
        created_by: userId,
      };

      const { data, error } = await supabase
        .from("ai_agents")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_agents"] });
      toast({ title: "Agent created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: e?.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async (agent: Agent) => {
      const { id, created_by, created_at, updated_at, ...updatable } = agent;
      const { error } = await supabase
        .from("ai_agents")
        .update(updatable)
        .eq("id", id);
      if (error) throw error;
      return agent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_agents"] });
      toast({ title: "Agent updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message }),
  });

  const toggleActive = (agent: Agent) => {
    updateMutation.mutate({ ...agent, active: !agent.active });
  };

  const startCreate = () => {
    setEditing({
      id: "",
      name: "New Agent",
      description: "",
      model: "gpt-4o-mini",
      temperature: 0.2,
      active: true,
      avatar_url: null,
      instructions: "",
      created_by: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setOpen(true);
  };

  const startEdit = (agent: Agent) => {
    setEditing(agent);
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" /> Agent Management
        </CardTitle>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Agent
        </Button>
      </CardHeader>
      <CardContent>
        {loadingAgents ? (
          <div className="text-muted-foreground">Loading agents…</div>
        ) : agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((a) => (
              <div key={a.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold">{a.name}</span>
                      {a.active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {a.description || "No description"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(a)} aria-label="Edit agent">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${a.id}`} className="text-xs">Active</Label>
                      <Switch id={`active-${a.id}`} checked={a.active} onCheckedChange={() => toggleActive(a)} />
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Model</div>
                    <div className="font-medium">{a.model}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Temperature</div>
                    <div className="font-medium">{a.temperature}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <AgentToolsEditor agentId={a.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No agents found. Create your first agent.</div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Agent" : "Create Agent"}</DialogTitle>
            <DialogDescription>
              Configure core parameters and instructions for this agent.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <AgentForm
              value={editing}
              onCancel={() => setOpen(false)}
              onSubmit={async (val) => {
                if (val.id) {
                  await updateMutation.mutateAsync(val);
                } else {
                  await createMutation.mutateAsync(val);
                }
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AgentForm({
  value,
  onSubmit,
  onCancel,
}: {
  value: Agent;
  onSubmit: (v: Agent) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [state, setState] = useState<Agent>(value);

  const set = <K extends keyof Agent>(key: K, v: Agent[K]) =>
    setState((s) => ({ ...s, [key]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={state.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={state.model} onChange={(e) => set("model", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={state.temperature}
            onChange={(e) => set("temperature", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="active">Active</Label>
          <div className="flex items-center gap-2">
            <Switch id="active" checked={state.active} onCheckedChange={(v) => set("active", v)} />
            <span className="text-sm text-muted-foreground">Enable or disable this agent</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={state.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions / System Prompt</Label>
        <Textarea
          id="instructions"
          value={state.instructions ?? ""}
          onChange={(e) => set("instructions", e.target.value)}
          rows={8}
          placeholder="Define the agent's role, constraints, and style."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(state)}>Save</Button>
      </div>
    </div>
  );
}

function AgentToolsEditor({ agentId }: { agentId: string }) {
  const qc = useQueryClient();
  const { data: tools, isLoading: loadingTools } = useTools();
  const { data: assigned, isLoading: loadingAssigned } = useAgentTools(agentId);

  const assignedSet = useMemo(() => new Set((assigned ?? []).filter(t => t.enabled).map((t) => t.tool_id)), [assigned]);

  const upsertMutation = useMutation({
    mutationFn: async ({ toolId, enable }: { toolId: string; enable: boolean }) => {
      if (enable) {
        const { data, error } = await supabase
          .from("ai_agent_tools")
          .upsert({ agent_id: agentId, tool_id: toolId, enabled: true })
          .select();
        if (error) throw error;
        return data;
      }
      // disable → delete mapping
      const { error } = await supabase
        .from("ai_agent_tools")
        .delete()
        .eq("agent_id", agentId)
        .eq("tool_id", toolId);
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_agent_tools", agentId] });
      toast({ title: "Tools updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message }),
  });

  if (loadingTools || loadingAssigned) {
    return <div className="text-xs text-muted-foreground">Loading tools…</div>;
  }

  if (!tools || tools.length === 0) {
    return <div className="text-xs text-muted-foreground">No tools available.</div>;
  }

  return (
    <div>
      <div className="text-sm font-medium mb-2">Tools</div>
      <div className="grid grid-cols-1 gap-2">
        {tools.map((t) => {
          const enabled = assignedSet.has(t.id);
          return (
            <label key={t.id} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={enabled}
                onChange={(e) => upsertMutation.mutate({ toolId: t.id, enable: e.target.checked })}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  {t.requires_secret && <Badge variant="outline">Requires secret</Badge>}
                </div>
                {t.description && (
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
