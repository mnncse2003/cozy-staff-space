import { db, auth, storage } from './firebase';
import { collection, addDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword as createUser } from 'firebase/auth';

// Razorpay Test Key (replace with live key in production)
const RAZORPAY_KEY_ID = "rzp_test_SKNoKic5mSfSTO";

// Firebase config for secondary auth (to prevent auto-login)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBFHgyqk16_cxG1o7EF2OQ8ksxsjA1ENKk",
  authDomain: "pq-hub-906ed.firebaseapp.com",
  projectId: "pq-hub-906ed"
};

export interface RazorpayPlan {
  name: string;
  priceINR: number;
  priceUSD: number;
  period: 'monthly' | 'yearly';
}

export interface SubscriptionData {
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId?: string;
  signature?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: any;
  userId?: string;
  organizationId?: string;
  email?: string;
}

export interface OrganizationData {
  organizationName: string;
  email: string;
  contactPhone?: string;
  hrAdminName: string;
  hrAdminEmployeeCode: string;
  hrAdminPan: string;
  logoFile: File | null;
}

// Plan prices in INR (convert from USD approximately)
export const planPrices: Record<string, RazorpayPlan> = {
  Starter: {
    name: 'Starter',
    priceINR: 4099,
    priceUSD: 49,
    period: 'monthly',
  },
  Professional: {
    name: 'Professional',
    priceINR: 8299,
    priceUSD: 99,
    period: 'monthly',
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Generate organization code from name
const generateOrgCode = (name: string): string => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}`;
};

// Create organization and HR admin after successful payment
export const createOrganizationAfterPayment = async (
  orgData: OrganizationData,
  planName: string,
  paymentId: string
): Promise<{ success: boolean; message: string; orgId?: string }> => {
  try {
    let logoUrl = '';

    // Upload logo if provided
    if (orgData.logoFile) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `organization-logos/${timestamp}_${orgData.logoFile.name}`);
      await uploadBytes(storageRef, orgData.logoFile);
      logoUrl = await getDownloadURL(storageRef);
    }

    // Create organization
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: orgData.organizationName,
      code: generateOrgCode(orgData.organizationName),
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionPlan: planName,
      subscriptionStartDate: new Date().toISOString(),
      contactEmail: orgData.email,
      contactPhone: orgData.contactPhone || null,
      logoUrl: logoUrl || null,
      paymentId: paymentId,
      createdAt: serverTimestamp(),
    });

    // Create HR Admin user using secondary auth to prevent auto-login
    try {
      const authEmail = orgData.email.trim();
      const authPassword = orgData.hrAdminPan.toUpperCase();

      const secondaryApp = initializeApp(FIREBASE_CONFIG, `Secondary_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const { user } = await createUser(secondaryAuth, authEmail, authPassword);
      await deleteApp(secondaryApp);

      // Create user role
      await setDoc(doc(db, 'user_roles', user.uid), {
        role: 'hr',
        organizationId: orgRef.id,
        createdAt: serverTimestamp(),
      });

      // Create employee record
      await setDoc(doc(db, 'employees', user.uid), {
        name: orgData.hrAdminName,
        email: orgData.email,
        employeeCode: orgData.hrAdminEmployeeCode,
        pan: orgData.hrAdminPan.toUpperCase(),
        role: 'hr',
        userId: user.uid,
        organizationId: orgRef.id,
        createdAt: serverTimestamp(),
      });

      // Update organization with HR admin info
      await updateDoc(orgRef, {
        hrAdminEmail: orgData.email,
        hrAdminName: orgData.hrAdminName,
      });

      return {
        success: true,
        message: `Organization created successfully!\n\nLogin Credentials:\nEmail: ${authEmail}\nPassword: ${authPassword}`,
        orgId: orgRef.id,
      };
    } catch (authError: any) {
      console.error('Error creating HR admin:', authError);
      return {
        success: true,
        message: `Organization created but HR admin account failed: ${authError.message}. Please contact support.`,
        orgId: orgRef.id,
      };
    }
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return {
      success: false,
      message: `Failed to create organization: ${error.message}`,
    };
  }
};

interface PaymentOptions {
  planName: string;
  amount: number;
  currency?: string;
  orgData: OrganizationData;
  onSuccess?: (response: any, subscriptionId: string, orgResult: { success: boolean; message: string; orgId?: string }) => void;
  onError?: (error: any) => void;
}

