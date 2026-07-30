type TopBrandBarProps = {
  onBack?: () => void;
  weaponName?: string;
  onShare: () => void;
  onRank: () => void;
};

export function TopBrandBar({
  onBack,
  weaponName,
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
      <div className="home-mark">ValorantBuild</div>
      <button className="top-export" onClick={onShare}>分享</button>
    </header>
  );
}
