export default function NotesViewerLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-4 w-4/5 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
