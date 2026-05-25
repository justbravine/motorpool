"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-5 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
          {description && <p className="text-sm text-[color:var(--muted)]">{description}</p>}
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel-strong)] px-4 py-2 text-xs font-semibold text-[color:var(--foreground)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
