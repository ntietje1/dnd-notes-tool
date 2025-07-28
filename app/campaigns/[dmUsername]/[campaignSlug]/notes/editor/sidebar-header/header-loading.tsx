export default function HeaderLoading() {
  return (
    <div className="border-b p-2">
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-6 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
