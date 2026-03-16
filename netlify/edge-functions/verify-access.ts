export default async (request: Request, context: any) => {
  const host = request.headers.get("host") || ""

  // Block direct access to the Netlify subdomain
  if (host.includes("netlify.app")) {
    return new Response("Unauthorized", { status: 403 })
  }

  // Allow all other traffic through (inkbase.dev via Cloudflare)
  return context.next()
}

export const config = { path: "/*" }
