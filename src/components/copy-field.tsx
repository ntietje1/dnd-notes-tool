import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { cn } from '~/lib/utils'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { Link } from '~/lib/icons'

type CopyFieldProps = {
  text: string
  onCopy?: (text: string) => void | Promise<void>
  placeholder?: string
  className?: string
  inputProps?: Omit<
    React.ComponentProps<typeof Input>,
    'value' | 'onChange' | 'readOnly' | 'placeholder'
  >
  buttonProps?: Omit<
    React.ComponentProps<typeof Button>,
    'onClick' | 'children'
  >
  buttonLabel?: string
  disabled?: boolean
}

export function CopyField({
  text,
  onCopy,
  placeholder,
  className,
  inputProps,
  buttonProps,
  buttonLabel = 'Copy',
  disabled,
}: CopyFieldProps) {
  const handleCopy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      await onCopy?.(text)
    } catch (_) {
      toast.error('Copy failed')
    }
  }, [text, onCopy])

  const handleFocusSelectAll: React.FocusEventHandler<HTMLInputElement> = (
    e,
  ) => {
    e.currentTarget.select()
    inputProps?.onFocus?.(e)
  }
  const handleClickSelectAll: React.MouseEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const target = e.currentTarget as HTMLInputElement
    if (document.activeElement !== target) {
      target.focus()
    }
    target.select()
    inputProps?.onClick?.(e)
  }

  return (
    <div
      className={cn(
        'flex w-full md:max-w-xl items-stretch rounded-md border border-input overflow-hidden',
        className,
      )}
    >
      <Input
        readOnly
        value={text}
        placeholder={placeholder}
        className={cn('rounded-r-none', inputProps?.className)}
        onFocus={handleFocusSelectAll}
        onClick={handleClickSelectAll}
        {...inputProps}
      />
      <Button
        variant="outline"
        onClick={handleCopy}
        disabled={disabled || !text}
        className={cn('rounded-l-none h-9', buttonProps?.className)}
        {...buttonProps}
      >
        <Link className="w-4 h-4" /> {buttonLabel}
      </Button>
    </div>
  )
}
