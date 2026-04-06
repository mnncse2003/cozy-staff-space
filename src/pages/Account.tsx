import { useState, useEffect } from "react";
import { AccountSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initiateRenewalPayment } from "@/lib/razorpay";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from '@/components/Layout';
import { 
  Loader2, 
  LogOut, 
  Building2, 
  Mail, 
  Calendar, 
  CreditCard, 
  Crown,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface OrgData {
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  contactEmail: string;
}

interface EmployeeData {
  name: string;
  email: string;
  role: string;
}

const Account = () => {
  const { user, userRole, organizationId, organizationName, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRenewing, setIsRenewing] = useState(false);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch organization data
        const orgSnap = await getDoc(doc(db, 'organizations', organizationId));
        if (orgSnap.exists()) {
          setOrgData(orgSnap.data() as OrgData);
        }

        // Fetch employee data
        const empSnap = await getDoc(doc(db, 'employees', user.uid));
        if (empSnap.exists()) {
          setEmployeeData(empSnap.data() as EmployeeData);
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user, organizationId]);

  if (loading) {
    return <AccountSkeleton />;
  }

  if (!user || !orgData) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      navigate("/login");
    } catch (error) {
      toast({ title: "Error", description: "Failed to log out.", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntilRenewal = () => {
    if (!orgData.subscriptionEndDate) return 0;
    const end = new Date(orgData.subscriptionEndDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isSubscriptionExpired = () => {
    if (!orgData.subscriptionEndDate) return false;
    return new Date(orgData.subscriptionEndDate) < new Date();
  };

  const getRenewalAmount = () => {
    const plan = orgData.subscriptionPlan || "Starter";
    const isYearly = plan.includes("Yearly");
    const isPro = plan.includes("Professional");
    if (isYearly) return isPro ? 82990 : 40990;
    return isPro ? 8299 : 4099;
  };

  const handleRenewSubscription = async () => {
    setIsRenewing(true);
    try {
      await initiateRenewalPayment({
        planName: orgData.subscriptionPlan || "Starter",
        amount: getRenewalAmount(),
        currency: "INR",
        organizationId: organizationId!,
        organizationName: orgData.name,
        email: employeeData?.email || user.email || "",
        userName: employeeData?.name || "HR Admin",
        onSuccess: async () => {
          setIsRenewing(false);
          // Refresh org data
          const orgSnap = await getDoc(doc(db, 'organizations', organizationId!));
          if (orgSnap.exists()) setOrgData(orgSnap.data() as OrgData);
          toast({ title: "Subscription Renewed!", description: "Your subscription has been successfully renewed." });
        },
        onError: (error) => {
          setIsRenewing(false);
          toast({ title: "Payment Failed", description: error.message || "Failed to process payment.", variant: "destructive" });
        },
      });
    } catch (error) {
      setIsRenewing(false);
      toast({ title: "Error", description: "Failed to initiate payment.", variant: "destructive" });
    }
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const isExpired = isSubscriptionExpired();

  return (
    <Layout pageTitle="My Account">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{employeeData?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{employeeData?.email || user.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground text-lg">{orgData.name}</p>
                <p className="text-sm text-muted-foreground">ID: {organizationId?.slice(0, 8)}...</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {userRole} Access
              </Badge>
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card className={isExpired ? "border-destructive" : daysUntilRenewal <= 7 ? "border-yellow-500" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription
              </CardTitle>
              <CardDescription>
                {isExpired ? (
                  <span className="text-destructive font-medium">Subscription Expired</span>
                ) : (
                  `${daysUntilRenewal} days until renewal`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge className="bg-primary text-primary-foreground">
                  {orgData.subscriptionPlan || "N/A"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-1">
                  {isExpired ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={isExpired ? "text-destructive" : "text-green-500"}>
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="text-foreground">{formatDate(orgData.subscriptionStartDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Renewal Card */}
          {userRole === 'hr' && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Payment & Renewal
                </CardTitle>
                <CardDescription>Manage your subscription renewal and payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground font-medium">
                        Next Payment Due: {formatDate(orgData.subscriptionEndDate || "")}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{getRenewalAmount().toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orgData.subscriptionPlan?.includes("Yearly") ? "Yearly" : "Monthly"} renewal
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleRenewSubscription}
                    disabled={isRenewing}
                  >
                    {isRenewing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                    ) : isExpired ? "Renew Now" : "Pay Early"}
                  </Button>
                </div>

                <div className="mt-6 p-4 border border-border rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Want to change your plan?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contact our sales team to upgrade, downgrade, or switch between monthly and yearly billing.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = "mailto:logicaman20@gmail.com?subject=Plan Change Request"}>
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Account;
