export default function SidebarLoading() {
  return (
    <div className="flex-1 p-2">
      <div className="space-y-2 animate-pulse">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-4 w-4/5 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
