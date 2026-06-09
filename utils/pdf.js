const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateCertificate = (userName, courseTitle, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Certificate Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f9fcfb');
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#059669'); // emerald-600 border

      // Title
      doc.font('Helvetica-Bold')
         .fontSize(40)
         .fillColor('#0f172a') // slate-900
         .text('Certificate of Completion', 0, 120, { align: 'center' });

      // Subtitle
      doc.font('Helvetica')
         .fontSize(20)
         .fillColor('#64748b') // slate-500
         .text('This is to certify that', 0, 200, { align: 'center' });

      // User Name
      doc.font('Helvetica-Bold')
         .fontSize(35)
         .fillColor('#059669') // emerald-600
         .text(userName, 0, 250, { align: 'center' });

      // Text
      doc.font('Helvetica')
         .fontSize(20)
         .fillColor('#64748b')
         .text('has successfully completed the course', 0, 320, { align: 'center' });

      // Course Title
      doc.font('Helvetica-Bold')
         .fontSize(25)
         .fillColor('#0f172a')
         .text(`"${courseTitle}"`, 0, 370, { align: 'center' });

      // Date
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.font('Helvetica')
         .fontSize(15)
         .fillColor('#94a3b8')
         .text(`Awarded on ${dateStr}`, 0, 450, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
};
