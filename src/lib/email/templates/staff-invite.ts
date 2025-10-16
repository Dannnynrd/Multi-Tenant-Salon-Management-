interface StaffInviteEmailProps {
  recipientEmail: string
  recipientName: string
  salonName: string
  temporaryPassword: string
  loginUrl: string
  resetPasswordUrl?: string
  senderName: string
  senderRole?: string
}

export function generateStaffInviteEmail({
  recipientEmail,
  recipientName,
  salonName,
  temporaryPassword,
  loginUrl,
  resetPasswordUrl,
  senderName,
  senderRole = 'Admin'
}: StaffInviteEmailProps) {
  const subject = `Einladung zum Team von ${salonName}`

  const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #3B82F6;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3B82F6;
        }
        h1 {
            color: #1F2937;
            font-size: 24px;
            margin: 20px 0;
        }
        .credentials-box {
            background-color: #F3F4F6;
            border-left: 4px solid #3B82F6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 5px;
        }
        .credentials-box strong {
            color: #1F2937;
            display: block;
            margin-bottom: 5px;
        }
        .credentials-box code {
            background-color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            display: inline-block;
            margin: 5px 0;
            border: 1px solid #D1D5DB;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3B82F6;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2563EB;
        }
        .info-section {
            background-color: #FEF3C7;
            border: 1px solid #FCD34D;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .info-section h3 {
            color: #92400E;
            margin-top: 0;
            font-size: 16px;
        }
        .info-section ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #92400E;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
        }
        .security-note {
            background-color: #FEE2E2;
            border: 1px solid #FCA5A5;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            color: #991B1B;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${salonName}</div>
        </div>

        <h1>Willkommen im Team, ${recipientName}! 👋</h1>

        <p>
            ${senderName} (${senderRole}) hat Sie als Mitarbeiter zu <strong>${salonName}</strong> eingeladen.
            Sie können sich ab sofort mit den folgenden Zugangsdaten anmelden:
        </p>

        <div class="credentials-box">
            <strong>Ihre Zugangsdaten:</strong>
            <div style="margin-top: 10px;">
                E-Mail: <code>${recipientEmail}</code>
            </div>
            <div>
                Temporäres Passwort: <code>${temporaryPassword}</code>
            </div>
        </div>

        <div class="security-note">
            ⚠️ <strong>Sicherheitshinweis:</strong> Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">Jetzt anmelden</a>
        </div>

        <div class="info-section">
            <h3>Was können Sie im System tun?</h3>
            <ul>
                <li>Termine verwalten und einsehen</li>
                <li>Kundendaten pflegen</li>
                <li>Ihren Kalender verwalten</li>
                <li>Mit dem Team kommunizieren</li>
            </ul>
        </div>

        <div class="info-section" style="background-color: #EFF6FF; border-color: #93C5FD;">
            <h3>Erste Schritte:</h3>
            <ol style="color: #1E40AF;">
                <li>Melden Sie sich mit den obigen Zugangsdaten an</li>
                <li>Ändern Sie Ihr Passwort unter "Einstellungen"</li>
                <li>Vervollständigen Sie Ihr Profil</li>
                <li>Machen Sie sich mit dem System vertraut</li>
            </ol>
        </div>

        ${resetPasswordUrl ? `
        <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
            Falls Sie Ihr Passwort direkt ändern möchten, können Sie auch
            <a href="${resetPasswordUrl}" style="color: #3B82F6;">diesen Link verwenden</a>.
        </p>
        ` : ''}

        <div class="footer">
            <p>
                Diese E-Mail wurde automatisch generiert.<br>
                Bei Fragen wenden Sie sich bitte an ${senderName}.
            </p>
            <p style="margin-top: 15px; font-size: 12px;">
                © ${new Date().getFullYear()} ${salonName}. Alle Rechte vorbehalten.
            </p>
        </div>
    </div>
</body>
</html>
  `

  const textContent = `
${subject}

Willkommen im Team, ${recipientName}!

${senderName} (${senderRole}) hat Sie als Mitarbeiter zu ${salonName} eingeladen.

IHRE ZUGANGSDATEN:
------------------
E-Mail: ${recipientEmail}
Temporäres Passwort: ${temporaryPassword}

WICHTIG: Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!

Anmelden unter: ${loginUrl}

WAS KÖNNEN SIE IM SYSTEM TUN?
- Termine verwalten und einsehen
- Kundendaten pflegen
- Ihren Kalender verwalten
- Mit dem Team kommunizieren

ERSTE SCHRITTE:
1. Melden Sie sich mit den obigen Zugangsdaten an
2. Ändern Sie Ihr Passwort unter "Einstellungen"
3. Vervollständigen Sie Ihr Profil
4. Machen Sie sich mit dem System vertraut

${resetPasswordUrl ? `Passwort direkt ändern: ${resetPasswordUrl}` : ''}

Bei Fragen wenden Sie sich bitte an ${senderName}.

© ${new Date().getFullYear()} ${salonName}. Alle Rechte vorbehalten.
  `.trim()

  return {
    subject,
    htmlContent,
    textContent
  }
}