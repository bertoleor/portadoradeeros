import { Card, CardHeader, CardTitle, CardDescription } from './Card';

interface InfoCardProps {
  readonly title: string;
  readonly description: string;
  readonly className?: string;
}

export function InfoCard({ 
  title, 
  description, 
  className = '' 
}: InfoCardProps) {
  return (
    <Card className={`h-full flex flex-col justify-center bg-gray-50/50 border-gray-100 shadow-sm ${className}`.trim()}>
      <CardHeader>
        <CardTitle className="text-3xl font-normal tracking-tight text-black">{title}</CardTitle>
        <CardDescription className="text-gray-600 font-light leading-relaxed text-lg mt-4">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
