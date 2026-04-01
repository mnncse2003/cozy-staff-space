import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initiateRenewalPayment } from "@/lib/razorpay";
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

const Account = () => {
  const { user, userData, logout, refreshUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRenewing, setIsRenewing] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userData) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
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
    if (!userData.subscriptionEndDate) return 0;
    const end = new Date(userData.subscriptionEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isSubscriptionExpired = () => {
    if (!userData.subscriptionEndDate) return false;
    return new Date(userData.subscriptionEndDate) < new Date();
  };

  const getRenewalAmount = () => {
    const isYearly = userData.subscriptionPlan?.includes("Yearly");
    const planBase = userData.subscriptionPlan?.includes("Professional") 
      ? "Professional" 
      : "Starter";
    
    if (isYearly) {
      return planBase === "Professional" ? 82990 : 40990;
    }
    return planBase === "Professional" ? 8299 : 4099;
  };

  const handleRenewSubscription = async () => {
    setIsRenewing(true);

    try {
      await initiateRenewalPayment({
        planName: userData.subscriptionPlan || "Starter",
        amount: getRenewalAmount(),
        currency: "INR",
        organizationId: userData.organizationId,
        organizationName: userData.organizationName,
        email: userData.email,
        userName: userData.name,
        onSuccess: async () => {
          await refreshUserData();
          setIsRenewing(false);
          
          toast({
            title: "Subscription Renewed!",
            description: "Your subscription has been successfully renewed.",
          });
        },
        onError: (error) => {
          setIsRenewing(false);
          toast({
            title: "Payment Failed",
            description: error.message || "Failed to process payment. Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      setIsRenewing(false);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const isExpired = isSubscriptionExpired();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">My Account</h1>
              <p className="text-sm text-muted-foreground">{userData.organizationName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                  <p className="font-medium text-foreground">{userData.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{userData.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{userData.email}</span>
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
                <p className="font-medium text-foreground text-lg">{userData.organizationName}</p>
                <p className="text-sm text-muted-foreground">Organization ID: {userData.organizationId.slice(0, 8)}...</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {userData.role} Access
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
                <Badge className="bg-gradient-hero text-primary-foreground">
                  {userData.subscriptionPlan || "N/A"}
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
                <span className="text-foreground">{formatDate(userData.subscriptionStartDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Next Payment Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Payment & Renewal
              </CardTitle>
              <CardDescription>
                Manage your subscription renewal and payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      Next Payment Due: {formatDate(userData.subscriptionEndDate)}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{getRenewalAmount().toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userData.subscriptionPlan?.includes("Yearly") ? "Yearly" : "Monthly"} renewal
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="bg-gradient-hero hover:opacity-90"
                  onClick={handleRenewSubscription}
                  disabled={isRenewing}
                >
                  {isRenewing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isExpired ? (
                    "Renew Now"
                  ) : (
                    "Pay Early"
                  )}
                </Button>
              </div>

              {/* Plan Change Section */}
              <div className="mt-6 p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Want to change your plan?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact our sales team to upgrade, downgrade, or switch between monthly and yearly billing.
                </p>
                <Button variant="outline" onClick={() => window.location.href = "mailto:sales@hrms.com?subject=Plan Change Request"}>
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
