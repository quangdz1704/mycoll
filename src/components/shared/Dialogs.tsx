import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Spinner } from "./Ui";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description className="modal-description">
            {description}
          </Dialog.Description>
          <Dialog.Close
            className="icon-button modal-close"
            aria-label="Đóng"
            disabled={busy}
          >
            <X size={20} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="modal-overlay" />
        <AlertDialog.Content className="modal-content confirm-content">
          <AlertDialog.Title className="modal-title">{title}</AlertDialog.Title>
          <AlertDialog.Description className="modal-description">
            {description}
          </AlertDialog.Description>
          <div className="form-actions">
            <AlertDialog.Cancel className="button secondary" disabled={busy}>
              Hủy
            </AlertDialog.Cancel>
            <button
              className="button danger"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy && <Spinner />}Xóa
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
