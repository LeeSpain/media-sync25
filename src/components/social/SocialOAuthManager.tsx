import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/components/ui/use-toast";
import { Twitter, Linkedin, Facebook, Instagram, CheckCircle2, AlertTriangle, Unlink } from "lucide-react";

type ConnectedAccount = {
  id: string;
  provider: string;
  account_name: string | null;
  account_id: string | null;
  status: string;
  scopes: string[];
  created_at: string;
  expires_at: string | null;
};

const socialProviders = [
  {
    key: "twitter",
    name: "X / Twitter",
    icon: Twitter,
    color: "text-sky-500",
    description: "Publish tweets and threads",
    scopes: ["tweet.write", "users.read"],
    available: true
  },
  {
    key: "linkedin_oidc",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    description: "Share posts and articles",
    scopes: ["w_member_social", "r_liteprofile"],
    available: true
  },
  {
    key: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    description: "Post to pages and profiles",
    scopes: ["pages_manage_posts", "publish_to_groups"],
    available: false // Coming soon
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    description: "Share photos and stories",
    scopes: ["instagram_basic", "instagram_content_publish"],
    available: false // Coming soon
  }
];

export default function SocialOAuthManager() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Failed to load connections",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect social accounts",
        variant: "destructive"
      });
      return;
    }

    setConnecting(provider);

    try {
      // Use Supabase Auth for OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/dashboard/settings?connected=${provider}`,
          scopes: socialProviders.find(p => p.key === provider)?.scopes.join(" ")
        }
      });

      if (error) throw error;

      // The actual connection will be handled by the redirect callback
      toast({
        title: "Redirecting to authorization",
        description: `Connecting to ${socialProviders.find(p => p.key === provider)?.name}...`
      });

    } catch (error: any) {
      console.error("OAuth connection failed:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to initiate connection",
        variant: "destructive"
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    try {
      const { error } = await supabase
        .from("connected_accounts")
        .update({ status: "disconnected" })
        .eq("id", connectionId);

      if (error) throw error;

      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: "disconnected" }
            : conn
        )
      );

      toast({
        title: "Account disconnected",
        description: `Successfully disconnected ${socialProviders.find(p => p.key === provider)?.name}`
      });

    } catch (error: any) {
      console.error("Failed to disconnect:", error);
      toast({
        title: "Disconnection failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getConnectionForProvider = (provider: string) => {
    return connections.find(conn => 
      conn.provider === provider && conn.status === "connected"
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Account Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading connections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Account Connections</CardTitle>
          <CardDescription>
            Connect your social media accounts to publish content directly from the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {socialProviders.map((provider) => {
              const connection = getConnectionForProvider(provider.key);
              const isConnected = !!connection;
              const isConnecting = connecting === provider.key;
              const IconComponent = provider.icon;

              return (
                <div
                  key={provider.key}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <IconComponent className={`h-8 w-8 ${provider.color}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{provider.name}</h3>
                        {isConnected && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                        {!provider.available && (
                          <Badge variant="outline">Coming Soon</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                      {isConnected && connection && (
                        <div className="text-xs text-muted-foreground">
                          Account: {connection.account_name || connection.account_id || "Connected"}
                          {connection.expires_at && (
                            <span className="ml-2">
                              Expires: {new Date(connection.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection!.id, provider.key)}
                        className="gap-2"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(provider.key)}
                        disabled={!provider.available || isConnecting}
                        size="sm"
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection History</CardTitle>
            <CardDescription>
              All social account connections and their status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((connection) => {
                const provider = socialProviders.find(p => p.key === connection.provider);
                const IconComponent = provider?.icon || AlertTriangle;
                
                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${provider?.color || "text-gray-500"}`} />
                      <div>
                        <div className="font-medium">
                          {provider?.name || connection.provider}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {connection.account_name || connection.account_id || "Unknown account"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Connected: {new Date(connection.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          connection.status === "connected"
                            ? "default"
                            : connection.status === "disconnected"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {connection.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> We only store minimal account information needed for publishing. 
          Your social media credentials are securely handled by Supabase Auth and we never store your passwords.
        </AlertDescription>
      </Alert>
    </div>
  );
}