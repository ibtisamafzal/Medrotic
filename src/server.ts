import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
app.use(express.json());

type ContactRequestBody = {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  queryType?: string;
  message?: string;
};

function sanitizeInput(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFromHeader(fromAddress: string, fromName?: string): string {
  if (!fromName?.trim()) {
    return fromAddress;
  }

  const cleanedName = fromName.replace(/"/g, '').trim();
  return `"${cleanedName}" <${fromAddress}>`;
}

/**
 * robots.txt - SEO and crawler directives.
 * Served as a simple static text response to avoid SSR overhead and 500s.
 */
app.get('/robots.txt', (_req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /doctor-portal/',
        'Disallow: /patient-portal/',
        'Disallow: /auth/',
        '',
        'Sitemap: https://medrotic.vercel.app/sitemap.xml',
      ].join('\n'),
    );
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */
app.post('/api/contact', async (req, res) => {
  const {
    fullName = '',
    phoneNumber = '',
    email = '',
    queryType = '',
    message = '',
  } = (req.body ?? {}) as ContactRequestBody;

  const cleanedData = {
    fullName: sanitizeInput(fullName),
    phoneNumber: sanitizeInput(phoneNumber),
    email: sanitizeInput(email).toLowerCase(),
    queryType: sanitizeInput(queryType),
    message: sanitizeInput(message),
  };

  if (
    !cleanedData.fullName ||
    !cleanedData.phoneNumber ||
    !cleanedData.email ||
    !cleanedData.queryType ||
    !cleanedData.message
  ) {
    return res.status(400).json({
      success: false,
      message: 'All contact fields are required.',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  const smtpHost = process.env['SMTP_HOST'];
  const smtpPort = Number.parseInt(process.env['SMTP_PORT'] ?? '587', 10);
  const smtpUser = process.env['SMTP_USER'];
  const smtpPass = process.env['SMTP_PASS'];
  const smtpSecure = (process.env['SMTP_SECURE'] ?? 'false').toLowerCase() === 'true';
  const contactRecipient = process.env['CONTACT_RECIPIENT'];
  const fromAddress = process.env['CONTACT_FROM'] ?? smtpUser;
  const fromName = process.env['CONTACT_FROM_NAME'];

  if (
    !smtpHost ||
    Number.isNaN(smtpPort) ||
    !smtpUser ||
    !smtpPass ||
    !contactRecipient ||
    !fromAddress
  ) {
    console.error('Contact SMTP configuration is incomplete.');
    return res.status(500).json({
      success: false,
      message: 'Contact service is not configured.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(cleanedData.fullName)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(cleanedData.phoneNumber)}</p>
      <p><strong>Email:</strong> ${escapeHtml(cleanedData.email)}</p>
      <p><strong>Query Type:</strong> ${escapeHtml(cleanedData.queryType)}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(cleanedData.message).replace(/\n/g, '<br/>')}</p>
    `;

    await transporter.sendMail({
      from: buildFromHeader(fromAddress, fromName),
      to: contactRecipient,
      replyTo: cleanedData.email,
      subject: `Contact Form: ${cleanedData.queryType}`,
      text: [
        'New Contact Form Submission',
        `Name: ${cleanedData.fullName}`,
        `Phone: ${cleanedData.phoneNumber}`,
        `Email: ${cleanedData.email}`,
        `Query Type: ${cleanedData.queryType}`,
        `Message: ${cleanedData.message}`,
      ].join('\n'),
      html: htmlBody,
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
    });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
