import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  MapPin, 
  Edit, 
  Trash2,
  Building
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  projectsCount: number;
  totalHours: number;
  lastProject: string;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "TechCorp Inc.",
    email: "contact@techcorp.com",
    address: "123 Tech Street, San Francisco, CA",
    projectsCount: 3,
    totalHours: 156.5,
    lastProject: "E-commerce Redesign"
  },
  {
    id: "2", 
    name: "StartupXYZ",
    email: "hello@startupxyz.com",
    address: "456 Innovation Ave, Austin, TX",
    projectsCount: 1,
    totalHours: 89.0,
    lastProject: "Mobile App Development"
  },
  {
    id: "3",
    name: "Local Restaurant Group",
    email: "marketing@localrestaurants.com", 
    address: "789 Main St, Chicago, IL",
    projectsCount: 2,
    totalHours: 45.5,
    lastProject: "Brand Identity Package"
  }
];

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    address: ""
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = () => {
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      projectsCount: 0,
      totalHours: 0,
      lastProject: "None"
    };
    setClients([...clients, client]);
    setNewClient({ name: "", email: "", address: "" });
    setIsAddDialogOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(client => client.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client relationships and contact information
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., TechCorp Inc."
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="contact@client.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Address (Optional)</Label>
                <Input
                  id="clientAddress"
                  placeholder="123 Business St, City, State"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddClient}>
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {filteredClients.length} clients
          </div>
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            {clients.reduce((sum, client) => sum + client.projectsCount, 0)} projects
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-medium transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {client.name}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {client.email}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {client.address && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Projects</p>
                  <p className="font-semibold">{client.projectsCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Hours</p>
                  <p className="font-semibold">{client.totalHours}h</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Latest Project</p>
                <Badge variant="outline" className="text-xs">
                  {client.lastProject}
                </Badge>
              </div>
              
              <Button variant="outline" className="w-full" size="sm">
                View Projects
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm ? "No clients found" : "No clients yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "Try adjusting your search terms"
              : "Add your first client to start managing projects and tracking time"
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          )}
        </div>
      )}
    </div>
  );
};