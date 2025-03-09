interface ErrorProps {
    message: string;
  }
  
export default function Error({ message }: ErrorProps) {
    return (
        <div className="p-4 bg-primary bg-opacity-50 border-2 border-primary text-white rounded-lg shadow-sm">
            <p className="text-sm font-bold">An error occurred:</p>
            <p className="text-sm">{message}</p>
        </div>
    );
}