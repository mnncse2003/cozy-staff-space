import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import {
  isPushSupported,
  getPushPermissionStatus,
  requestPushPermission,
  savePushPreference,
  getPushPreference,
} from '@/lib/pushNotificationService';
import { toast } from 'sonner';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const checkPrompt = async () => {
      if (!isPushSupported()) return;
      
      const status = getPushPermissionStatus();
      // Don't prompt if already granted or denied at browser level
      if (status === 'granted' || status === 'denied') return;

      // Check if user has already made a choice in our app
      const pref = await getPushPreference(user.uid);
      if (pref) return; // Already opted in

      // Check if we already prompted this session
      const prompted = sessionStorage.getItem('push_prompt_shown');
      if (prompted) return;

      // Show prompt after a short delay
      setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('push_prompt_shown', 'true');
      }, 2000);
    };

    checkPrompt();
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    
    const permission = await requestPushPermission();
    
    if (permission === 'granted') {
      await savePushPreference(user.uid, true);
      toast.success('Push notifications enabled!');
    } else {
      toast.info('Notifications blocked. You can enable them in browser settings.');
    }
    
    setOpen(false);
  };

  const handleDismiss = async () => {
    if (user) {
      await savePushPreference(user.uid, false);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center">Enable Notifications</DialogTitle>
          <DialogDescription className="text-center">
            Stay updated with attendance reminders, leave approvals, birthday wishes, and important announcements.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleEnable} className="w-full">
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            <BellOff className="mr-2 h-4 w-4" />
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PushNotificationPrompt;
