type LoadingStateProps = {
  message: string;
  error?: boolean;
};

export function LoadingState({ message, error = false }: LoadingStateProps) {
  return (
    <main className="loading">
      {error ? (
        <span className="loading-error" suppressHydrationWarning>!</span>
      ) : (
        <img
          className="omen-cat-loader"
          src="/omen-cat-loader.gif"
          alt=""
          aria-hidden="true"
        />
      )}
      <p suppressHydrationWarning>{message}</p>
    </main>
  );
}
