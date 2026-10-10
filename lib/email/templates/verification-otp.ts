import { VerificationOtpEmailProps, EmailTemplateResult } from "../types";

/**
 * Renders the Confirmation OTP Email Template
 * Follows the Airbnb-inspired clean, minimal, spacious design guidelines.
 */
export function renderVerificationOtpEmail(
  props: VerificationOtpEmailProps
): EmailTemplateResult {
  const { name, otp, expiresInMinutes = 15 } = props;
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  const subject = `${otp} est votre code de confirmation Super Market`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #222222;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f7f7;
      padding: 40px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #ebebeb;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header {
      padding: 32px 32px 24px;
      border-bottom: 1px solid #f0f0f0;
      text-align: left;
    }
    .logo-badge {
      display: inline-block;
      background: #ff385c;
      color: #ffffff;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.5px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .store-title {
      font-size: 20px;
      font-weight: 800;
      color: #111111;
      margin-top: 12px;
      margin-bottom: 2px;
    }
    .store-sub {
      font-size: 12px;
      color: #717171;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #222222;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #484848;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #fdf2f4;
      border: 1.5px dashed #ff385c;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-code {
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #e11d48;
      display: inline-block;
    }
    .otp-caption {
      font-size: 12px;
      font-weight: 600;
      color: #9f1239;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      background-color: #fafafa;
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
      border: 1px solid #eeeeee;
    }
    .meta-item {
      font-size: 13px;
      color: #717171;
      line-height: 1.5;
    }
    .security-note {
      font-size: 12px;
      color: #717171;
      line-height: 1.5;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
    }
    .footer {
      background-color: #fafafa;
      padding: 24px 32px;
      border-top: 1px solid #eeeeee;
      font-size: 11px;
      color: #888888;
      line-height: 1.5;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">Super Market</span>
        <div class="store-title">Super Market Calais</div>
        <div class="store-sub">Programme Fidélité &amp; Primeur de Quartier</div>
      </div>
      <div class="content">
        <div class="greeting">${greeting}</div>
        <div class="message">
          Merci de créer votre compte client chez <strong>Super Market Calais</strong> ! 
          Pour finaliser votre inscription et activer votre espace fidélité, veuillez saisir le code de confirmation ci-dessous :
        </div>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-caption">Code valable ${expiresInMinutes} minutes</div>
        </div>

        <div class="meta-box">
          <div class="meta-item">
            ✨ <strong>Vos avantages dès la création de compte :</strong>
            <br>• 1 € dépensé = 1 point fidélité crédité en caisse
            <br>• Remises immédiates déduites lors de vos courses
            <br>• Vos points consultables à tout moment en ligne
          </div>
        </div>

        <div class="security-note">
          🔒 <strong>Information de sécurité :</strong> Ne transmettez ce code à personne. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
        </div>
      </div>
      <div class="footer">
        <strong>Super Market Calais</strong><br>
        205 Avenue Antoine de Saint-Exupéry, 62100 Calais<br>
        Ouvert 7j/7 • Service Client : 06 71 54 05 28
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `${greeting}

Voici votre code de confirmation pour finaliser la création de votre compte client Super Market Calais :

VOTRE CODE : ${otp}
(Ce code expire dans ${expiresInMinutes} minutes)

Avantages fidélité :
- 1 € dépensé = 1 point fidélité crédité en caisse
- Déduction de remises directes sur vos achats

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

--
Super Market Calais
205 Avenue Antoine de Saint-Exupéry, 62100 Calais
Ouvert 7j/7 - 06 71 54 05 28`;

  return { subject, html, text };
}
