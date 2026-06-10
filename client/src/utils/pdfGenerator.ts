import jsPDF from 'jspdf';

// Configurações padrão
const PDF_CONFIG = {
  pageSize: 'a4' as const,
  orientation: 'portrait' as const,
  margin: {
    top: 25,
    right: 15,
    left: 15,
    bottom: 25
  },
  colors: {
    primary: [59, 130, 246], // Blue
    success: [34, 197, 94], // Green
    danger: [239, 68, 68], // Red
    gray: [107, 114, 128], // Gray
    dark: [31, 41, 55], // Dark gray
    lightGray: [243, 244, 246] // Light gray
  },
  fonts: {
    title: 18,
    subtitle: 14,
    heading: 12,
    body: 10,
    small: 8
  }
};

interface ChurchInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface PDFGeneratorOptions {
  title: string;
  subtitle?: string;
  churchInfo?: ChurchInfo;
  period?: string;
}

class PDFGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private options: PDFGeneratorOptions;
  private churchInfo: ChurchInfo;

  constructor(options: PDFGeneratorOptions) {
    this.pdf = new jsPDF(PDF_CONFIG.orientation, 'mm', PDF_CONFIG.pageSize);
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right;
    this.currentY = PDF_CONFIG.margin.top;
    this.options = options;
    this.churchInfo = options.churchInfo || { name: 'Igreja' };
    
    this.addHeader();
  }

  // Adiciona cabeçalho profissional
  private addHeader(): void {
    // Logo/Ícone (círculo simples representando igreja)
    const logoSize = 15;
    const logoX = PDF_CONFIG.margin.left;
    const logoY = this.currentY - 8;
    
    // Desenha círculo para logo
    const primaryColor = PDF_CONFIG.colors.primary;
    this.pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    this.pdf.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
    
    // Nome da igreja
    this.pdf.setFontSize(PDF_CONFIG.fonts.subtitle);
    const darkColor = PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    this.pdf.setFont('helvetica', 'bold');
    const churchName = this.churchInfo.name || 'Minha Igreja';
    this.pdf.text(churchName, logoX + logoSize + 5, logoY + 8);
    
    // Informações adicionais da igreja
    if (this.churchInfo.address || this.churchInfo.phone) {
      this.pdf.setFontSize(PDF_CONFIG.fonts.small);
      this.pdf.setFont('helvetica', 'normal');
      const grayColor = PDF_CONFIG.colors.gray;
      this.pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      let infoY = logoY + 12;
      
      if (this.churchInfo.address) {
        this.pdf.text(this.churchInfo.address, logoX + logoSize + 5, infoY);
        infoY += 4;
      }
      
      if (this.churchInfo.phone) {
        this.pdf.text(`Tel: ${this.churchInfo.phone}`, logoX + logoSize + 5, infoY);
      }
    }
    
    // Linha divisória
    this.drawLine(PDF_CONFIG.margin.left, this.currentY + 20, this.contentWidth, 0.5);
    this.currentY += 25;
    
    // Título do relatório
    this.pdf.setFontSize(PDF_CONFIG.fonts.title);
    this.pdf.setFont('helvetica', 'bold');
    const darkColorTitle = PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(darkColorTitle[0], darkColorTitle[1], darkColorTitle[2]);
    const titleWidth = this.pdf.getTextWidth(this.options.title);
    this.pdf.text(this.options.title, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 8;
    
    // Subtítulo (se fornecido)
    if (this.options.subtitle) {
      this.pdf.setFontSize(PDF_CONFIG.fonts.body);
      this.pdf.setFont('helvetica', 'normal');
      const grayColorSubtitle = PDF_CONFIG.colors.gray;
      this.pdf.setTextColor(grayColorSubtitle[0], grayColorSubtitle[1], grayColorSubtitle[2]);
      const subtitleWidth = this.pdf.getTextWidth(this.options.subtitle);
      this.pdf.text(this.options.subtitle, (this.pageWidth - subtitleWidth) / 2, this.currentY);
      this.currentY += 6;
    }
    
    // Período (se fornecido)
    if (this.options.period) {
      this.pdf.setFontSize(PDF_CONFIG.fonts.small);
      this.pdf.setFont('helvetica', 'italic');
      const periodWidth = this.pdf.getTextWidth(`Período: ${this.options.period}`);
      this.pdf.text(`Período: ${this.options.period}`, (this.pageWidth - periodWidth) / 2, this.currentY);
      this.currentY += 6;
    }
    
    this.currentY += 5; // Espaçamento após cabeçalho
  }

  // Adiciona rodapé
  private addFooter(): void {
    const footerY = this.pageHeight - PDF_CONFIG.margin.bottom;
    
    // Linha divisória
    this.drawLine(PDF_CONFIG.margin.left, footerY - 10, this.contentWidth, 0.3);
    
    // Data de geração
    this.pdf.setFontSize(PDF_CONFIG.fonts.small);
    this.pdf.setFont('helvetica', 'normal');
    const grayColorFooter = PDF_CONFIG.colors.gray;
    this.pdf.setTextColor(grayColorFooter[0], grayColorFooter[1], grayColorFooter[2]);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.pdf.text(`Gerado em: ${dateStr}`, PDF_CONFIG.margin.left, footerY - 5);
    
    // Número da página
    const totalPages = this.pdf.getNumberOfPages();
    const pageText = `Página ${totalPages} de ${totalPages}`;
    const pageTextWidth = this.pdf.getTextWidth(pageText);
    this.pdf.text(pageText, this.pageWidth - PDF_CONFIG.margin.right - pageTextWidth, footerY - 5);
  }

  // Adiciona uma nova página se necessário
  private checkNewPage(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - PDF_CONFIG.margin.bottom - 15) {
      this.addFooter();
      this.pdf.addPage();
      this.currentY = PDF_CONFIG.margin.top;
    }
  }

  // Desenha uma linha
  private drawLine(x: number, y: number, width: number, thickness: number = 0.3): void {
    const grayColor = PDF_CONFIG.colors.gray;
    this.pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    this.pdf.setLineWidth(thickness);
    this.pdf.line(x, y, x + width, y);
  }

  // Formata valor monetário
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }

  private cardsInRow: number = 0;

  // Adiciona um card de resumo
  addSummaryCard(label: string, value: number, color: 'success' | 'danger' | 'primary' = 'primary', unit: string = ''): void {
    this.checkNewPage(25);
    
    const cardsPerRow = 3;
    const cardWidth = this.contentWidth / cardsPerRow - 5;
    const cardHeight = 20;
    const cardIndex = this.cardsInRow % cardsPerRow;
    const cardX = PDF_CONFIG.margin.left + (this.contentWidth / cardsPerRow) * cardIndex;
    
    // Fundo do card - usa cor mais clara
    const rgbColor = PDF_CONFIG.colors[color];
    // Cria cor mais clara para o fundo (80% mais claro)
    const lightR = Math.min(255, rgbColor[0] + (255 - rgbColor[0]) * 0.9);
    const lightG = Math.min(255, rgbColor[1] + (255 - rgbColor[1]) * 0.9);
    const lightB = Math.min(255, rgbColor[2] + (255 - rgbColor[2]) * 0.9);
    this.pdf.setFillColor(lightR, lightG, lightB);
    this.pdf.rect(cardX, this.currentY, cardWidth, cardHeight, 'F');
    
    // Borda
    this.pdf.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(cardX, this.currentY, cardWidth, cardHeight, 'D');
    
    // Label
    this.pdf.setFontSize(PDF_CONFIG.fonts.small);
    this.pdf.setFont('helvetica', 'normal');
    const grayColorCard = PDF_CONFIG.colors.gray;
    this.pdf.setTextColor(grayColorCard[0], grayColorCard[1], grayColorCard[2]);
    this.pdf.text(label, cardX + 3, this.currentY + 6);
    
    // Value
    this.pdf.setFontSize(PDF_CONFIG.fonts.heading);
    this.pdf.setFont('helvetica', 'bold');
    const darkColorCard = PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(darkColorCard[0], darkColorCard[1], darkColorCard[2]);
    const valueText = unit ? `${this.formatCurrency(value)} ${unit}` : this.formatCurrency(value);
    this.pdf.text(valueText, cardX + 3, this.currentY + 14);
    
    this.cardsInRow++;
    if (this.cardsInRow % cardsPerRow === 0) {
      this.currentY += cardHeight + 5;
    }
  }

  // Reseta cards para nova linha
  finishCardRow(): void {
    if (this.cardsInRow % 3 !== 0) {
      this.currentY += 25; // Altura do card + espaçamento
    }
    this.cardsInRow = 0;
  }

  // Adiciona uma seção de título
  addSection(title: string, fontSize: number = PDF_CONFIG.fonts.heading): void {
    this.checkNewPage(15);
    this.currentY += 5;
    
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'bold');
    const darkColorSection = PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(darkColorSection[0], darkColorSection[1], darkColorSection[2]);
    this.pdf.text(title, PDF_CONFIG.margin.left, this.currentY);
    this.currentY += 2;
    
    // Linha sob o título
    this.drawLine(PDF_CONFIG.margin.left, this.currentY, this.contentWidth, 0.5);
    this.currentY += 6;
  }

  // Adiciona uma tabela
  addTable(headers: string[], rows: (string | number)[][], columnWidths?: number[]): void {
    this.checkNewPage(40);
    
    const rowHeight = 8;
    const headerHeight = 10;
    
    // Calcula larguras das colunas se não fornecidas
    const widths = columnWidths || headers.map(() => this.contentWidth / headers.length);
    
    // Cabeçalho da tabela
    let x = PDF_CONFIG.margin.left;
    const primaryColor = PDF_CONFIG.colors.primary;
    const headerBgR = Math.min(255, primaryColor[0] + (255 - primaryColor[0]) * 0.9);
    const headerBgG = Math.min(255, primaryColor[1] + (255 - primaryColor[1]) * 0.9);
    const headerBgB = Math.min(255, primaryColor[2] + (255 - primaryColor[2]) * 0.9);
    this.pdf.setFillColor(headerBgR, headerBgG, headerBgB);
    this.pdf.rect(x, this.currentY, this.contentWidth, headerHeight, 'F');
    
    this.pdf.setFontSize(PDF_CONFIG.fonts.small);
    this.pdf.setFont('helvetica', 'bold');
    const darkColorTable = PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(darkColorTable[0], darkColorTable[1], darkColorTable[2]);
    
    headers.forEach((header, index) => {
      const headerX = x;
      this.pdf.text(header, headerX + 3, this.currentY + 6);
      x += widths[index];
    });
    
    // Linha divisória
    this.drawLine(PDF_CONFIG.margin.left, this.currentY + headerHeight, this.contentWidth, 0.3);
    this.currentY += headerHeight;
    
    // Linhas da tabela
    rows.forEach((row, rowIndex) => {
      this.checkNewPage(rowHeight + 5);
      
      // Alterna cor de fundo
      if (rowIndex % 2 === 0) {
        const lightGrayColor = PDF_CONFIG.colors.lightGray;
        this.pdf.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
        this.pdf.rect(PDF_CONFIG.margin.left, this.currentY, this.contentWidth, rowHeight, 'F');
      }
      
      x = PDF_CONFIG.margin.left;
      this.pdf.setFontSize(PDF_CONFIG.fonts.body);
      this.pdf.setFont('helvetica', 'normal');
      const darkColorRow = PDF_CONFIG.colors.dark;
      this.pdf.setTextColor(darkColorRow[0], darkColorRow[1], darkColorRow[2]);
      
      row.forEach((cell, cellIndex) => {
        const cellText = typeof cell === 'number' ? this.formatCurrency(cell) : String(cell);
        this.pdf.text(cellText.substring(0, 30), x + 3, this.currentY + 5); // Limita tamanho do texto
        x += widths[cellIndex];
      });
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 5; // Espaçamento após tabela
  }

  // Adiciona texto formatado
  addText(text: string, fontSize: number = PDF_CONFIG.fonts.body, bold: boolean = false, color?: number[]): void {
    this.checkNewPage(10);
    
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    const textColor = color || PDF_CONFIG.colors.dark;
    this.pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Quebra de linha automática
    const maxWidth = this.contentWidth;
    const lines = this.pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkNewPage(6);
      this.pdf.text(line, PDF_CONFIG.margin.left, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 2;
  }

  // Adiciona gráfico de barras simples
  addBarChart(data: { label: string; value: number; color?: 'success' | 'danger' }[], maxValue?: number): void {
    this.checkNewPage(60);
    
    const chartHeight = 40;
    const barWidth = (this.contentWidth - (data.length - 1) * 5) / data.length;
    const max = maxValue || Math.max(...data.map(d => d.value)) || 1;
    const barStartY = this.currentY;
    const chartBottomY = barStartY + chartHeight;
    
    // Eixo X e Y
    const grayColorChart = PDF_CONFIG.colors.gray;
    this.pdf.setDrawColor(grayColorChart[0], grayColorChart[1], grayColorChart[2]);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(PDF_CONFIG.margin.left, chartBottomY, PDF_CONFIG.margin.left + this.contentWidth, chartBottomY);
    this.pdf.line(PDF_CONFIG.margin.left, barStartY, PDF_CONFIG.margin.left, chartBottomY);
    
    // Desenha barras
    let barX = PDF_CONFIG.margin.left;
    data.forEach((item) => {
      const barHeight = (item.value / max) * (chartHeight - 10);
      const barY = chartBottomY - barHeight;
      
      const barColor = item.color ? PDF_CONFIG.colors[item.color] : PDF_CONFIG.colors.primary;
      this.pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
      this.pdf.rect(barX, barY, barWidth - 2, barHeight, 'F');
      
      // Label
      this.pdf.setFontSize(PDF_CONFIG.fonts.small);
      this.pdf.setFont('helvetica', 'normal');
      const darkColorLabel = PDF_CONFIG.colors.dark;
      this.pdf.setTextColor(darkColorLabel[0], darkColorLabel[1], darkColorLabel[2]);
      const labelWidth = this.pdf.getTextWidth(item.label);
      this.pdf.text(item.label, barX + (barWidth - labelWidth) / 2, chartBottomY + 4);
      
      // Valor
      const valueText = this.formatCurrency(item.value);
      const valueWidth = this.pdf.getTextWidth(valueText);
      this.pdf.text(valueText, barX + (barWidth - valueWidth) / 2, barY - 2);
      
      barX += barWidth + 5;
    });
    
    this.currentY = chartBottomY + 15;
  }

  // Adiciona espaço
  addSpacing(amount: number): void {
    this.currentY += amount;
  }

  // Finaliza e retorna o PDF
  save(fileName: string): void {
    this.addFooter();
    this.pdf.save(fileName);
  }

  // Retorna o objeto PDF para uso avançado
  getPDF(): jsPDF {
    return this.pdf;
  }

  // Retorna a posição Y atual
  getCurrentY(): number {
    return this.currentY;
  }
}

export default PDFGenerator;
export { PDF_CONFIG };

