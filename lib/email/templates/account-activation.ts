import { AccountActivationEmailProps, EmailTemplateResult } from "../types";

/**
 * Renders the Account Activation / Invitation Email Template
 * Customizes content for Customer (created at cash register) vs Cashier (invited by admin).
 * Follows the Airbnb-inspired clean, minimal, spacious design guidelines.
 */
export function renderAccountActivationEmail(
  props: AccountActivationEmailProps
): EmailTemplateResult {
  const { name, activationLink, role, expiresInDays = 7 } = props;
  const isCashier = role === 'CASHIER';
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";

  const subject = isCashier
    ? "Invitation à rejoindre l'équipe caisse — Super Market Calais"
    : "Activez votre compte fidélité — Super Market Calais";

  const badgeText = isCashier ? "Invitation Collaboration" : "Programme Fidélité";
  const headline = isCashier
    ? "Vous êtes invité(e) à collaborer en tant que caissier(e)"
    : "Votre compte fidélité a été créé en caisse";

  const mainParagraph = isCashier
    ? "Un administrateur vous a invité(e) en tant que caissier(e) à collaborer sur la plateforme Super Market Calais pour enregistrer les achats et gérer le programme fidélité de nos clients."
    : "Votre compte fidélité Super Market Calais a été créé lors de votre dernier passage à la caisse. Grâce à lui, vous cumulez automatiquement des points à chaque achat (1 € dépensé = 1 point fidélité) et bénéficiez de réductions exclusives.";

  const callToActionText = isCashier
    ? "Pour finaliser votre accès et commencer à utiliser votre espace caisse, veuillez définir votre mot de passe :"
    : "Pour confirmer votre compte et suivre votre solde de points en ligne, veuillez définir votre mot de passe sécurisé :";

  const buttonText = isCashier
    ? "Activer mon compte caissier"
    : "Confirmer et activer mon compte";

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
      font-size: 13px;
      letter-spacing: 0.5px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .store-title {
      font-size: 20px;
      font-weight: 800;
      color: #222222;
      margin-top: 12px;
      margin-bottom: 0;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #222222;
      margin-bottom: 16px;
    }
    .headline {
      font-size: 22px;
      font-weight: 800;
      color: #222222;
      line-height: 1.3;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.6;
      color: #555555;
      margin-bottom: 20px;
    }
    .highlight-card {
      background-color: #fafafa;
      border: 1px solid #eeeeee;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #333333;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #ff385c;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(255, 56, 92, 0.35);
      letter-spacing: 0.2px;
    }
    .btn:hover {
      background-color: #e00b41;
    }
    .footer {
      padding: 24px 32px;
      background-color: #fafafa;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #888888;
      line-height: 1.5;
    }
    .break-url {
      word-break: break-all;
      color: #717171;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">${badgeText}</span>
        <h1 class="store-title">Super Market Calais</h1>
      </div>
      
      <div class="content">
        <div class="greeting">${greeting}</div>
        <div class="headline">${headline}</div>
        
        <p class="paragraph">${mainParagraph}</p>
        
        <div class="highlight-card">
          ${callToActionText}
        </div>

        <div class="cta-container">
          <a href="${activationLink}" class="btn" target="_blank" rel="noopener noreferrer">
            ${buttonText}
          </a>
        </div>

        <p class="paragraph" style="font-size: 13px; color: #777777;">
          Ce lien est valable pendant <strong>${expiresInDays} jours</strong>. Si vous ne parvenez pas à cliquer sur le bouton, vous pouvez copier et coller ce lien dans votre navigateur :
        </p>
        <p class="break-url">${activationLink}</p>
      </div>
      
      <div class="footer">
        <p style="margin: 0 0 6px 0;">Super Market Calais — 123 Rue de Calais, 62100 Calais</p>
        <p style="margin: 0;">Cet email vous a été envoyé automatiquement suite à la création de votre compte.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `${greeting}

${headline}

${mainParagraph}

${callToActionText}
${activationLink}

(Ce lien est valable pendant ${expiresInDays} jours)

Super Market Calais — 123 Rue de Calais, 62100 Calais`;

  return {
    subject,
    html,
    text,
  };
}
