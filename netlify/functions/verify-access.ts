export default async (request: Request, context: any) => {
  // Cloudflare Access automatically sends this JWT header on all authenticated requests
  const cfJwt = request.headers.get("CF-Access-Jwt-Assertion")

  if (!cfJwt) {
    return new Response("Unauthorized", { status: 403 })
  }

  return context.next()
}

export const config = { path: "/*" }
