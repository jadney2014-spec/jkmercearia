
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdf = async (element: HTMLElement, fileName: string) => {
  const canvas = await html2canvas(element);
  const data = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const title = fileName.replace('.pdf', '');
  pdf.setFontSize(18);
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pdfWidth - titleWidth) / 2, margin + 10);

  const canvasAspectRatio = canvas.width / canvas.height;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = pdfHeight - margin * 2 - 20; // 20 for title

  let imgWidth = contentWidth;
  let imgHeight = contentWidth / canvasAspectRatio;

  if (imgHeight > contentHeight) {
    imgHeight = contentHeight;
    imgWidth = contentHeight * canvasAspectRatio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  const y = margin + 20;

  pdf.addImage(data, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(fileName);
};
