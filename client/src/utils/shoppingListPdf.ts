import jsPDF from 'jspdf';
import { Product } from '../services/salesAPI';

export function generateShoppingListPdf(products: Product[]) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  pdf.setFontSize(16);
  pdf.text('Lista de Compras — JK Mercearia', margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} · ${products.length} item(ns) com estoque baixo`,
    margin,
    y
  );
  y += 10;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);

  products.forEach((product, index) => {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }

    pdf.rect(margin, y - 3.5, 4, 4);
    const label = `${index + 1}. ${product.name} — estoque: ${product.stock} ${product.unit || 'un'}`;
    const lines = pdf.splitTextToSize(label, pageWidth - margin * 2 - 8);
    pdf.text(lines, margin + 7, y);
    y += Math.max(8, lines.length * 5 + 2);
  });

  if (products.length === 0) {
    pdf.text('Nenhum produto com estoque baixo no momento.', margin, y);
  }

  pdf.save(`lista-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
}
