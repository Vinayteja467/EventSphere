import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Generates a high-quality PDF certificate and returns it as a Buffer.
 * @param {Object} certificateData - Metadata for the certificate
 * @returns {Promise<Buffer>} - Generated PDF as a binary Buffer
 */
export const generateCertificatePDF = async (certificateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        participantName,
        eventName,
        eventDate,
        eventVenue,
        organizerName = 'EventSphere Organizer',
        organizerRole = 'Event Director',
        certificateId,
        type = 'participant',
        position = ''
      } = certificateData;

      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Theme Colors Map
      const themes = {
        participant: {
          accent: '#6366f1', // Indigo
          heading: 'CERTIFICATE OF PARTICIPATION',
          bodyText: 'has successfully participated in and completed',
          secondaryAccent: '#22d3ee'
        },
        volunteer: {
          accent: '#10b981', // Green
          heading: 'CERTIFICATE OF APPRECIATION',
          bodyText: 'in recognition of dedicated volunteer service at',
          secondaryAccent: '#34d399'
        },
        winner: {
          accent: '#f59e0b', // Gold/Amber
          heading: 'CERTIFICATE OF ACHIEVEMENT',
          bodyText: 'for outstanding performance at',
          secondaryAccent: '#d97706'
        },
        speaker: {
          accent: '#22d3ee', // Cyan
          heading: 'CERTIFICATE OF RECOGNITION',
          bodyText: 'for delivering an insightful session at',
          secondaryAccent: '#06b6d4'
        }
      };

      const theme = themes[type.toLowerCase()] || themes.participant;

      // 1. Sleek Dark background (#0a0a0f matches --bg-primary)
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0a0f');

      // 2. Top accent bar: 4px height, simulated gradient (two rects)
      const barHeight = 6;
      if (type.toLowerCase() === 'winner') {
        doc.rect(0, 0, doc.page.width / 2, barHeight).fill('#f59e0b');
        doc.rect(doc.page.width / 2, 0, doc.page.width / 2, barHeight).fill('#d97706');
      } else {
        doc.rect(0, 0, doc.page.width / 2, barHeight).fill('#6366f1');
        doc.rect(doc.page.width / 2, 0, doc.page.width / 2, barHeight).fill('#22d3ee');
      }

      // 3. Double border lines in Accent and Secondary Accent
      doc.lineWidth(2);
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke(theme.accent);
      doc.lineWidth(1);
      doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).stroke(theme.secondaryAccent);

      // Decorative corner accents (Glowing brackets)
      const pad = 35;
      const len = 30;
      doc.lineWidth(2);
      doc.strokeColor(theme.secondaryAccent);
      // Top-left
      doc.moveTo(pad, pad).lineTo(pad + len, pad).moveTo(pad, pad).lineTo(pad, pad + len).stroke();
      // Top-right
      doc.moveTo(doc.page.width - pad, pad).lineTo(doc.page.width - pad - len, pad).moveTo(doc.page.width - pad, pad).lineTo(doc.page.width - pad, pad + len).stroke();
      // Bottom-left
      doc.moveTo(pad, doc.page.height - pad).lineTo(pad + len, doc.page.height - pad).moveTo(pad, doc.page.height - pad).lineTo(pad, doc.page.height - pad - len).stroke();
      // Bottom-right
      doc.moveTo(doc.page.width - pad, doc.page.height - pad).lineTo(doc.page.width - pad - len, doc.page.height - pad).moveTo(doc.page.width - pad, doc.page.height - pad).lineTo(doc.page.width - pad, doc.page.height - pad - len).stroke();

      // 4. Logo text top-left
      doc.fillColor('#f1f5f9');
      doc.fontSize(14).font('Helvetica-Bold').text('EventSphere', 50, 45);

      // 5. Main Title / Heading Centered
      doc.fillColor(theme.accent);
      const letterSpacedHeading = theme.heading.split('').join(' ');
      doc.fontSize(12).font('Helvetica-Bold').text(letterSpacedHeading, {
        align: 'center',
        y: 95
      });

      // 6. Winner Position Banner (only for Winner type)
      let bodyTextY = 190;
      if (type.toLowerCase() === 'winner' && position) {
        // Render WINNER banner
        const bannerText = `WINNER — ${position.toUpperCase()}`;
        doc.fillColor('#f59e0b');
        doc.fontSize(18).font('Helvetica-Bold').text(bannerText, {
          align: 'center',
          y: 135
        });
        bodyTextY = 210;
      }

      // 7. Body text: "This is to certify that"
      doc.fillColor('#94a3b8');
      doc.fontSize(13).font('Helvetica-Oblique').text('This is to certify that', {
        align: 'center',
        y: bodyTextY
      });

      // 8. Participant Name (large, bold, cyan/accent color)
      doc.fillColor('#22d3ee');
      doc.fontSize(30).font('Helvetica-Bold').text(participantName, {
        align: 'center',
        y: bodyTextY + 28
      });

      // Underline participant name
      const nameWidth = doc.widthOfString(participantName);
      doc.moveTo((doc.page.width - nameWidth) / 2, bodyTextY + 62)
        .lineTo((doc.page.width + nameWidth) / 2, bodyTextY + 62)
        .strokeColor(theme.secondaryAccent)
        .lineWidth(1.5)
        .stroke();

      // 9. Completion body text
      doc.fillColor('#94a3b8');
      doc.fontSize(13).font('Helvetica').text(theme.bodyText, {
        align: 'center',
        y: bodyTextY + 80
      });

      // 10. Event Name (Indigo/Gold)
      doc.fillColor(theme.accent);
      doc.fontSize(22).font('Helvetica-Bold').text(eventName, {
        align: 'center',
        y: bodyTextY + 110
      });

      // 11. Date and Venue
      doc.fillColor('#64748b');
      doc.fontSize(11).font('Helvetica').text(`Held on: ${eventDate}    |    Venue: ${eventVenue}`, {
        align: 'center',
        y: bodyTextY + 145
      });

      // 12. Divider Line
      doc.moveTo(doc.page.width / 4, bodyTextY + 175)
        .lineTo(3 * (doc.page.width / 4), bodyTextY + 175)
        .strokeColor('rgba(255, 255, 255, 0.08)')
        .lineWidth(1)
        .stroke();

      // 13. Bottom Row: Signature (left) + QR code (right)
      const bottomY = doc.page.height - 135;

      // Signature Block (Left)
      // Draw signature simulation line
      doc.moveTo(80, bottomY + 50).lineTo(250, bottomY + 50).strokeColor('#475569').stroke();
      doc.fillColor('#22d3ee');
      doc.fontSize(13).font('Courier-BoldOblique').text(organizerName, 80, bottomY + 25);
      doc.fillColor('#94a3b8');
      doc.fontSize(10).font('Helvetica').text(organizerRole, 80, bottomY + 58);

      // Generate QR Code containing the verify URL
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        color: {
          dark: '#ffffff', // White QR lines on dark background
          light: '#0a0a0f' // Match PDF dark background
        },
        width: 75
      });

      // Render QR Code Image (Right)
      doc.image(qrCodeDataUrl, doc.page.width - 150, bottomY, { width: 75 });
      doc.fillColor('#475569');
      doc.fontSize(7).font('Helvetica').text('Scan to Verify', doc.page.width - 150, bottomY + 80, { width: 75, align: 'center' });

      // 14. Certificate ID Watermark: bottom center
      doc.fillColor('#334155');
      doc.fontSize(8).font('Courier-Bold').text(`Certificate ID: ${certificateId}`, {
        align: 'center',
        y: doc.page.height - 35
      });

      // Finalize PDF file
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};
