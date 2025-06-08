type ErrorMessageProps = {
  children: React.ReactNode;
};

export default function ErrorMessage({ children }: ErrorMessageProps) {
  return <p className="text-red-500 text-sm font-light">{children}</p>;
}
