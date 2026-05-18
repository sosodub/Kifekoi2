interface SectionTitleProps {
  children: React.ReactNode;
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="text-lg font-bold text-gray-900 mb-4 mt-4">{children}</h2>;
}
