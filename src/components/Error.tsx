interface ErrorProps {
    message: string;
  }
  
export default function Error({ message }: ErrorProps) {
    return (
        <div className="p-4 bg-destructive/10 border-2 border-destructive/40 text-foreground rounded-lg shadow-sm">
            <p className="text-sm font-bold">An error occurred:</p>
            <p className="text-sm">{message}</p>
        </div>
    );
}
