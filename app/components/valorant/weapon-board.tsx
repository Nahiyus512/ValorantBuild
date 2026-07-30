import { useMemo } from "react";
import { homeColumns } from "@/lib/valorant-config";
import type { Equipped, LoadoutData, Weapon } from "@/types/valorant";

type WeaponBoardProps = {
  data: LoadoutData;
  equipped?: Record<string, Equipped>;
  getWeaponImage: (weapon: Weapon) => string;
  onSelect: (weapon: Weapon) => void;
};

export function WeaponBoard({
  data,
  equipped,
  getWeaponImage,
  onSelect,
}: WeaponBoardProps) {
  const weaponsByName = useMemo(
    () => new Map(data.weapons.map(weapon => [weapon.name, weapon])),
    [data.weapons],
  );
  const buddiesById = useMemo(
    () => new Map(data.buddies.map(buddy => [buddy.id, buddy])),
    [data.buddies],
  );

  return (
    <div className="weapon-board">
      {homeColumns.map(column => (
        <section className="weapon-column" key={column.title}>
          <h2>{column.title}</h2>
          <div className="weapon-column-grid">
            {"subtitles" in column && column.subtitles.map(([label, row]) => (
              <h3 key={label} style={{ gridRow: row }}>{label}</h3>
            ))}
            {column.items.map(([name, row]) => {
              const weapon = weaponsByName.get(name)!;
              const buddyId = equipped?.[weapon.id]?.buddyId;
              const buddy = weapon.category === "Melee"
                ? undefined
                : buddiesById.get(buddyId ?? "");
              return (
                <button
                  className={`weapon-tile${weapon.category === "Melee" ? " melee-tile" : ""}`}
                  style={{ gridRow: row }}
                  key={weapon.id}
                  onClick={() => onSelect(weapon)}
                >
                  <img src={getWeaponImage(weapon)} alt={weapon.name} />
                  {buddy && <img className="tile-buddy" src={buddy.icon} alt="" />}
                  {equipped && <span>{weapon.name}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
