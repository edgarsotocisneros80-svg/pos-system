"use client";

import { useEffect, useState } from "react";
import { InfoIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoBannerProps {
  title: string;
  items: string[];
  storageKey: string;
}

export function InfoBanner({ title, items, storageKey }: InfoBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (saved === 'hidden') setVisible(false);
  }, [storageKey]);

  const hide = () => {
    setVisible(false);
    if (typeof window !== 'undefined') localStorage.setItem(storageKey, 'hidden');
  };

  if (!visible) return null;

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      <div className="flex items-start gap-3">
        <InfoIcon className="h-5 w-5 mt-0.5 text-blue-600" />
        <div className="flex-1">
          <p className="font-medium mb-1">{title}</p>
          <ul className="list-disc pl-5 space-y-1">
            {items.map((it, idx) => (
              <li key={idx}>{it}</li>
            ))}
          </ul>
        </div>
        <Button variant="ghost" size="icon" onClick={hide} aria-label="Ocultar ayuda">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
