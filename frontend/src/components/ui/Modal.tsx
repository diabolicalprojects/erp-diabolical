import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalVariant = 'center' | 'side';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: ModalVariant;
  /** Ancho máximo en la variante `center`. */
  width?: string;
}

/**
 * Modal único de la app.
 *
 * Sustituye seis implementaciones a mano (Customers, Inventory, Pipeline,
 * Purchases, QuoteWizard, QuotePreview) que repetían el overlay, el z-index y
 * el botón de cierre — cada una con sus propios valores.
 *
 * Añade lo que ninguna tenía: cierre con Escape, bloqueo del scroll de fondo,
 * render en portal (para que no lo recorte un `overflow` del padre) y roles ARIA.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'center',
  width = '520px'
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal-panel modal-panel--${variant}`}
        style={variant === 'center' ? { maxWidth: width } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {title && (
          <header className="modal-header">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </header>
        )}

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
