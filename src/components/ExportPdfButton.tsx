import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportPdfButtonProps {
  content: string;
  title?: string;
  className?: string;
}

export function ExportPdfButton({ content, title = 'SSBGPT Analysis Report', className = '' }: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPdf = async () => {
    if (!content) {
      toast.error('No analysis content to export');
      return;
    }

    setExporting(true);
    try {
      const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-weight: bold;
      color: #1a1a2e;
      background: #fff;
      padding: 48px;
      line-height: 1.7;
      font-size: 13px;
    }
    
    .header {
      text-align: center;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 2px solid #c9a84c;
    }

    .header .logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 12px;
    }
    
    .header h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 28px;
      font-weight: bold;
      color: #1a1a2e;
      letter-spacing: 0.03em;
      margin-bottom: 6px;
    }
    
    .header .subtitle {
      font-size: 11px;
      color: #888;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-family: 'Times New Roman', Times, serif;
      font-weight: bold;
    }
    
    .header .date {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
    }
    
    h1 { font-family: 'Times New Roman', Times, serif; font-size: 22px; font-weight: bold; color: #c9a84c; margin: 28px 0 12px; }
    h2 { font-family: 'Times New Roman', Times, serif; font-size: 18px; font-weight: bold; color: #2e6db4; margin: 24px 0 10px; border-left: 3px solid #c9a84c; padding-left: 12px; }
    h3 { font-family: 'Times New Roman', Times, serif; font-size: 15px; font-weight: bold; color: #1a1a2e; margin: 18px 0 8px; }
    h4 { font-family: 'Times New Roman', Times, serif; font-size: 14px; font-weight: bold; color: #444; margin: 14px 0 6px; }
    
    p { margin: 6px 0; }
    
    strong { color: #1a1a2e; font-weight: bold; }
    
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    
    .separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, #c9a84c, transparent);
      margin: 24px 0;
    }
    
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #aaa;
      letter-spacing: 0.1em;
    }
    
    @media print {
      body { padding: 24px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/ssbgpt-logo.png" alt="SSBGPT" class="logo" />
    <h1>SSBGPT</h1>
    <div class="subtitle">SSB Psychological Assessment Report</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="separator"></div>
  ${convertMarkdownToHtml(content)}
  <div class="footer">
    SSBGPT — 15 OLQ Framework — Confidential Assessment Report
  </div>
</body>
</html>`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }

      printWindow.document.write(styledHtml);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 800);

      toast.success('PDF export ready — use Save as PDF in print dialog');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPdf}
      disabled={exporting || !content}
      className={`glass-button-accent flex items-center gap-2 ${className}`}
    >
      {exporting ? 'Preparing...' : 'Export PDF'}
    </button>
  );
}

function convertMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*\*/g, '') // Remove all *** 
    .split('\n')
    .map((line) => {
      if (line.startsWith('#### ')) return `<h4>${line.slice(5)}</h4>`;
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith('---')) return '<div class="separator"></div>';
      if (/^\d+\.\s/.test(line)) return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      if (line.startsWith('- ') || line.startsWith('• '))
        return `<li>${line.replace(/^[-•]\s/, '')}</li>`;
      if (line.startsWith('| ')) return `<p style="font-family:monospace;font-size:11px;color:#666;">${line}</p>`;
      if (line.trim() === '') return '<br/>';
      const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      return `<p>${processed}</p>`;
    })
    .join('\n');
}