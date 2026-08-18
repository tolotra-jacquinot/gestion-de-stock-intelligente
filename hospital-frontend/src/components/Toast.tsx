import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({
  message,
  type,
  onClose,
}: ToastProps) {
  const styles = {
    success: {
      container:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
      icon: <CheckCircle2 className="h-5 w-5 shrink-0" />,
    },

    error: {
      container:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
      icon: <AlertTriangle className="h-5 w-5 shrink-0" />,
    },

    info: {
      container:
        "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
      icon: <Info className="h-5 w-5 shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`
        fixed right-4 top-20 z-[100]
        w-[calc(100%-2rem)] max-w-sm
        rounded-xl border
        px-4 py-3
        shadow-xl
        backdrop-blur-sm
        ${current.container}
      `}
    >
      <div className="flex items-start gap-3">

        {current.icon}

        <p className="flex-1 text-sm font-semibold leading-relaxed">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Fermer la notification"
        >
          <X className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}