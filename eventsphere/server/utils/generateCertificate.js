import PDFDocument from 'pdfkit';

/**
 * Generates a dynamic PDF certificate and pipes it directly to the response.
 * @param {Object} res - Express response object
 * @param {Object} details - Participant and event details
 */
export const generateCertificatePDF = (res, details) => {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 40
  });

  // Pipe the PDF document to the response stream
  doc.pipe(res);

  // 1. Sleek Dark background (#0a0a0f matches --bg-primary)
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0a0f');

  // 2. Double border lines in Indigo (#6366f1) and Cyan (#22d3ee)
  doc.lineWidth(3);
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#6366f1');
  doc.lineWidth(1);
  doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).stroke('#22d3ee');

  // Decorative corner accents (Glowing brackets)
  const pad = 35;
  const len = 30;
  doc.lineWidth(2);
  doc.strokeColor('#22d3ee');
  // Top-left
  doc.moveTo(pad, pad).lineTo(pad + len, pad).moveTo(pad, pad).lineTo(pad, pad + len).stroke();
  // Top-right
  doc.moveTo(doc.page.width - pad, pad).lineTo(doc.page.width - pad - len, pad).moveTo(doc.page.width - pad, pad).lineTo(doc.page.width - pad, pad + len).stroke();
  // Bottom-left
  doc.moveTo(pad, doc.page.height - pad).lineTo(pad + len, doc.page.height - pad).moveTo(pad, doc.page.height - pad).lineTo(pad, doc.page.height - pad - len).stroke();
  // Bottom-right
  doc.moveTo(doc.page.width - pad, doc.page.height - pad).lineTo(doc.page.width - pad - len, doc.page.height - pad).moveTo(doc.page.width - pad, doc.page.height - pad).lineTo(doc.page.width - pad, doc.page.height - pad - len).stroke();

  // 3. Document Branding Header
  doc.fillColor('#6366f1');
  doc.fontSize(14).font('Helvetica-Bold').text('E V E N T S P H E R E', {
    align: 'center',
    y: 60
  });

  doc.fillColor('#22d3ee');
  doc.fontSize(9).font('Helvetica').text('A I - P O W E R E D   E V E N T   E C O S Y S T E M', {
    align: 'center'
  });

  // 4. Main Certificate Title
  doc.fillColor('#f1f5f9');
  doc.fontSize(38).font('Helvetica-Bold').text('CERTIFICATE OF EXCELLENCE', {
    align: 'center',
    y: 130
  });

  // Subtext
  doc.fillColor('#94a3b8');
  doc.fontSize(14).font('Helvetica-Oblique').text('This certificate is proudly awarded to', {
    align: 'center',
    y: 190
  });

  // 5. Participant Name (Cyan accent)
  doc.fillColor('#22d3ee');
  doc.fontSize(32).font('Helvetica-Bold').text(details.userName, {
    align: 'center',
    y: 220
  });

  // Description
  doc.fillColor('#94a3b8');
  doc.fontSize(14).font('Helvetica').text(`for outstanding participation and successful completion of`, {
    align: 'center',
    y: 280
  });

  // Event Title (Indigo accent)
  doc.fillColor('#6366f1');
  doc.fontSize(24).font('Helvetica-Bold').text(details.eventTitle, {
    align: 'center',
    y: 310
  });

  // Category and Dates
  doc.fillColor('#64748b');
  doc.fontSize(11).font('Helvetica').text(`Category: ${details.category}    |    Completed On: ${details.date}    |    Venue: ${details.venue}`, {
    align: 'center',
    y: 350
  });

  // Divider Line
  doc.moveTo(doc.page.width / 4, 380).lineTo(3 * (doc.page.width / 4), 380).strokeColor('rgba(255,255,255,0.08)').stroke();

  // Footer metadata (Verification ID)
  doc.fillColor('#475569');
  doc.fontSize(10).font('Courier-Bold').text(`Verification: ${details.registrationId}`, {
    align: 'center',
    y: 400
  });

  doc.fillColor('#64748b');
  doc.fontSize(9).font('Helvetica').text('Scan QR Code on EventSphere platform for authenticity verification.', {
    align: 'center',
    y: 420
  });

  // Finalize PDF file
  doc.end();
};
