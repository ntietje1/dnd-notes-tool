import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/shadcn/ui/dialog'
import { Button } from '~/components/shadcn/ui/button'
import { AlertTriangle, Loader2, type LucideIcon } from '~/lib/icons'
import { type ReactNode } from 'react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive'
  icon?: LucideIcon
  children?: ReactNode
  isLoading?: boolean
  disabled?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'destructive',
  icon: Icon = AlertTriangle,
  children,
  isLoading = false,
  disabled = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!disabled && !isLoading) {
      onConfirm()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-full ${confirmVariant === 'destructive' ? 'bg-red-100' : 'bg-amber-100'}`}
            >
              <Icon
                className={`w-5 h-5 ${confirmVariant === 'destructive' ? 'text-red-600' : 'text-amber-600'}`}
              />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={disabled || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
