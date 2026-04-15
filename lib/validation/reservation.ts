import { z } from 'zod'

// 日本の携帯/固定電話: 0 始まり 10〜11 桁 (ハイフン除去後)
const phoneRegex = /^0\d{9,10}$/
// HH:MM 24h
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
// YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-‐ー－()（）]/g, '')
}

export const reservationSchema = z.object({
  customer_name: z.string().trim().min(1, 'お名前を入力してください').max(100),
  customer_name_kana: z.string().trim().max(100).optional().nullable(),
  customer_phone: z
    .string()
    .trim()
    .min(1, '電話番号を入力してください')
    .transform(normalizePhone)
    .refine((v) => phoneRegex.test(v), '電話番号は 0 から始まる 10〜11 桁で入力してください'),
  reservation_date: z
    .string()
    .regex(dateRegex, '日付を選択してください'),
  reservation_time: z
    .string()
    .regex(timeRegex, '時間を選択してください'),
  area: z.string().trim().min(1, 'エリアを選択してください'),
  location: z.string().trim().min(1, '住所・場所を入力してください').max(500),
  quantity: z.coerce.number().int().min(1).max(10),
  flavor_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  instagram: z.string().trim().max(100).optional().nullable(),
  payment_method: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export type ReservationInput = z.infer<typeof reservationSchema>

export const cancelSchema = z.object({
  id: z.string().uuid('予約 ID が不正です'),
  phone: z
    .string()
    .trim()
    .min(1, '電話番号を入力してください')
    .transform(normalizePhone)
    .refine((v) => phoneRegex.test(v), '電話番号は 0 から始まる 10〜11 桁で入力してください'),
})
