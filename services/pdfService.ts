
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

  // --- FUNÇÕES AUXILIARES ---

  // Desenha uma célula de tabela (Label + Valor)
  const drawCell = (label: string, value: string, x: number, yPos: number, w: number, h: number, isMultiLine = false) => {
    // Borda
    doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
    doc.rect(x, yPos, w, h);

    // Label (pequeno no topo esquerdo)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
    doc.text(label.toUpperCase(), x + 2, yPos + 4);

    // Valor
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);

    if (isMultiLine) {
       const splitText = doc.splitTextToSize(value || '-', w - 4);
       doc.text(splitText, x + 2, yPos + 9);
    } else {
       // Trunca texto se for muito longo para uma linha simples
       let text = value || '-';
       if (doc.getTextWidth(text) > w - 4) {
         text = text.substring(0, Math.floor(text.length * (w / doc.getTextWidth(text)))) + '...';
       }
       doc.text(text, x + 2, yPos + 9);
    }
  };

  // Cabeçalho de Seção
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 2, yPos + 4);
    return 6;
  };

  // --- CONSTRUÇÃO DO DOCUMENTO ---

  // 1. CABEÇALHO DO RELATÓRIO
  doc.addImage("https://cdn-icons-png.flaticon.com/512/906/906343.png", "PNG", margin, y, 12, 12); // Placeholder Logo (Checklist icon)
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
  doc.text("RELATÓRIO TÉCNICO DE ATIVIDADE", margin + 16, y + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
  doc.text("AUTOMAÇÃO MINA SERRA SUL | MANUTENÇÃO", margin + 16, y + 10);

  // Box N OM e Data (Direita)
  doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
  doc.roundedRect(pageWidth - margin - 40, y, 40, 12, 1, 1);
  
  doc.setFontSize(7);
  doc.text("N° OM", pageWidth - margin - 38, y + 4);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
  doc.text(report.omNumber || "S/N", pageWidth - margin - 38, y + 9);

  y += 18;

  // 2. DADOS DO EQUIPAMENTO E LOCAL
  y += drawSectionHeader("Identificação", y);
  
  // Linha 1
  drawCell("Equipamento", report.equipment, margin, y, contentWidth * 0.6, 12);
  drawCell("Localização", report.location, margin + (contentWidth * 0.6), y, contentWidth * 0.4, 12);
  y += 12;
  
  // Linha 2
  drawCell("Centro de Trabalho", report.workCenter, margin, y, contentWidth * 0.33, 12);
  drawCell("Equipe / Turno", report.teamShift, margin + (contentWidth * 0.33), y, contentWidth * 0.33, 12);
  drawCell("Tipo Atividade", report.activityType.toUpperCase(), margin + (contentWidth * 0.66), y, contentWidth * 0.34, 12);
  y += 12;

  // 3. CRONOGRAMA
  y += 4; // Spacer
  y += drawSectionHeader("Cronograma de Execução", y);

  drawCell("Data Execução", report.date.split('-').reverse().join('/'), margin, y, contentWidth * 0.25, 12);
  drawCell("Início", report.startTime, margin + (contentWidth * 0.25), y, contentWidth * 0.25, 12);
  drawCell("Fim", report.endTime, margin + (contentWidth * 0.5), y, contentWidth * 0.25, 12);
  
  // Calculo duração
  let duration = "-";
  if (report.startTime && report.endTime) {
     const [h1, m1] = report.startTime.split(':').map(Number);
     const [h2, m2] = report.endTime.split(':').map(Number);
     let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
     if (diff < 0) diff += 24 * 60;
     const dh = Math.floor(diff / 60);
     const dm = diff % 60;
     duration = `${dh}h ${dm}m`;
  }
  drawCell("Duração Estimada", duration, margin + (contentWidth * 0.75), y, contentWidth * 0.25, 12);
  y += 12;

  // 4. EXECUÇÃO TÉCNICA
  y += 4;
  y += drawSectionHeader("Detalhamento da Execução", y);

  // Descrição da OM
  const descHeight = 16;
  drawCell("Descrição da Ordem de Manutenção", report.omDescription, margin, y, contentWidth, descHeight, true);
  y += descHeight;

  // Atividades Executadas (Campo Grande)
  // Calcula altura necessária
  doc.setFontSize(9);
  const activitiesLines = doc.splitTextToSize(report.activityExecuted || '-', contentWidth - 6);
  // Altura mínima de 40, máxima dinâmica até o fim da página com margem
  let activitiesBoxHeight = Math.max(50, (activitiesLines.length * 4) + 15);
  
  // Verifica se cabe na página
  if (y + activitiesBoxHeight > pageHeight - 60) {
      activitiesBoxHeight = pageHeight - y - 60;
  }

  // Caixa Atividades
  doc.setFillColor(colorGrayBg[0], colorGrayBg[1], colorGrayBg[2]);
  doc.rect(margin, y, contentWidth, activitiesBoxHeight, 'F'); // Fundo cinza claro
  drawCell("Atividades Executadas / Procedimentos Realizados", "", margin, y, contentWidth, activitiesBoxHeight); // Borda e Label
  
  // Texto das atividades
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
  doc.text(activitiesLines, margin + 3, y + 10);
  
  y += activitiesBoxHeight;

  // 5. STATUS E CONTROLE
  y += 4;
  y += drawSectionHeader("Status & Controle", y);

  // Cria mini cards para status
  const drawStatusCard = (label: string, status: boolean, x: number, w: number, explanation?: string) => {
    const h = explanation ? 20 : 12;
    doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
    doc.rect(x, y, w, h);
    
    // Checkbox simulado
    doc.setFillColor(status ? colorBlue[0] : 255, status ? colorBlue[1] : 255, status ? colorBlue[2] : 255);
    doc.setDrawColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
    doc.circle(x + 8, y + 6, 2.5, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 16, y + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const statusText = status ? "SIM" : "NÃO";
    doc.text(statusText, x + w - 15, y + 7);

    if (explanation) {
        doc.setFontSize(7);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Obs: ${explanation.substring(0, 45)}`, x + 4, y + 16);
    }
  };

  const colStatusW = contentWidth / 3;
  drawStatusCard("OM Finalizada?", report.isOmFinished, margin, colStatusW);
  drawStatusCard("Houve Desvio?", report.iamoDeviation, margin + colStatusW, colStatusW, report.iamoDeviation ? report.iamoExplanation : undefined);
  drawStatusCard("Pendências?", report.hasPendencies, margin + (colStatusW * 2), colStatusW, report.hasPendencies ? report.pendencyExplanation : undefined);
  
  y += (report.iamoDeviation || report.hasPendencies) ? 20 : 12;

  // Observações Gerais
  if (report.observations) {
      drawCell("Observações Gerais", report.observations, margin, y, contentWidth, 14, true);
      y += 14;
  }

  // 6. RODAPÉ - RESPONSÁVEIS
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(7);
  doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
  doc.text("RESPONSÁVEIS TÉCNICOS", margin, footerY + 4);
  
  doc.setFontSize(10);
  doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(report.technicians || "Não informado", margin, footerY + 10);
  
  doc.setFontSize(7);
  doc.setTextColor(colorTextLabel[0], colorTextLabel[1], colorTextLabel[2]);
  doc.text("Gerado via ReportMaster Offline", pageWidth - margin, footerY + 10, { align: 'right' });


  // --- PÁGINA 2+: FOTOS ---
  if (report.photos && report.photos.length > 0) {
    doc.addPage();
    y = margin;

    drawSectionHeader("Registro Fotográfico", y);
    y += 10;

    const colWidth = (contentWidth - 10) / 2; // 2 colunas com 10mm de gap
    const imgHeight = 70; // Altura fixa para imagem
    const captionHeight = 15; // Altura para legenda
    const itemHeight = imgHeight + captionHeight;
    let col = 0;
    
    for (const photo of report.photos) {
      // Verifica quebra de página
      if (y + itemHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        drawSectionHeader("Registro Fotográfico (Cont.)", y);
        y += 10;
        col = 0;
      }

      const xPos = margin + (col * (colWidth + 10));
      
      // Box Container
      doc.setDrawColor(colorGrayBorder[0], colorGrayBorder[1], colorGrayBorder[2]);
      doc.setFillColor(255, 255, 255);
      doc.rect(xPos, y, colWidth, itemHeight, 'FD');

      // Imagem
      try {
        const imgUrl = typeof photo === 'string' ? photo : photo.url;
        if (imgUrl && imgUrl.startsWith('data:image')) {
             // Ajuste de proporção 'cover' manual seria complexo, usaremos 'contain' básico
             // ou preenchendo o box da imagem. Vamos centralizar.
             doc.addImage(imgUrl, 'JPEG', xPos + 1, y + 1, colWidth - 2, imgHeight - 2);
        }
      } catch (e) {
          doc.setFontSize(8);
          doc.text("Erro na imagem", xPos + 5, y + 20);
      }

      // Legenda (Fundo cinza claro)
      doc.setFillColor(colorGrayBg[0], colorGrayBg[1], colorGrayBg[2]);
      doc.rect(xPos, y + imgHeight, colWidth, captionHeight, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(colorTextValue[0], colorTextValue[1], colorTextValue[2]);
      const captionText = typeof photo === 'string' ? '' : photo.caption || 'Sem legenda';
      const splitCaption = doc.splitTextToSize(captionText, colWidth - 4);
      doc.text(splitCaption, xPos + 2, y + imgHeight + 5);

      col++;
      if (col > 1) {
        col = 0;
        y += itemHeight + 10; // Espaço entre linhas
      }
    }
  }

  const fileName = `Relatorio_${report.omNumber || 'OM'}_${report.date}.pdf`;
  doc.save(fileName);
};
