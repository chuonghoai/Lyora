import React, { useEffect, useRef } from 'react';

export interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  closedBy?: 'any' | 'closerequest' | 'none';
  maxWidthClassName?: string;
  disableDismiss?: boolean;
  children: React.ReactNode;
}

let cachedSupportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedSupportsDisplayTransition !== undefined) {
    return cachedSupportsDisplayTransition;
  }
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText =
    'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = 'none';
  cachedSupportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return cachedSupportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay(),
  );
}

async function closeTopLayer(element: HTMLDialogElement): Promise<void> {
  if (!element.open) return;

  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations =
      typeof element.getAnimations === 'function'
        ? element.getAnimations({ subtree: true })
        : [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((anim) => anim.finished)),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 350);
        }),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }

  if (element.open) {
    element.close();
  }
}

export const AdminDialog: React.FC<AdminDialogProps> = ({
  open,
  onClose,
  labelledBy,
  closedBy = 'any',
  maxWidthClassName = 'max-w-2xl',
  disableDismiss = false,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const disableDismissRef = useRef(disableDismiss);

  useEffect(() => {
    onCloseRef.current = onClose;
    disableDismissRef.current = disableDismiss;
  }, [onClose, disableDismiss]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.removeAttribute('data-closing');
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      void closeTopLayer(dialog);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (disableDismissRef.current) return;
      onCloseRef.current();
    };

    const handleClose = () => {
      dialog.returnValue = '';
      if (disableDismissRef.current) return;
      onCloseRef.current();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);

    const needsLightDismissFallback =
      closedBy === 'any' &&
      typeof HTMLDialogElement !== 'undefined' &&
      !('closedBy' in HTMLDialogElement.prototype);

    const handleLightDismissClick = (event: MouseEvent) => {
      if (disableDismissRef.current || event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isDialogContent) {
        onCloseRef.current();
      }
    };

    if (needsLightDismissFallback) {
      dialog.addEventListener('click', handleLightDismissClick);
    }

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      if (needsLightDismissFallback) {
        dialog.removeEventListener('click', handleLightDismissClick);
      }
    };
  }, [closedBy]);

  const effectiveClosedBy = disableDismiss ? 'none' : closedBy;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className={`lyora-dialog w-[calc(100vw-2rem)] ${maxWidthClassName} rounded-2xl shadow-lg`}
      {...({ closedby: effectiveClosedBy } as Record<string, string>)}
    >
      {children}
    </dialog>
  );
};
