import { cn } from "@/lib/utils/cn";

interface CardProps {
  as?: "div" | "article" | "section";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  as: Tag = "div",
  interactive = false,
  className,
  children,
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-line bg-surface shadow-card",
        interactive &&
          "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
