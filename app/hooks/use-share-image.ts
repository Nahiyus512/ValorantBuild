import { useCallback, useEffect, useState } from "react";

export function useShareImage(filename: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const showBlob = useCallback((blob: Blob) => {
    setImageUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(blob);
    });
  }, []);

  const close = useCallback(() => {
    setImageUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }, []);

  const save = useCallback(() => {
    if (!imageUrl) return;
    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = filename;
    anchor.click();
  }, [filename, imageUrl]);

  return { imageUrl, generating, setGenerating, showBlob, close, save };
}
