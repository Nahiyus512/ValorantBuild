type TopBrandBarProps = {
  onBack?: () => void;
  weaponName?: string;
  onClearData: () => void;
  onShare: () => void;
  onRank: () => void;
};

export function TopBrandBar({
  onBack,
  weaponName,
  onClearData,
  onShare,
  onRank,
}: TopBrandBarProps) {
  return (
    <header className="home-bar shared-topbar">
      {onBack && (
        <button className="top-return" onClick={onBack}>
          <span>&lt;</span> 返回
        </button>
      )}
      {weaponName && <span className="top-weapon">{"//"} {weaponName}</span>}
      <button className="top-rank" onClick={onRank}>排行</button>
      <button
        type="button"
        className="home-mark"
        onClick={onClearData}
        aria-label="清空所有缓存数据"
        title="清空数据"
      >
        ValorantBuild
      </button>
      <button className="top-export" onClick={onShare}>分享</button>
    </header>
  );
}
