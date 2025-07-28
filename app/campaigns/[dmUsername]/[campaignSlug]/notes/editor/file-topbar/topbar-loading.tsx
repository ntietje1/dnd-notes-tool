export default function TopbarLoading() {
  return (
    <div className="border-b p-2">
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
