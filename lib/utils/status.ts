import type { ReservationStatus } from '@/lib/types/database'
export const STATUS_LABELS: Record<ReservationStatus, string> = {
  received: 'received', checking: 'checking', confirmed: 'confirmed',
  completed: 'completed', cancelled: 'cancelled', closed: 'closed'
}
export function getStatusLabel(status: ReservationStatus): string {
  const labels: Record<string, string> = {
    received: 'Received', checking: 'Checking', confirmed: 'Confirmed',
    completed: 'Completed', cancelled: 'Cancelled', closed: 'Closed'
  }
  return labels[status] || status
}
export function getStatusClasses(status: ReservationStatus): string {
  const classes: Record<string, string> = {
    received: 'bg-blue-100 text-blue-700', checking: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700', completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700', closed: 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}
