import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';

/**
 * Builder-only floating entry point while the assistant is being tested.
 * It is intentionally not mounted in exchanger or customer layouts yet.
 */
export default function AIHelperLauncher() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/builder/assistant')}
      className="fixed left-4 bottom-20 md:bottom-6 z-[60] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="باز کردن دستیار هوشمند"
      title="دستیار هوشمند"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}
