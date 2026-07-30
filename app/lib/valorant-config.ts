export const qualityOptions = [
  { id: "Select", label: "精选", color: "#5a9fe2" },
  { id: "Deluxe", label: "豪华", color: "#009587" },
  { id: "Premium", label: "卓越", color: "#d1548d" },
  { id: "Exclusive", label: "传奇", color: "#f5955b" },
  { id: "Ultra", label: "终极", color: "#fad663" },
] as const;

export const homeColumns = [
  { title: "佩枪", items: [["标配", 1], ["短炮", 2], ["狂怒", 3], ["鬼魅", 4], ["追猎", 5], ["正义", 6]] },
  { title: "冲锋枪", items: [["蜂刺", 1], ["骇灵", 2], ["雄鹿", 5], ["判官", 6]], subtitles: [["霰弹枪", 4]] },
  { title: "步枪", items: [["獠犬", 1], ["戍卫", 2], ["幻影", 3], ["狂徒", 4], ["近战武器", 6]], subtitles: [["近战武器", 5]] },
  { title: "狙击枪", items: [["飞将", 1], ["莽侠", 2], ["冥驹", 3], ["战神", 5], ["奥丁", 6]], subtitles: [["机枪", 4]] },
] as const;
