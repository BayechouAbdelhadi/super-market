import { LoyaltyTier } from "@/lib/loyalty/types";

export interface DealEmailTemplateProps {
  customerName: string;
  tier: LoyaltyTier;
  subject: string;
  content: string;
  imageUrl?: string | null;
  ctaText?: string;
  ctaUrl?: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
}

export function renderDealEmailHtml(props: DealEmailTemplateProps): string {
  const {
    customerName,
    tier,
    subject,
    content,
    imageUrl,
    ctaText = "Découvrir les offres en magasin",
    ctaUrl = "https://supermarket-calais.fr",
    storeName,
    storeAddress,
    storePhone,
  } = props;

  // Format paragraphs from plain text / linebreaks
  const formattedContent = content
    .split("\n\n")
    .map(
      (para) =>
        `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #333333;">${para.replace(
          /\n/g,
          "<br />"
        )}</p>`
    )
    .join("");

  const tierColors: Record<LoyaltyTier, { bg: string; text: string; border: string }> = {
    BRONZE: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    SILVER: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    GOLD: { bg: "#fef9c3", text: "#854d0e", border: "#facc15" },
    VIP: { bg: "#fae8ff", text: "#86198f", border: "#f0abfc" },
  };

  const currentTierColor = tierColors[tier] || tierColors.BRONZE;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; margin: 0 auto;">
          
          <!-- Store Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">
                ${escapeHtml(storeName)}
              </h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9; letter-spacing: 0.5px;">
                🎟️ Programme Fidélité & Bonnes Affaires
              </p>
            </td>
          </tr>

          ${
            imageUrl
              ? `<!-- Promotional Banner Image -->
          <tr>
            <td style="padding: 0; line-height: 0;">
              <img src="${escapeHtml(
                imageUrl
              )}" alt="Offre Spéciale" width="600" style="width: 100%; max-height: 300px; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0;" />
            </td>
          </tr>`
              : ""
          }

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px;">
              <!-- Client Greeting & Tier Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td>
                    <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                      Bonjour ${escapeHtml(customerName)},
                    </h2>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 20px; background-color: ${currentTierColor.bg}; color: ${currentTierColor.text}; border: 1px solid ${currentTierColor.border};">
                      Palier ${escapeHtml(tier)}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Body Copy -->
              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${formattedContent}
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.25);">
                      ${escapeHtml(ctaText)} →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Reminder Box -->
              <div style="margin-top: 24px; padding: 14px 16px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                <strong style="color: #0f172a;">💡 Rappel fidélité :</strong> Cumulez des points sur tous vos achats en magasin ! N'oubliez pas d'indiquer votre nom ou numéro de téléphone lors de votre passage au comptoir.
              </div>
            </td>
          </tr>

          <!-- Store Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 6px; font-weight: 600; color: #334155;">
                ${escapeHtml(storeName)}
              </p>
              <p style="margin: 0 0 4px;">
                📍 ${escapeHtml(storeAddress)}
              </p>
              ${storePhone ? `<p style="margin: 0 0 8px;">📞 ${escapeHtml(storePhone)}</p>` : ""}
              <p style="margin: 12px 0 0; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                Vous recevez cet email car vous êtes inscrit(e) au programme de fidélité de notre magasin.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
