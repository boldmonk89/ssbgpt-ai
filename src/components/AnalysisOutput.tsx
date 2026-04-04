import { ExportPdfButton } from './ExportPdfButton';

interface AnalysisOutputProps {
  content: string;
  title?: string;
}

export function AnalysisOutput({ content, title }: AnalysisOutputProps) {
  if (!content) return null;

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-heading font-bold text-accent mt-5 mb-1.5">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-base font-heading font-bold text-gold mt-6 mb-2 gold-border-left">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-lg font-heading font-bold text-gold mt-6 mb-3">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-heading font-bold text-sm text-accent mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-foreground/85 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-foreground font-semibold">{part.replace(/\*\*/g, '')}</strong>
                : part
            )}
          </p>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 text-sm text-foreground/85 leading-relaxed list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 text-sm text-foreground/85 leading-relaxed list-disc">{line.replace(/^[-•] /, '')}</li>;
      }
      if (line.startsWith('| ')) {
        return <p key={i} className="text-xs font-body text-muted-foreground font-mono">{line}</p>;
      }
      if (line.trim() === '') return <div key={i} className="h-2.5" />;
      return <p key={i} className="text-sm text-foreground/85 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="glass-card scroll-reveal">
      {title && (
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-base font-heading font-bold text-gold gold-border-left">{title}</h3>
          <ExportPdfButton content={content} title={title} />
        </div>
      )}
      {title && <div className="gold-stripe mb-4" />}
      {!title && (
        <div className="flex justify-end mb-3">
          <ExportPdfButton content={content} />
        </div>
      )}
      <div className="font-body text-sm space-y-0.5 max-h-[70vh] overflow-y-auto pr-2">
        {renderContent(content)}
      </div>
    </div>
  );
}
