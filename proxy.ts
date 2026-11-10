
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD;

  if (!password) {
    return new NextResponse("Demo access is not configured.", {
      status: 503,
    });
  }

  const authorization = request.headers.get("authorization");
  const expected = `Basic ${btoa(`demo:${password}`)}`;

  if (authorization !== expected) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Benevolent Souls Demo", charset="UTF-8"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
