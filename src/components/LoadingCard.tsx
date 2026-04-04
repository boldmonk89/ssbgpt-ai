interface LoadingCardProps {
  message: string;
}

export function LoadingCard({ message }: LoadingCardProps) {
  return (
    <div className="glass-card pulse-loading">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-gold animate-pulse" />
        <p className="font-body text-sm italic text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
