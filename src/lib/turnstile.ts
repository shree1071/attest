export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In local development or when Turnstile keys are not configured, bypass gracefully
  if (!secretKey || process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const outcome = await res.json();
    return Boolean(outcome.success);
  } catch (err) {
    console.error("[Turnstile] Verification failed:", err);
    return false;
  }
}