// Initialize payment with Razorpay
export const initiatePayment = async ({
  planName,
  amount,
  currency = 'INR',
  orgData,
  onSuccess,
  onError,
}: PaymentOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded) {
    onError?.({ message: 'Failed to load Razorpay SDK' });
    return;
  }

  if (!RAZORPAY_KEY_ID) {
    onError?.({ message: 'Razorpay Key ID not configured' });
    return;
  }

  // Create pending subscription in Firebase
  const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
    planName,
    amount,
    currency,
    status: 'pending',
    createdAt: serverTimestamp(),
    email: orgData.email,
    organizationName: orgData.organizationName,
  });

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    name: 'HR Management System',
    description: `${planName} Plan Subscription`,
    image: '/favicon.ico',
    prefill: {
      name: orgData.hrAdminName,
      email: orgData.email,
      contact: orgData.contactPhone || '',
    },
    notes: {
      planName,
      subscriptionId: subscriptionRef.id,
      organizationName: orgData.organizationName,
    },
    theme: {
      color: '#7c3aed',
    },
    handler: async (response: any) => {
      try {
        // Update subscription status
        await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || null,
          signature: response.razorpay_signature || null,
          status: 'success',
          completedAt: serverTimestamp(),
        });

        // Create organization after successful payment
        const orgResult = await createOrganizationAfterPayment(
          orgData,
          planName,
          response.razorpay_payment_id
        );

        // Update subscription with organization ID
        if (orgResult.orgId) {
          await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
            organizationId: orgResult.orgId,
          });
        }

        onSuccess?.(response, subscriptionRef.id, orgResult);
      } catch (error) {
        console.error('Error processing payment:', error);
        onError?.(error);
      }
    },
    modal: {
      ondismiss: async () => {
        await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
        });
      },
    },
  };

  const razorpay = new window.Razorpay(options);

  razorpay.on('payment.failed', async (response: any) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
      status: 'failed',
      errorCode: response.error.code,
      errorDescription: response.error.description,
      errorSource: response.error.source,
      errorReason: response.error.reason,
      failedAt: serverTimestamp(),
    });

    onError?.(response.error);
  });

  razorpay.open();
};

// Renewal payment options - for existing organizations
interface RenewalPaymentOptions {
  planName: string;
  amount: number;
  currency?: string;
  organizationId: string;
  organizationName: string;
  email: string;
  userName: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

// Initialize renewal payment with Razorpay
export const initiateRenewalPayment = async ({
  planName,
  amount,
  currency = 'INR',
  organizationId,
  organizationName,
  email,
  userName,
  onSuccess,
  onError,
}: RenewalPaymentOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded) {
    onError?.({ message: 'Failed to load Razorpay SDK' });
    return;
  }

  if (!RAZORPAY_KEY_ID) {
    onError?.({ message: 'Razorpay Key ID not configured' });
    return;
  }

  // Create pending subscription renewal in Firebase
  const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
    planName,
    amount,
    currency,
    status: 'pending',
    type: 'renewal',
    createdAt: serverTimestamp(),
    email,
    organizationId,
    organizationName,
  });

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency,
    name: 'HR Management System',
    description: `${planName} Renewal`,
    image: '/favicon.ico',
    prefill: {
      name: userName,
      email,
    },
    notes: {
      planName,
      subscriptionId: subscriptionRef.id,
      organizationId,
      type: 'renewal',
    },
    theme: {
      color: '#7c3aed',
    },
    handler: async (response: any) => {
      try {
        // Update subscription status
        await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || null,
          signature: response.razorpay_signature || null,
          status: 'success',
          completedAt: serverTimestamp(),
        });

        // Update organization subscription
        const isYearly = planName.includes('Yearly');
        const newStartDate = new Date();
        const newEndDate = new Date();
        if (isYearly) {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        }

        await updateDoc(doc(db, 'organizations', organizationId), {
          subscriptionStatus: 'active',
          subscriptionStartDate: newStartDate.toISOString(),
          lastPaymentId: response.razorpay_payment_id,
          lastPaymentDate: serverTimestamp(),
        });

        onSuccess?.(response);
      } catch (error) {
        console.error('Error processing renewal:', error);
        onError?.(error);
      }
    },
    modal: {
      ondismiss: async () => {
        await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
        });
      },
    },
  };

  const razorpay = new window.Razorpay(options);

  razorpay.on('payment.failed', async (response: any) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionRef.id), {
      status: 'failed',
      errorCode: response.error.code,
      errorDescription: response.error.description,
      errorSource: response.error.source,
      errorReason: response.error.reason,
      failedAt: serverTimestamp(),
    });

    onError?.(response.error);
  });

  razorpay.open();
};
