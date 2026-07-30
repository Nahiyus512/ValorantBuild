type SharePreviewProps = {
  imageUrl: string;
  onClose: () => void;
  onSave: () => void;
  label?: string;
  eyebrow?: string;
};

export function SharePreview({
  imageUrl,
  onClose,
  onSave,
  label = "分享图片预览",
  eyebrow = "SHARE",
}: SharePreviewProps) {
  return (
    <div
      className="share-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="share-preview-dialog">
        <div className="share-preview-heading">
          <div><span>{eyebrow}</span><h2>{label}</h2></div>
          <button type="button" onClick={onClose} aria-label={`关闭${label}`}>×</button>
        </div>
        <div className="share-preview-image">
          <img src={imageUrl} alt={`ValorantBuild ${label}`} />
        </div>
        <button className="share-save-button" type="button" onClick={onSave}>
          保存图片
        </button>
      </div>
    </div>
  );
}
