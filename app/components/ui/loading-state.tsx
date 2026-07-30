type LoadingStateProps = {
  message: string;
  error?: boolean;
};

export function LoadingState({ message, error = false }: LoadingStateProps) {
  return (
    <main className="loading">
      <span suppressHydrationWarning>{error ? "!" : "V"}</span>
      <p suppressHydrationWarning>{message}</p>
    </main>
  );
}
