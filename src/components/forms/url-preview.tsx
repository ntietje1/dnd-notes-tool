interface UrlPreviewProps {
  baseUrl: string;
  path: string;
  label?: string;
}

export function UrlPreview({ baseUrl, path, label = "Your campaign will be available at:" }: UrlPreviewProps) {
  const fullUrl = `${baseUrl}${path}`;

  return (
    <div className="text-xs text-gray-500 space-y-1">
      <span className="font-medium block">
        {label}
      </span>
      <div className="font-mono bg-slate-50 p-2 rounded border break-all text-slate-700 max-w-full overflow-hidden text-xs">
        {fullUrl}
      </div>
    </div>
  );
} 