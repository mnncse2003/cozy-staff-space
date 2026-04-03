import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from '@/components/Layout';
import { 
  Loader2, Building2, CreditCard, Search,
  DollarSign, TrendingUp, Users, Edit, CheckCircle, XCircle, Clock
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  isActive: boolean;
  hrAdminName?: string;
  hrAdminEmail?: string;
}

interface Subscription {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  email: string;
  organizationName?: string;
  organizationId?: string;
  paymentId?: string;
  createdAt: any;
  type?: string;
}

const SubscriptionManagement = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userRole !== 'super-admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orgSnap, subSnap] = await Promise.all([
        getDocs(collection(db, 'organizations')),
        getDocs(query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'))),
      ]);

      setOrganizations(orgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Organization)));
      setSubscriptions(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setEditStatus(org.subscriptionStatus || "active");
    setEditPlan(org.subscriptionPlan || "Starter");
    setEditEndDate(org.subscriptionEndDate || "");
  };

  const handleSaveEdit = async () => {
    if (!editingOrg) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'organizations', editingOrg.id), {
        subscriptionStatus: editStatus,
        subscriptionPlan: editPlan,
        subscriptionEndDate: editEndDate || null,
        isActive: editStatus === 'active',
      });
      toast({ title: "Updated", description: `${editingOrg.name} subscription updated.` });
      setEditingOrg(null);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
    setSaving(false);
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || org.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = subscriptions
    .filter(s => s.status === 'success')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const activeOrgs = organizations.filter(o => o.subscriptionStatus === 'active').length;
  const expiredOrgs = organizations.filter(o => {
    if (!o.subscriptionEndDate) return false;
    return new Date(o.subscriptionEndDate) < new Date();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout pageTitle="Subscription Management">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                  <p className="text-2xl font-bold text-foreground">{organizations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground">{activeOrgs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold text-foreground">{expiredOrgs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map(org => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.contactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{org.subscriptionPlan || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                          {org.subscriptionStatus || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.subscriptionStartDate ? new Date(org.subscriptionStartDate).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.subscriptionEndDate ? new Date(org.subscriptionEndDate).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditOrg(org)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.slice(0, 20).map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{sub.organizationName || sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell className="text-foreground font-medium">
                        ₹{(sub.amount || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'success' ? 'default' : sub.status === 'failed' ? 'destructive' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.type || "new"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {sub.paymentId || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription - {editingOrg?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Starter Yearly">Starter Yearly</SelectItem>
                  <SelectItem value="Professional Yearly">Professional Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={editEndDate ? editEndDate.split('T')[0] : ''} onChange={(e) => setEditEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SubscriptionManagement;
