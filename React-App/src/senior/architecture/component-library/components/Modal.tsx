// REUSABLE COMPONENT LIBRARY — Modal.tsx
//
// Patterns demonstrated:
//   ✅ Compound components — Modal.Header / Modal.Body / Modal.Footer
//                           Consumer composes the modal layout freely.
//   ✅ Context             — ModalContext shares onClose to sub-components
//                           so Modal.Footer can close without prop drilling.
//   ✅ ReactDOM.createPortal — renders outside the React tree into document.body
//                              so z-index and overflow:hidden parents don't trap it.
//   ✅ Focus trap           — Tab / Shift+Tab stay inside the modal
//   ✅ Escape key           — closes the modal
//   ✅ Backdrop click       — closes the modal
//   ✅ Accessibility        — role="dialog", aria-modal, aria-labelledby

import React, { useContext, useEffect, useRef, useId } from "react";
import ReactDOM from "react-dom";

// ── Context ───────────────────────────────────────────────────────────────────

const ModalContext = React.createContext<{ onClose: () => void; titleId: string }>({
  onClose: () => {},
  titleId: "",
});

// ── Focus trap helper ─────────────────────────────────────────────────────────

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const el = ref.current;
    if (!el) return;

    // Focus first focusable element after mount
    const first = el.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [isOpen, ref]);
}

// ── Root Modal ────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  size?:    "sm" | "md" | "lg";
  children: React.ReactNode;
}

const ModalRoot = ({ isOpen, onClose, size = "md", children }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId   = useId();

  useFocusTrap(dialogRef, isOpen);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const widths = { sm: 400, md: 560, lg: 720 };

  return ReactDOM.createPortal(
    <ModalContext.Provider value={{ onClose, titleId }}>
      {/* Backdrop */}
      <div
        style={s.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div style={s.centerer}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{ ...s.dialog, maxWidth: widths[size] }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ModalHeader = ({ children }: { children: React.ReactNode }) => {
  const { onClose, titleId } = useContext(ModalContext);
  return (
    <div style={s.header}>
      <h2 id={titleId} style={s.title}>{children}</h2>
      <button onClick={onClose} style={s.closeBtn} aria-label="Close dialog">✕</button>
    </div>
  );
};

const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div style={s.body}>{children}</div>
);

const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={s.footer}>{children}</div>
);

// ── Compound export ───────────────────────────────────────────────────────────
//
// Usage:
//   <Modal isOpen={open} onClose={() => setOpen(false)}>
//     <Modal.Header>Title</Modal.Header>
//     <Modal.Body>Content</Modal.Body>
//     <Modal.Footer><Button onClick={...}>Confirm</Button></Modal.Footer>
//   </Modal>

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body:   ModalBody,
  Footer: ModalFooter,
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000 },
  centerer: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1001 },
  dialog:   { background: "#fff", borderRadius: 14, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh" },
  header:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0", flexShrink: 0 },
  title:    { fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af", padding: "2px 6px", borderRadius: 6, lineHeight: 1 },
  body:     { padding: "16px 24px", overflowY: "auto", flex: 1, color: "#374151", fontSize: 14, lineHeight: 1.6 },
  footer:   { padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 },
};
