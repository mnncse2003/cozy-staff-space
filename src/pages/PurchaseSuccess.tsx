import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Copy, Building2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PurchaseSuccessState {
  organizationName: string;
  email: string;
  password: string;
  planName: string;
  hrAdminName: string;
  orgId?: string;
}

const PurchaseSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as PurchaseSuccessState | null;

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleGoToLogin = () => {
    // Open the HR app login page (update this URL to your actual HR app)
    window.open('https://hr-management-system-xi-ivory.vercel.app', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 animate-in zoom-in duration-500">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-muted-foreground text-lg">
            Your {state.planName} plan is now active
          </p>
        </div>

        {/* Organization Details Card */}
        <Card className="mb-6 border-2 border-primary/20 shadow-xl">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="w-5 h-5 text-primary" />
              Organization Created
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-semibold">{state.organizationName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">HR Admin</p>
                  <p className="font-semibold">{state.hrAdminName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Credentials Card */}
        <Card className="mb-6 border-2 border-green-500/30 shadow-xl bg-green-50/50 dark:bg-green-900/10">
          <CardHeader className="bg-green-100/50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
            <CardTitle className="flex items-center gap-2 text-xl text-green-800 dark:text-green-300">
              <Lock className="w-5 h-5" />
              Login Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-mono font-semibold text-foreground">{state.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(state.email, 'Email')}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Password</p>
                    <p className="font-mono font-semibold text-foreground">{state.password}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(state.password, 'Password')}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Important:</strong> Please save these credentials securely. 
                We recommend changing your password after your first login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleGoToLogin}
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Go to HR App Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Back to Home
          </Button>
        </div>

        {/* Support Info */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help? Contact us at{' '}
          <a href="mailto:logicaman20@gmail.com" className="text-primary hover:underline">
            logicaman20@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
