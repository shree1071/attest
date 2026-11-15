export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "notifications@attest.dev";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    }
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("[Email Error]", err);
    return false;
  }
}

export async function notifyOwnerNewSubmission({
  ownerEmail,
  productName,
  authorName,
  dashboardUrl,
}: {
  ownerEmail: string;
  productName: string;
  authorName: string;
  dashboardUrl: string;
}) {
  return sendEmail({
    to: ownerEmail,
    subject: `New testimonial submitted for ${productName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; padding: 20px;">
        <h2 style="font-size: 18px; color: #18181b;">New Testimonial Received!</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.5;">
          <strong>${authorName}</strong> just submitted a testimonial for <strong>${productName}</strong>.
        </p>
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl}" style="background: #18181b; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">
            Review & Approve in Inbox
          </a>
        </p>
      </div>
    `,
  });
}

export async function notifyReviewerApproved({
  reviewerEmail,
  productName,
  wallUrl,
}: {
  reviewerEmail: string;
  productName: string;
  wallUrl: string;
}) {
  return sendEmail({
    to: reviewerEmail,
    subject: `Your testimonial for ${productName} has been published!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; padding: 20px;">
        <h2 style="font-size: 18px; color: #18181b;">Testimonial Published!</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.5;">
          The founder of <strong>${productName}</strong> has approved and published your testimonial to their public Wall of Love.
        </p>
        <p style="margin-top: 20px;">
          <a href="${wallUrl}" style="background: #18181b; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">
            View Published Wall
          </a>
        </p>
      </div>
    `,
  });
}
