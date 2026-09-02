import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Marca la acción como destructiva (borrado). */
  danger?: boolean;
}

/**
 * Confirmación para acciones irreversibles.
 *
 * Los borrados de inventario, proveedores y cotizaciones se ejecutaban con un
 * solo clic, sin posibilidad de deshacer.
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmDialogProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    width="420px"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }
  >
    <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
  </Modal>
);

export default ConfirmDialog;
