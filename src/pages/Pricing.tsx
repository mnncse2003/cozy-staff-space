import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { initiatePayment, planPrices, OrganizationData } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for small teams",
    price: "₹4,099",
    priceUSD: "$49",
    period: "/month",
    features: [
      "Up to 50 employees",
      "Basic attendance tracking",
      "Leave management",
      "Monthly reports",
      "Email support",
    ],
    buttonText: "Get Started",
    buttonVariant: "default" as const,
    popular: false,
    hasPayment: true,
  },
  {
    name: "Professional",
    description: "For growing companies",
    price: "₹8,299",
    priceUSD: "$99",
    period: "/month",
    features: [
      "Up to 200 employees",
      "Advanced attendance tracking",
      "Complete leave management",
      "Salary slip generation",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: true,
    hasPayment: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    priceUSD: "",
    period: "",
    features: [
      "Unlimited employees",
      "All Professional features",
      "Dedicated account manager",
      "Custom integrations",
      "24/7 phone support",
      "SLA guarantee",
      "On-premise option",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "default" as const,
    popular: false,
    hasPayment: false,
  },
];

const Pricing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState({
    organizationName: "",
    email: "",
    contactPhone: "",
    hrAdminName: "",
    hrAdminEmployeeCode: "",
    hrAdminPan: "",
  });

  const handleGetStarted = (planName: string, hasPayment: boolean) => {
    if (!hasPayment) {
      toast({ title: "Contact Sales", description: "Please reach out to our sales team for Enterprise pricing." });
      return;
    }
    setSelectedPlan(planName);
    setShowOrgForm(true);
  };

  const handleSubmitOrgForm = async () => {
    if (!selectedPlan) return;
    if (!orgForm.organizationName || !orgForm.email || !orgForm.hrAdminName || !orgForm.hrAdminEmployeeCode || !orgForm.hrAdminPan) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const plan = planPrices[selectedPlan];
    if (!plan) return;

    setShowOrgForm(false);
    setLoadingPlan(selectedPlan);

    const orgData: OrganizationData = {
      ...orgForm,
      logoFile: null,
    };

    try {
      await initiatePayment({
        planName: plan.name,
        amount: plan.priceINR,
        currency: 'INR',
        orgData,
        onSuccess: (response, subscriptionId, orgResult) => {
          setLoadingPlan(null);
          if (orgResult?.success) {
            navigate('/purchase-success', {
              state: {
                organizationName: orgForm.organizationName,
                email: orgForm.email,
                password: orgForm.hrAdminPan.toUpperCase(),
                planName: selectedPlan,
                hrAdminName: orgForm.hrAdminName,
                orgId: orgResult.orgId,
              }
            });
          } else {
            toast({ title: "Payment Successful!", description: orgResult?.message || "Organization setup had issues. Contact support." });
          }
        },
        onError: (error) => {
          setLoadingPlan(null);
          toast({ title: "Payment Failed", description: error?.description || error?.message || "Something went wrong.", variant: "destructive" });
        },
      });
    } catch (error: any) {
      setLoadingPlan(null);
      toast({ title: "Error", description: error?.message || "Failed to initialize payment", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HR Management System</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-foreground font-medium">Pricing</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#team" className="text-muted-foreground hover:text-foreground transition-colors">Team</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Button onClick={() => handleGetStarted("Starter", true)}>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your organization. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing" className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col transition-all duration-300 hover:shadow-xl",
                  plan.popular
                    ? "bg-primary text-primary-foreground scale-105 shadow-2xl border-primary"
                    : "bg-card hover:scale-102"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-chart-4 text-chart-4-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-8 pt-6">
                  <CardTitle className={cn(
                    "text-2xl font-bold",
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className={cn(
                    plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-8">
                    <span className={cn(
                      "text-5xl font-bold",
                      plan.popular ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {plan.price}
                    </span>
                    <span className={cn(
                      "text-lg",
                      plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                          plan.popular 
                            ? "bg-primary-foreground/20" 
                            : "bg-primary/10"
                        )}>
                          <Check className={cn(
                            "h-3 w-3",
                            plan.popular ? "text-primary-foreground" : "text-primary"
                          )} />
                        </div>
                        <span className={cn(
                          "text-sm",
                          plan.popular ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button
                    className={cn(
                      "w-full py-6 text-base font-semibold",
                      plan.popular
                        ? "bg-white text-primary hover:bg-white/90"
                        : plan.buttonVariant === "default"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                    )}
                    variant={plan.popular ? "secondary" : plan.buttonVariant}
                    onClick={() => handleGetStarted(plan.name, plan.hasPayment)}
                    disabled={loadingPlan === plan.name}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Everything You Need to Manage Your Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Attendance Tracking",
                description: "Track employee attendance with GPS-based punch-in/out and real-time monitoring.",
              },
              {
                title: "Leave Management",
                description: "Streamlined leave requests with multi-level approvals and balance tracking.",
              },
              {
                title: "Payroll & Salary",
                description: "Automated salary calculations with tax deductions and slip generation.",
              },
              {
                title: "Device Security",
                description: "Control login devices with session management and real-time monitoring.",
              },
              {
                title: "Exit Management",
                description: "Complete offboarding with clearance, knowledge transfer, and settlements.",
              },
              {
                title: "Analytics Dashboard",
                description: "Insights on workforce trends, attendance patterns, and HR metrics.",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Can I change my plan later?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "Is there a free trial?",
                answer: "We offer a 14-day free trial for all plans. No credit card required to start.",
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, debit cards, and bank transfers for Enterprise plans.",
              },
              {
                question: "Can I get a refund?",
                answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your HR Management?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of companies already using our platform to streamline their HR operations.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="px-8 py-6 text-lg"
            onClick={() => handleGetStarted("Professional", true)}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">HR Management System</span>
            </div>
            <p className="text-muted text-sm">
              © {new Date().getFullYear()} HR Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Organization Registration Dialog */}
      <Dialog open={showOrgForm} onOpenChange={setShowOrgForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Your Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input value={orgForm.organizationName} onChange={e => setOrgForm(p => ({ ...p, organizationName: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>HR Admin Name *</Label>
              <Input value={orgForm.hrAdminName} onChange={e => setOrgForm(p => ({ ...p, hrAdminName: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={orgForm.email} onChange={e => setOrgForm(p => ({ ...p, email: e.target.value }))} placeholder="hr@acme.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={orgForm.contactPhone} onChange={e => setOrgForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label>Employee Code *</Label>
              <Input value={orgForm.hrAdminEmployeeCode} onChange={e => setOrgForm(p => ({ ...p, hrAdminEmployeeCode: e.target.value }))} placeholder="EMP001" />
            </div>
            <div className="space-y-2">
              <Label>PAN Number * (used as initial password)</Label>
              <Input value={orgForm.hrAdminPan} onChange={e => setOrgForm(p => ({ ...p, hrAdminPan: e.target.value }))} placeholder="ABCDE1234F" />
            </div>
            <Button className="w-full" onClick={handleSubmitOrgForm} disabled={!!loadingPlan}>
              {loadingPlan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Proceed to Pay - ${selectedPlan}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
