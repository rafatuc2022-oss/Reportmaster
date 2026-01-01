
import { jsPDF } from 'jspdf';
import { Report } from '../types';

export const generatePDF = async (report: Report) => {
  const doc = new jsPDF();
  
  // Configurações Gerais
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Cores
  const colorBlue = [30, 58, 138]; // #1e3a8a
  const colorGrayBg = [248, 250, 252]; // #f8fafc
  const colorGrayBorder = [203, 213, 225]; // #cbd5e1
  const colorTextLabel = [100, 116, 139]; // #64748b
  const colorTextValue = [30, 41, 59]; // #1e293b
  const colorSuccess = [22, 163, 74]; // #16a34a (Verde Forte)
  const colorDanger = [220, 38, 38]; // #dc2626 (Vermelho Forte)

  // --- FUNÇÕES AUXILIARES ---

  const drawCell = (label: string, value: string, x: number, yPos: number, w: number, h: number, isMultiLine = false) => {
    doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
    doc.rect(x, yPos, w, h);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
    doc.text(label.toUpperCase(), x + 2, yPos + 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);

    if (isMultiLine) {
       const splitText = doc.splitTextToSize(value || '-', w - 4);
       doc.text(splitText, x + 2, yPos + 9);
    } else {
       let text = value || '-';
       if (doc.getTextWidth(text) > w - 4) {
         text = text.substring(0, Math.floor(text.length * (w / doc.getTextWidth(text)))) + '...';
       }
       doc.text(text, x + 2, yPos + 9);
    }
  };

  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 2, yPos + 4);
    return 6;
  };

  // Desenha Ícone Dinâmico (Check ou Cross)
  const drawStatusIcon = (x: number, yPos: number, isSuccess: boolean) => {
    if (isSuccess) {
      doc.setDrawColor(colorSuccess[0], colorSuccess[1], colorSuccess[2]);
      doc.setLineWidth(0.6);
      doc.line(x, yPos + 1.5, x + 1.2, yPos + 2.7);
      doc.line(x + 1.2, yPos + 2.7, x + 3.5, yPos);
    } else {
      doc.setDrawColor(colorDanger[0], colorDanger[1], colorDanger[2]);
      doc.setLineWidth(0.6);
      doc.line(x, yPos, x + 3, yPos + 3);
      doc.line(x + 3, yPos, x, yPos + 3);
    }
    doc.setLineWidth(0.2); // reset
  };

  // --- CONSTRUÇÃO ---

  // 1. CABEÇALHO
  doc.addImage("https://cdn-icons-png.flaticon.com/512/906/906343.png", "PNG", margin, y, 12, 12);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
  doc.text("RELATÓRIO TÉCNICO DE ATIVIDADE", margin + 16, y + 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
  doc.text("AUTOMAÇÃO MINA SERRA SUL | MANUTENÇÃO", margin + 16, y + 10);

  doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
  doc.roundedRect(pageWidth - margin - 40, y, 40, 12, 1, 1);
  doc.setFontSize(7);
  doc.text("N° OM", pageWidth - margin - 38, y + 4);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
  doc.text(report.omNumber || "S/N", pageWidth - margin - 38, y + 9);

  y += 18;

  // 2. IDENTIFICAÇÃO
  y += drawSectionHeader("Identificação", y);
  drawCell("Equipamento", report.equipment, margin, y, contentWidth * 0.6, 12);
  drawCell("Localização", report.location, margin + (contentWidth * 0.6), y, contentWidth * 0.4, 12);
  y += 12;
  drawCell("Centro de Trabalho", report.workCenter, margin, y, contentWidth * 0.33, 12);
  drawCell("Equipe / Turno", report.teamShift, margin + (contentWidth * 0.33), y, contentWidth * 0.33, 12);
  drawCell("Tipo Atividade", report.activityType.toUpperCase(), margin + (contentWidth * 0.66), y, contentWidth * 0.34, 12);
  y += 12;
  drawCell("Responsáveis Técnicos", report.technicians || "Não informado", margin, y, contentWidth, 12);
  y += 12;

  // 3. CRONOGRAMA
  y += 4;
  y += drawSectionHeader("Cronograma de Execução", y);
  drawCell("Data Execução", report.date.split('-').reverse().join('/'), margin, y, contentWidth * 0.25, 12);
  drawCell("Início", report.startTime, margin + (contentWidth * 0.25), y, contentWidth * 0.25, 12);
  drawCell("Fim", report.endTime, margin + (contentWidth * 0.5), y, contentWidth * 0.25, 12);
  
  let duration = "-";
  if (report.startTime && report.endTime) {
     const [h1, m1] = report.startTime.split(':').map(Number);
     const [h2, m2] = report.endTime.split(':').map(Number);
     let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
     if (diff < 0) diff += 24 * 60;
     duration = `${Math.floor(diff / 60)}h ${diff % 60}m`;
  }
  drawCell("Duração Estimada", duration, margin + (contentWidth * 0.75), y, contentWidth * 0.25, 12);
  y += 12;

  // 4. DETALHAMENTO COM ÍCONES DINÂMICOS
  y += 4;
  y += drawSectionHeader("Detalhamento da Execução", y);
  drawCell("Descrição da Ordem de Manutenção", report.omDescription, margin, y, contentWidth, 14, true);
  y += 14;

  const rawActivities = report.activityExecuted || '-';
  const lines = rawActivities.split('\n').filter(l => l.trim() !== '');
  const activitiesBoxHeight = Math.max(50, (lines.length * 6) + 15);
  
  doc.setFillColor(colorGrayBg[0], colorGrayBg[1], colorGrayBg[2]);
  doc.rect(margin, y, contentWidth, activitiesBoxHeight, 'F');
  drawCell("Atividades Executadas / Procedimentos Realizados", "", margin, y, contentWidth, activitiesBoxHeight);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
  
  lines.forEach((line, index) => {
    const lineY = y + 12 + (index * 6);
    if (lineY < pageHeight - 40) {
      // Lógica de ícone dinâmico: se a linha contiver um 'x' no início ou emoji de erro, mostra ❌
      const cleanLine = line.trim().replace(/^[✅❌]\s*/, '');
      const isError = line.toLowerCase().includes('❌') || line.toLowerCase().startsWith('x ');
      
      drawStatusIcon(margin + 4, lineY - 2.5, !isError);
      doc.text(cleanLine, margin + 10, lineY);
    }
  });
  
  y += activitiesBoxHeight;

  // 5. STATUS COM CORES DE ALTA VISIBILIDADE
  y += 4;
  y += drawSectionHeader("Status & Controle", y);
  const drawStatus = (label: string, status: boolean, x: number, w: number, obs?: string) => {
    const h = obs ? 20 : 12;
    doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
    doc.rect(x, y, w, h);
    
    // Circulo lateral
    doc.setFillColor(status ? colorSuccess[0] : colorDanger[0]);
    doc.circle(x + 5, y + 6, 1.8, 'F');
    
    doc.setFontSize(8); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
    doc.text(label, x + 10, y + 7);

    // Valor SIM/NÃO com cor explícita
    const statusText = status ? "SIM" : "NÃO";
    if (status) {
      doc.setTextColor(colorSuccess[0], colorSuccess[1], colorSuccess[2]);
    } else {
      doc.setTextColor(colorDanger[0], colorDanger[1], colorDanger[2]);
    }
    doc.text(statusText, x + w - 12, y + 7, { align: 'right' });

    if (obs) { 
      doc.setFontSize(7); 
      doc.setFont('helvetica', 'normal'); 
      doc.setTextColor(colorDanger[0], colorDanger[1], colorDanger[2]);
      doc.text(`Obs: ${obs}`, x + 4, y + 16); 
    }
  };

  const sw = contentWidth / 3;
  drawStatus("OM Finalizada?", report.isOmFinished, margin, sw);
  drawStatus("Houve Desvio?", report.iamoDeviation, margin + sw, sw, report.iamoDeviation ? report.iamoExplanation : undefined);
  drawStatus("Pendências?", report.hasPendencies, margin + (sw * 2), sw, report.hasPendencies ? report.pendencyExplanation : undefined);
  
  y += (report.iamoDeviation || report.hasPendencies) ? 20 : 12;

  // 6. RODAPÉ COM FONTE PEQUENA
  const footerY = pageHeight - 15;
  doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(6.5); // Fonte ainda menor para o rodapé
  doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
  doc.setFont('helvetica', 'normal');
  doc.text("Relatorio gerado via app reportmaster criado por Rafael", margin, footerY + 5);
  doc.text(`Data Emissão: ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY + 5, { align: 'right' });

  // PÁGINA DE FOTOS
  if (report.photos && report.photos.length > 0) {
    doc.addPage();
    y = margin;
    drawSectionHeader("Registro Fotográfico", y);
    y += 10;
    const colW = (contentWidth - 10) / 2;
    let col = 0;
    for (const photo of report.photos) {
      if (y + 85 > pageHeight - margin) { doc.addPage(); y = margin; col = 0; }
      const x = margin + (col * (colW + 10));
      doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
      doc.rect(x, y, colW, 85);
      try {
        const url = typeof photo === 'string' ? photo : photo.url;
        if (url.startsWith('data:image')) doc.addImage(url, 'JPEG', x + 1, y + 1, colW - 2, 70);
      } catch (e) {}
      doc.setFillColor(colorGrayBg[0], colorGrayBg[1], colorGrayBg[2]);
      doc.rect(x, y + 71, colW, 14, 'F');
      doc.setFontSize(7); doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
      const cap = typeof photo === 'string' ? '' : photo.caption || 'Sem legenda';
      doc.text(doc.splitTextToSize(cap, colW - 4), x + 2, y + 76);
      col++; if (col > 1) { col = 0; y += 95; }
    }
  }

  doc.save(`Relatorio_${report.omNumber || 'OM'}_${report.date}.pdf`);
};
