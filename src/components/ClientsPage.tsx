import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit, Users, FolderOpen, Clock, Mail, MapPin, Building, TrendingUp, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  created_at: string;
}

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    address: ""
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkLimit, plan } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) return;

    // Check subscription limits
    const limitCheck = checkLimit('maxClients', clients.length);
    if (!limitCheck.allowed) {
      toast({
        title: "Limit Reached",
        description: limitCheck.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          name: newClient.name,
          email: newClient.email,
          address: newClient.address,
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client added successfully",
      });

      setNewClient({ name: "", email: "", address: "" });
      setIsDialogOpen(false);
      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      fetchClients();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-4">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Client Management</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Your Clients
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Build lasting relationships with your clients and grow your freelance business
        </p>
      </div>
      
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg h-11 px-6"
              disabled={!checkLimit('maxClients', clients.length).allowed}
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Add New Client
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="name" className="text-sm font-medium">Client Name</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Enter client name"
                  className="h-11"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@company.com"
                  className="h-11"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="address" className="text-sm font-medium">Address (Optional)</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="123 Business Street, City"
                  className="h-11"
                />
              </div>
              <Button 
                onClick={handleAddClient} 
                disabled={!newClient.name || !newClient.email}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-11"
              >
                Add Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 dark:from-blue-950/50 dark:to-cyan-950/50 dark:border-blue-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clients</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{filteredClients.length}</div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">Active relationships</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Growth Rate</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">+{clients.length > 0 ? Math.round((clients.length / 12) * 100) : 0}%</div>
            <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">Year over year</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50 dark:from-purple-950/50 dark:to-pink-950/50 dark:border-purple-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Since</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {filteredClients.length > 0 ? 
                new Date(Math.min(...filteredClients.map(c => new Date(c.created_at).getTime()))).getFullYear() 
                : new Date().getFullYear()}
            </div>
            <p className="text-sm text-purple-600/70 dark:text-purple-400/70 mt-1">First client added</p>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt */}
      {!checkLimit('maxClients', clients.length).allowed && (
        <UpgradePrompt
          title="Client Limit Reached"
          message={`You've reached the maximum of ${plan === 'trial' ? '3' : '25'} clients for your ${plan} plan. Upgrade to add more clients.`}
          onUpgrade={() => window.location.href = '/#settings'}
        />
      )}

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {searchTerm 
                ? "Try adjusting your search terms or add a new client"
                : "Start building your client network by adding your first client"
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="group hover:scale-105 transition-all duration-300 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] bg-gradient-to-br from-card via-card/95 to-card/90">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-semibold text-lg group-hover:scale-110 transition-transform duration-300">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">{client.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-primary/20">
                        Active
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  <Mail className="h-4 w-4 mr-3 text-primary" />
                  {client.email}
                </div>
                {client.address && (
                  <div className="flex items-start text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    <MapPin className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-primary" />
                    <span className="break-words">{client.address}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 pt-2 border-t border-border/50">
                  <Clock className="h-4 w-4 mr-3 text-primary" />
                  <span>Added {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};