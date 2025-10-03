import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '~/components/shadcn/ui/button'

export default function ErrorPage({
  error = 'An unexpected error occurred. Please refresh the page.',
}: {
  error?: string
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">
          Something went wrong!
        </h2>
        <p className="text-gray-600 max-w-md">{error}</p>
        <div className="space-x-4">
          <Button onClick={() => window.location.reload()}>Refresh</Button>
          <Link to="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
