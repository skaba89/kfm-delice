"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-text group-[.toaster]:border-kfm-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-2",
          actionButton:
            "group-[.toast]:bg-kfm-secondary group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-surface-2 group-[.toast]:text-text-2",
          success: "group-[.toaster]:border-kfm-success/30",
          error: "group-[.toaster]:border-kfm-danger/30",
          warning: "group-[.toaster]:border-kfm-warning/30",
          info: "group-[.toaster]:border-kfm-info/30",
        },
      }}
      position="bottom-right"
      richColors
      closeButton
      {...props}
    />
  );
};

export { Toaster };
