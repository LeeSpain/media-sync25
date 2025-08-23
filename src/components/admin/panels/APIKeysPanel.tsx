import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Plus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface APIKey {
  name: string;
  description: string;
  configured: boolean;
  required: boolean;
}

const apiKeys: APIKey[] = [
  {
    name: "TWITTER_CONSUMER_KEY",
    description: "Twitter API Consumer Key for social media publishing",
    configured: false,
    required: true,
  },
  {
    name: "TWITTER_CONSUMER_SECRET", 
    description: "Twitter API Consumer Secret for social media publishing",
    configured: false,
    required: true,
  },
  {
    name: "TWITTER_ACCESS_TOKEN",
    description: "Twitter API Access Token for social media publishing",
    configured: false,
    required: true,
  },
  {
    name: "TWITTER_ACCESS_TOKEN_SECRET",
    description: "Twitter API Access Token Secret for social media publishing",
    configured: false,
    required: true,
  },
  {
    name: "LINKEDIN_CLIENT_ID",
    description: "LinkedIn API Client ID for professional network integration",
    configured: false,
    required: false,
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    description: "LinkedIn API Client Secret for professional network integration", 
    configured: false,
    required: false,
  },
  {
    name: "FACEBOOK_APP_ID",
    description: "Meta/Facebook App ID for social media integration",
    configured: false,
    required: false,
  },
  {
    name: "FACEBOOK_APP_SECRET",
    description: "Meta/Facebook App Secret for social media integration",
    configured: false,
    required: false,
  },
];

export default function APIKeysPanel() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [newKey, setNewKey] = useState({ name: "", value: "" });

  const toggleSecretVisibility = (keyName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const handleAddKey = () => {
    if (!newKey.name || !newKey.value) {
      toast({
        title: "Error",
        description: "Please provide both key name and value",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would call the secrets API
    toast({
      title: "API Key Added",
      description: `${newKey.name} has been securely stored`,
    });

    setNewKey({ name: "", value: "" });
  };

  return (
    <div className="space-y-6">
      {/* Required Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Required API Keys
            <Badge variant="destructive">Action Required</Badge>
          </CardTitle>
          <CardDescription>
            These keys are required for core platform functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.filter(key => key.required).map((key) => (
            <div key={key.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{key.name}</Label>
                  {key.configured ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {key.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={key.configured ? "default" : "secondary"}>
                  {key.configured ? "Configured" : "Missing"}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Configure API Key",
                      description: "Use the 'Add New Key' section below to configure this key",
                    });
                  }}
                >
                  {key.configured ? "Update" : "Configure"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optional Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Optional API Keys</CardTitle>
          <CardDescription>
            These keys enable additional platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.filter(key => !key.required).map((key) => (
            <div key={key.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{key.name}</Label>
                  {key.configured ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {key.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={key.configured ? "default" : "outline"}>
                  {key.configured ? "Configured" : "Not Set"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Configure API Key",
                      description: "Use the 'Add New Key' section below to configure this key",
                    });
                  }}
                >
                  {key.configured ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add New Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New API Key
          </CardTitle>
          <CardDescription>
            Securely store API keys for platform integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., TWITTER_CONSUMER_KEY"
                value={newKey.name}
                onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="keyValue">Key Value</Label>
              <div className="relative">
                <Input
                  id="keyValue"
                  type={showSecrets[newKey.name] ? "text" : "password"}
                  placeholder="Enter API key value"
                  value={newKey.value}
                  onChange={(e) => setNewKey(prev => ({ ...prev, value: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggleSecretVisibility(newKey.name)}
                >
                  {showSecrets[newKey.name] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddKey} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}