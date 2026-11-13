import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Bot } from 'lucide-react';

/**
 * Floating entry point shared by the exchanger and customer workspaces.
 * The destination is role-scoped; the assistant page still enforces read-only
 * behavior and never submits financial forms.
 */
export default function AIHelperLauncher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  return (
    <button
      type="button"
      onClick={() => navigate(isCustomer ? '/customer/assistant' : '/assistant')}
      className="fixed left-4 bottom-20 md:bottom-6 z-[60] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="باز کردن دستیار هوشمند"
      title="دستیار هوشمند"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}
