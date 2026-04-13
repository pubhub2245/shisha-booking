import { createReservation, getAreas } from '@/actions/reservations'

export default async function ReservePage() {
  const areas = await getAreas()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">出張シーシャ予約</h1>
          <p className="text-gray-600 mt-2">
            フォームに入力して送信してください。折り返しご連絡いたします。
          </p>
        </div>
        <ReserveForm areas={areas} />
      </div>
    </div>
  )
}

function ReserveForm({ areas }: { areas: { id: string; label: string }[] }) {
  return (
    <form action={createReservation} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
      <Field label="お名前" required>
        <input
          type="text"
          name="customer_name"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="電話番号" required>
        <input
          type="tel"
          name="customer_phone"
          required
          placeholder="090-1234-5678"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="予約日" required>
          <input
            type="date"
            name="reservation_date"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </Field>
        <Field label="予約時間" required>
          <select
            name="reservation_time"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">選択</option>
            {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
              <option key={t} value={t}>{t}〜</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="エリア" required>
        <select
          name="area"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">選択</option>
          {areas.map(a => (
            <option key={a.id} value={a.label}>{a.label}</option>
          ))}
        </select>
      </Field>

      <Field label="場所（住所）" required>
        <input
          type="text"
          name="location"
          required
          placeholder="住所または施設名"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="人数">
        <select
          name="quantity"
          defaultValue="1"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <option key={n} value={n}>{n}台</option>
          ))}
        </select>
      </Field>

      <Field label="希望フレーバー（任意）">
        <input
          type="text"
          name="flavor_request"
          placeholder="例：ダブルアップル、ミント"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="備考（任意）">
        <textarea
          name="notes"
          rows={3}
          placeholder="ご要望があればご記入ください"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
      >
        予約を申し込む
      </button>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}
