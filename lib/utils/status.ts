import type { ReservationStatus } from '@/lib/types/database'

export const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'received', label: '受付' },
  { value: 'checking', label: '確認中' },
  { value: 'confirmed', label: '確定' },
  { value: 'completed', label: '対応済み' },
  { value: 'cancelled', label: 'キャンセル' },
  { value: 'closed', label: '完了' },
]

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: '受付',
    checking: '確認中',
    confirmed: '確定',
    completed: '対応済み',
    cancelled: 'キャンセル',
    closed: '完了',
    pending: '保留中',
  }
  return labels[status] || status
}

export function getStatusClasses(status: string): string {
  const classes: Record<string, string> = {
    received: 'bg-blue-100 text-blue-700',
    checking: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}
