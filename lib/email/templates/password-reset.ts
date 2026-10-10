import { PasswordResetEmailProps, EmailTemplateResult } from "../types";

/**
 * Renders the Password Reset Email Template
 * Follows the Airbnb-inspired clean, minimal, spacious design guidelines.
 */
export function renderPasswordResetEmail(
  props: PasswordResetEmailProps
): EmailTemplateResult {
  const { name, resetLink, resetCode, expiresInMinutes = 15 } = props;
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  const subject = "Réinitialisation de votre mot de passe - Super Market Calais";

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
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #ff385c;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(255, 56, 92, 0.3);
    }
    .code-box {
      background: #fdf2f4;
      border: 1.5px dashed #ff385c;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-digits {
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #e11d48;
    }
    .code-caption {
      font-size: 12px;
      font-weight: 600;
      color: #9f1239;
      margin-top: 6px;
    }
    .link-fallback {
      font-size: 12px;
      color: #717171;
      line-height: 1.5;
      word-break: break-all;
      background: #fafafa;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #eeeeee;
      margin-top: 16px;
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
        <div class="store-sub">Sécurité &amp; Accès au Compte</div>
      </div>
      <div class="content">
        <div class="greeting">${greeting}</div>
        <div class="message">
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte client <strong>Super Market Calais</strong>.
        </div>
        
        <div class="btn-container">
          <a href="${resetLink}" class="btn-primary" target="_blank">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <div class="link-fallback">
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
          <a href="${resetLink}" style="color: #ff385c;">${resetLink}</a>
        </div>

        <div class="security-note">
          🔒 <strong>Information importante :</strong> Cette demande est valable pendant ${expiresInMinutes} minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité : votre mot de passe actuel restera inchangé.
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

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Super Market Calais.
Pour choisir votre nouveau mot de passe, cliquez sur le lien ci-dessous :

${resetLink}

(Ce lien expire dans ${expiresInMinutes} minutes)

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email : votre mot de passe reste sécurisé.

--
Super Market Calais
205 Avenue Antoine de Saint-Exupéry, 62100 Calais
Ouvert 7j/7 - 06 71 54 05 28`;

  return { subject, html, text };
}
