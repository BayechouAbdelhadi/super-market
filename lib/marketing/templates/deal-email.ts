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

  // Resolve image URL (ensure absolute for email clients)
  let resolvedImageUrl = imageUrl?.trim() || null;
  if (resolvedImageUrl && resolvedImageUrl.startsWith("/")) {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://supermarket-calais.fr";
    resolvedImageUrl = `${baseUrl}${resolvedImageUrl}`;
  }

  // Tier styling with premium palette & icons
  const tierConfig: Record<
    LoyaltyTier,
    { label: string; icon: string; bg: string; text: string; border: string; highlightBg: string }
  > = {
    BRONZE: {
      label: "Membre Bronze",
      icon: "🥉",
      bg: "#ffedd5",
      text: "#9a3412",
      border: "#fed7aa",
      highlightBg: "#fff7ed",
    },
    SILVER: {
      label: "Membre Silver",
      icon: "✨",
      bg: "#f1f5f9",
      text: "#334155",
      border: "#cbd5e1",
      highlightBg: "#f8fafc",
    },
    GOLD: {
      label: "Membre Gold",
      icon: "⭐",
      bg: "#fef3c7",
      text: "#854d0e",
      border: "#fde68a",
      highlightBg: "#fffbeb",
    },
    VIP: {
      label: "Membre VIP Privilège",
      icon: "👑",
      bg: "#f3e8ff",
      text: "#6b21a8",
      border: "#d8b4fe",
      highlightBg: "#faf5ff",
    },
  };

  const currentTier = tierConfig[tier] || tierConfig.BRONZE;

  // Convert raw text into styled paragraphs and formatted list items
  const formattedContent = formatEditorialContent(content);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      -webkit-text-size-adjust: 100%;
    }
    * {
      box-sizing: border-box !important;
    }
    table {
      box-sizing: border-box !important;
      max-width: 100% !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
    }
    @media only screen and (max-width: 620px) {
      .outer-wrapper { padding: 12px 6px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; border-radius: 12px !important; }
      .mobile-padding { padding-left: 14px !important; padding-right: 14px !important; }
      .mobile-header-padding { padding: 16px 14px 14px !important; }
      .mobile-hero-img { width: 100% !important; height: auto !important; }
      .mobile-hide { display: none !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-perk-cell { display: block !important; width: 100% !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; padding: 10px 4px !important; }
      .mobile-perk-cell:last-child { border-bottom: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; max-width: 100%; overflow-x: hidden; background-color: #f1f5f9; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b;">
  <!-- Preheader text (preview snippet in inbox) -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(subject)} — Offre exclusive réservée aux membres fidélité ${escapeHtml(currentTier.label)}.
  </div>

  <table role="presentation" width="100%" class="outer-wrapper" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; width: 100%; max-width: 100%;">
    <tr>
      <td align="center" style="padding: 20px 8px;">
        <!-- Main Card Wrapper -->
        <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03); border: 1px solid #e2e8f0; margin: 0 auto;">
          
          <!-- Top Brand Header Bar -->
          <tr>
            <td class="mobile-header-padding" style="padding: 24px 32px 20px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.3px; color: #0f172a; text-transform: uppercase;">
                      🛒 ${escapeHtml(storeName)}
                    </div>
                    <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.8px; color: #64748b; text-transform: uppercase; margin-top: 2px;">
                      Privilèges & Bons Plans Fidélité
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 5px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${currentTier.bg}; color: ${currentTier.text}; border: 1px solid ${currentTier.border};">
                      ${currentTier.icon} Palier ${escapeHtml(tier)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            resolvedImageUrl
              ? `<!-- Hero Banner Image (Bulletproof responsive container) -->
          <tr>
            <td style="padding: 20px 24px 8px; background-color: #ffffff;" align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 552px; background-color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td align="center" style="line-height: 0; padding: 0;">
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="text-decoration: none; display: block;">
                      <img
                        src="${escapeHtml(resolvedImageUrl)}"
                        alt="${escapeHtml(subject)}"
                        width="552"
                        class="mobile-hero-img"
                        style="width: 100%; max-width: 552px; height: auto; display: block; border: 0; outline: none; text-decoration: none;"
                      />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Main Content Body -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 36px 32px; background-color: #ffffff;">
              
              <!-- Greeting & Tier Welcome Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; line-height: 1.3;">
                      Bonjour ${escapeHtml(customerName)},
                    </h1>
                    <div style="padding: 12px 16px; background-color: ${currentTier.highlightBg}; border-radius: 12px; border: 1px solid ${currentTier.border}; font-size: 13px; color: ${currentTier.text}; font-weight: 600;">
                      ${currentTier.icon} Offre exclusive réservée à votre statut <strong>${escapeHtml(currentTier.label)}</strong> chez ${escapeHtml(storeName)}.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Subject / Headline Title -->
              <div style="margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 19px; font-weight: 800; color: #0f172a; line-height: 1.4; letter-spacing: -0.3px;">
                  ${escapeHtml(subject)}
                </h2>
              </div>

              <!-- Editorial Body Text -->
              <div style="font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 28px;">
                ${formattedContent}
              </div>

              <!-- Bulletproof Call-To-Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(ctaUrl)}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="25%" strokecolor="#e11d48" fillcolor="#e11d48">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(ctaText)} &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a
                      href="${escapeHtml(ctaUrl)}"
                      target="_blank"
                      style="display: inline-block; padding: 15px 32px; background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); background-color: #e11d48; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: 0.2px; border-radius: 14px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35); text-align: center; border: 1px solid #be123c;"
                    >
                      ${escapeHtml(ctaText)} &rarr;
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Loyalty Advantage Grid (3 Perks) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 8px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td class="mobile-perk-cell" width="33%" valign="top" style="padding: 6px 8px; text-align: center;">
                          <div style="font-size: 18px; margin-bottom: 4px;">🏷️</div>
                          <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">En Caisse</div>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Indiquez votre nom ou tél</div>
                        </td>
                        <td class="mobile-perk-cell" width="33%" valign="top" style="padding: 6px 8px; text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                          <div style="font-size: 18px; margin-bottom: 4px;">⚡</div>
                          <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Points Fidélité</div>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Cumulés automatiquement</div>
                        </td>
                        <td class="mobile-perk-cell" width="33%" valign="top" style="padding: 6px 8px; text-align: center;">
                          <div style="font-size: 18px; margin-bottom: 4px;">🎁</div>
                          <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Remises</div>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Déductibles sur vos achats</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Store Info & Legal Footer -->
          <tr>
            <td class="mobile-padding" style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                ${escapeHtml(storeName)}
              </div>
              <div style="color: #475569; margin-bottom: 4px;">
                📍 ${escapeHtml(storeAddress)}
              </div>
              ${
                storePhone
                  ? `<div style="color: #475569; margin-bottom: 12px;">
                📞 <a href="tel:${escapeHtml(storePhone.replace(/\s+/g, ""))}" style="color: #0f172a; font-weight: 600; text-decoration: none;">${escapeHtml(storePhone)}</a>
              </div>`
                  : ""
              }
              <div style="padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Vous recevez ce message car vous êtes inscrit(e) au programme de fidélité en magasin chez ${escapeHtml(storeName)}.<br />
                Pour toute question ou mise à jour de vos coordonnées, présentez-vous directement à notre comptoir caisse.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Intelligent editorial formatter:
 * - Detects bullet points (lines starting with -, *, •, or numbers) and turns them into modern highlight rows.
 * - Wraps normal paragraphs into clean, readable typography with proper line-height.
 */
function formatEditorialContent(raw: string): string {
  const paragraphs = raw.trim().split(/\n\s*\n/);

  return paragraphs
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

      // Check if this block is a bulleted list
      const isBulletList = lines.every((line) => /^[-*•\d+.]\s+/.test(line));

      if (isBulletList) {
        const listItemsHtml = lines
          .map((line) => {
            const cleanText = line.replace(/^[-*•\d+.]\s+/, "");
            return `
              <tr>
                <td width="24" valign="top" style="padding: 4px 8px 6px 0; color: #e11d48; font-weight: bold; font-size: 14px; line-height: 1.4;">
                  ✓
                </td>
                <td valign="top" style="padding: 4px 0 6px 0; font-size: 15px; color: #1e293b; font-weight: 500; line-height: 1.6;">
                  ${escapeHtml(cleanText)}
                </td>
              </tr>
            `;
          })
          .join("");

        return `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 14px 0 18px; background-color: #fafafa; border-radius: 12px; padding: 10px 16px; border: 1px solid #f1f5f9;">
            ${listItemsHtml}
          </table>
        `;
      }

      // Standard paragraph
      const formattedLines = lines.map(escapeHtml).join("<br />");
      return `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #334155;">${formattedLines}</p>`;
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

