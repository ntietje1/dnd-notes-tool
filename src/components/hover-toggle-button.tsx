


export interface HoverToggleButtonProps {
  nonHoverComponent?: React.ReactNode;
  hoverComponent?: React.ReactNode;
  className?: string;
}

export function HoverToggleButton({
  nonHoverComponent,
  hoverComponent,
  className
}: HoverToggleButtonProps) {
  return (
    <div className={className}>
        <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
            {nonHoverComponent}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {hoverComponent}
        </div>
    </div>
  );
}