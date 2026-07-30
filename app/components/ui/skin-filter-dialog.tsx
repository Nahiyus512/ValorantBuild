import type { SkinSort } from "@/types/valorant";
import { qualityOptions } from "@/lib/valorant-config";

type SkinFilterDialogProps = {
  qualities: string[];
  sort: SkinSort;
  radioGroupName: string;
  onToggleQuality: (quality: string) => void;
  onSortChange: (sort: SkinSort) => void;
  onClose: () => void;
};

const sortOptions: ReadonlyArray<{ value: SkinSort; label: string }> = [
  { value: "qualityDesc", label: "品质：高到低" },
  { value: "qualityAsc", label: "品质：低到高" },
];

export function SkinFilterDialog({
  qualities,
  sort,
  radioGroupName,
  onToggleQuality,
  onSortChange,
  onClose,
}: SkinFilterDialogProps) {
  return (
    <div
      className="filter-modal"
      role="dialog"
      aria-modal="true"
      aria-label="筛选与排序"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="filter-dialog">
        <h2>筛选</h2>
        <div className="filter-divider"><span /></div>
        <div className="filter-columns">
          <section>
            <h3>按稀有度筛选</h3>
            {qualityOptions.map(option => (
              <label
                className="filter-option"
                key={option.id}
                style={{ "--q": option.color } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  checked={qualities.includes(option.id)}
                  onChange={() => onToggleQuality(option.id)}
                />
                <span className="filter-check" />
                <strong>{option.label}</strong>
                <i />
              </label>
            ))}
          </section>
          <section>
            <h3>排序选择</h3>
            {sortOptions.map(option => (
              <label className="sort-option" key={option.value}>
                <input
                  type="radio"
                  name={radioGroupName}
                  checked={sort === option.value}
                  onChange={() => onSortChange(option.value)}
                />
                <span />
                <strong>{option.label}</strong>
              </label>
            ))}
          </section>
        </div>
        <button className="filter-done" onClick={onClose}>完成</button>
      </div>
    </div>
  );
}
