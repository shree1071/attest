import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const isEmbeddable = request.nextUrl.pathname.startsWith("/wall/");

  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");

  if (isEmbeddable) {
    // Public walls are iframe-embeddable on customer sites; app and dashboard pages are not.
    response.headers.set("content-security-policy", "frame-ancestors *");
  } else {
    response.headers.set("x-frame-options", "SAMEORIGIN");
    response.headers.set("content-security-policy", "frame-ancestors 'self'");
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/logos).*)"],
};
