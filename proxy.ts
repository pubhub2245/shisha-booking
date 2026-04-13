import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, key,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 未ログインで保護ページにアクセスしたらログイン画面へ
  if (!user && path.startsWith("/admin") && path !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  if (!user && path.startsWith("/staff")) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // ログイン済みの場合、roleに基づいてリダイレクト
  // JWT の app_metadata.role から取得（profiles テーブルへのクエリ不要 → RLS 再帰問題を回避）
  if (user) {
    const role = (user.app_metadata as Record<string, unknown>)?.role as string | undefined

    console.log("[proxy] user.id:", user.id, "email:", user.email)
    console.log("[proxy] app_metadata:", JSON.stringify(user.app_metadata))
    console.log("[proxy] resolved role:", role ?? "NO_ROLE", "| path:", path)

    // ログイン画面にアクセス → roleに応じたページへ
    if (path === "/admin/login") {
      const destination = role === "admin" ? "/admin" : "/staff"
      return NextResponse.redirect(new URL(destination, request.url))
    }

    // admin以外が/adminにアクセス → /staffへ
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/staff", request.url))
    }

    // adminが/staffにアクセス → /adminへ
    if (path.startsWith("/staff") && role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
}
