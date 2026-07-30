const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export async function asDataUrl(src: string): Promise<string> {
  try {
    const response = await fetch(new URL(src, window.location.href).href, { mode: "cors" });
    if (!response.ok) throw new Error("image");
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return transparentPixel;
  }
}

export async function embedCloneImages(source: ParentNode, clone: ParentNode): Promise<void> {
  const sourceImages = Array.from(source.querySelectorAll("img"));
  const clonedImages = Array.from(clone.querySelectorAll("img"));
  const embedded = await Promise.all(sourceImages.map(image => asDataUrl(image.currentSrc || image.src)));
  clonedImages.forEach((image, index) => {
    image.src = embedded[index] ?? transparentPixel;
  });
}

export function collectPageCss(): string {
  return Array.from(document.styleSheets)
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .filter(rule => !rule.cssText.startsWith("@font-face"))
          .map(rule => rule.cssText);
      } catch {
        return [];
      }
    })
    .join("\n")
    .replaceAll("url(/", `url(${window.location.origin}/`);
}

export async function renderElementToPng(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  const fontDataUrl = await asDataUrl("/fonts/NotoSansSC-subset.ttf");
  const fontFace = `@font-face{font-family:"Noto Sans SC";src:url(${fontDataUrl}) format("truetype");font-weight:900;font-style:normal;font-display:swap;}`;
  const css = collectPageCss();
  const markup = new XMLSerializer()
    .serializeToString(element)
    .replaceAll("url(/", `url(${window.location.origin}/`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${fontFace}\n${css}</style>${markup}</div></foreignObject></svg>`;

  const image = new Image();
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("图片渲染失败"));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("图片编码失败")), "image/png");
  });
}
