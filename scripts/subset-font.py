"""
Subset NotoSansSC-VF.ttf to only the glyphs used by the app.
Reads loadout-data.json and cosmetic-data.json to collect every character,
adds hardcoded UI strings and the full ASCII range, then produces a compact
static (non-variable) font at weight 900 for use in the share/export image
embedding.  Variable fonts do not render reliably inside SVG foreignObject
→ canvas, so we instantiate a single weight axis value.
"""
import json
import os
import sys

from fontTools import subset
from fontTools import varLib
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
SRC_FONT = os.path.join(PUBLIC, "fonts", "NotoSansSC-VF.ttf")
SUBSET_FONT = os.path.join(PUBLIC, "fonts", "NotoSansSC-subset-var.ttf")
OUT_FONT = os.path.join(PUBLIC, "fonts", "NotoSansSC-subset.ttf")

# ── collect every character that can appear on screen ──────────────────
chars: set[str] = set()

# ASCII printable range (covers English names, digits, punctuation, spaces)
chars.update(chr(c) for c in range(0x20, 0x7F))
# Common CJK punctuation
chars.update("，。、：；！？「」『』（）【】《》…—·")

def add_strings(obj):
    """Recursively collect every string value from a JSON structure."""
    if isinstance(obj, str):
        chars.update(obj)
    elif isinstance(obj, list):
        for item in obj:
            add_strings(item)
    elif isinstance(obj, dict):
        for v in obj.values():
            add_strings(v)

for fname in ("loadout-data.json", "cosmetic-data.json"):
    path = os.path.join(PUBLIC, fname)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            add_strings(json.load(f))

# Hardcoded UI text from loadout.tsx (category names, labels, buttons, etc.)
ui_text = """
佩枪冲锋枪霰弹枪步枪狙击枪机枪近战武器
玩家卡面个性表达排行分享
种武器款可用皮肤个挂饰
正在装载款皮肤资源
搜索皮肤挂饰卡面称号喷漆
装备取消装备已装备
筛选排序选择按稀有度筛选完成
精选豪华卓越传奇终极
品质高到低低到高价格
分享图片预览保存图片正在生成分享图片
选择装备位置选择喷漆盘位置上下左右
ValorantBuild
非直接售卖点券无挂饰不使用挂饰
"""
chars.update(ui_text)

char_string = "".join(sorted(chars))
print(f"Collected {len(chars)} unique characters")

# ── step 1: subset the variable font ───────────────────────────────────
subset_args = [
    SRC_FONT,
    f"--text={char_string}",
    f"--output-file={SUBSET_FONT}",
    "--layout-features=*",
    "--no-hinting",
    "--desubroutinize",
    "--drop-tables+=DSIG",
    "--recalc-bounds",
    "--recalc-timestamp",
]
subset.main(subset_args)

# ── step 2: instantiate to a static font at weight 900 ─────────────────
font = TTFont(SUBSET_FONT)
# Pin the weight axis to 900 (Black) and remove the variation tables entirely
instantiateVariableFont(font, {"wght": 900}, inplace=True)
font.save(OUT_FONT)

# Clean up intermediate variable subset
os.remove(SUBSET_FONT)

size_mb = os.path.getsize(OUT_FONT) / (1024 * 1024)
print(f"Static subset font written to {OUT_FONT} ({size_mb:.2f} MB)")
