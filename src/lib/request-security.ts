import { isProductionEnvironment, publicAppOrigin } from "./runtime-env";

export class RequestSecurityError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: Request): void {
  if (!isProductionEnvironment()) return;

  const origin = request.headers.get("origin");
  if (origin !== publicAppOrigin()) {
    throw new RequestSecurityError("Nieprawidłowe źródło żądania", 403);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new RequestSecurityError("Żądanie cross-site zostało odrzucone", 403);
  }
}

export async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    throw new RequestSecurityError("Żądanie jest zbyt duże", 413);
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let result = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestSecurityError("Żądanie jest zbyt duże", 413);
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return result;
  } catch (error) {
    if (error instanceof RequestSecurityError) throw error;
    throw new RequestSecurityError("Nieprawidłowe kodowanie żądania", 400);
  }
}

export async function readJsonWithLimit<T>(
  request: Request,
  maxBytes: number,
  options: { checkOrigin?: boolean } = {}
): Promise<T> {
  if (options.checkOrigin !== false) assertSameOrigin(request);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestSecurityError("Wymagany Content-Type application/json", 415);
  }
  const raw = await readBodyWithLimit(request, maxBytes);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestSecurityError("Nieprawidłowy JSON", 400);
  }
}
