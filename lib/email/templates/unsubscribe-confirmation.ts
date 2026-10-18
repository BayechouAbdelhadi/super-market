import { UnsubscribeConfirmationEmailProps, EmailTemplateResult } from "../types";
import { escapeHtml } from "./escape-html";

/**
 * Renders the "confirm your unsubscribe" email (double opt-out for requests
 * typed into the public unsubscribe form).
 */
export function renderUnsubscribeConfirmationEmail(
  props: UnsubscribeConfirmationEmailProps
): EmailTemplateResult {
  const link = escapeHtml(props.unsubscribeLink);
  const subject = "Confirmez votre désabonnement - Super Market Calais";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
  <div style="width:100%;background-color:#f7f7f7;padding:40px 16px;box-sizing:border-box;">
    <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #ebebeb;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #f0f0f0;">
        <span style="display:inline-block;background:#ff385c;color:#ffffff;font-weight:900;font-size:14px;padding:6px 14px;border-radius:9999px;text-transform:uppercase;">Super Market</span>
        <div style="font-size:20px;font-weight:800;color:#111111;margin-top:12px;">Super Market Calais</div>
      </div>
      <div style="padding:32px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:12px;">Bonjour,</div>
        <div style="font-size:15px;line-height:1.6;color:#484848;margin-bottom:24px;">
          Nous avons reçu une demande pour ne plus envoyer nos offres et bons plans à cette adresse e-mail.
          Pour confirmer votre désabonnement, cliquez sur le bouton ci-dessous.
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" target="_blank" style="display:inline-block;background-color:#ff385c;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:12px;">Confirmer mon désabonnement</a>
        </div>
        <div style="font-size:12px;color:#717171;line-height:1.5;margin-top:24px;padding-top:20px;border-top:1px solid #f0f0f0;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : vous continuerez à recevoir nos offres.
          Votre compte fidélité n'est pas concerné.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Bonjour,

Nous avons reçu une demande pour ne plus envoyer nos offres et bons plans à cette adresse e-mail.
Pour confirmer votre désabonnement, ouvrez ce lien :

${props.unsubscribeLink}

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.

--
Super Market Calais`;

  return { subject, html, text };
}
