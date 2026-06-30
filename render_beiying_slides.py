from pathlib import Path
import shutil
import textwrap

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output" / "beiying_ppt_images"
ASSET_DIR = OUT / "assets"
OUT.mkdir(parents=True, exist_ok=True)
ASSET_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080

FONT_SANS = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
FONT_SERIF = "C:/Windows/Fonts/NotoSerifSC-VF.ttf"
FONT_KAI = "C:/Windows/Fonts/simkai.ttf"

BG_SRC = Path(
    "C:/Users/10200/.codex/generated_images/019f167a-6842-74b2-bed2-93e5db58f44e/"
    "ig_0a44332bad99a462016a4332f8b41c8191bb3b35234850a40e.png"
)
BG_DST = ASSET_DIR / "father-platform-background.png"
if BG_SRC.exists() and not BG_DST.exists():
    shutil.copy2(BG_SRC, BG_DST)


def font(path, size):
    return ImageFont.truetype(path, size)


F_TITLE = font(FONT_SERIF, 82)
F_SUBTITLE = font(FONT_SANS, 36)
F_H1 = font(FONT_SERIF, 58)
F_H2 = font(FONT_SANS, 36)
F_BODY = font(FONT_SANS, 32)
F_BODY_SM = font(FONT_SANS, 27)
F_BODY_XS = font(FONT_SANS, 23)
F_KAI = font(FONT_KAI, 34)
F_TABLE = font(FONT_SANS, 25)
F_NUM = font(FONT_SANS, 24)

INK = "#2d2a25"
MUTED = "#6d6255"
PAPER = "#f6f0e7"
PANEL = "#fffaf1"
ACCENT = "#b9632d"
TEAL = "#234a4c"
LINE = "#d8c7ae"
GREEN = "#5d7158"


def cover_bg():
    if BG_DST.exists():
        img = Image.open(BG_DST).convert("RGB")
        img_ratio = img.width / img.height
        target_ratio = W / H
        if img_ratio > target_ratio:
            nh = H
            nw = int(H * img_ratio)
        else:
            nw = W
            nh = int(W / img_ratio)
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - W) // 2
        top = (nh - H) // 2
        img = img.crop((left, top, left + W, top + H))
    else:
        img = Image.new("RGB", (W, H), "#d8d0c4")
    overlay = Image.new("RGBA", (W, H), (24, 28, 26, 120))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    return img


def base():
    img = Image.new("RGB", (W, H), PAPER).convert("RGBA")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 92], fill="#eee2d1")
    d.rectangle([0, H - 44, W, H], fill="#eee2d1")
    d.rectangle([0, 92, 18, H - 44], fill=TEAL)
    d.rectangle([18, 92, 24, H - 44], fill=ACCENT)
    for y in range(132, H - 80, 46):
        d.line([90, y, W - 90, y], fill=(226, 215, 198, 90), width=1)
    return img


def rounded(draw, box, r=18, fill=PANEL, outline=LINE, width=2):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def add_header(img, title, slide_no, section=None):
    d = ImageDraw.Draw(img)
    d.text((84, 26), f"Slide {slide_no:02d}", font=F_NUM, fill=ACCENT)
    d.text((220, 20), title, font=F_H1, fill=INK)
    if section:
        d.text((W - 430, 32), section, font=F_BODY_XS, fill=MUTED)
    d.line([84, 104, W - 84, 104], fill=LINE, width=3)


def wrap_text(draw, text, fnt, max_width):
    lines = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        current = ""
        for ch in para:
            probe = current + ch
            if draw.textbbox((0, 0), probe, font=fnt)[2] <= max_width:
                current = probe
            else:
                if current:
                    lines.append(current)
                current = ch
        if current:
            lines.append(current)
    return lines


def text_block(draw, xy, text, fnt=F_BODY, fill=INK, max_width=700, line_gap=14, bullet=False):
    x, y = xy
    for item in text:
        prefix = "• " if bullet else ""
        lines = wrap_text(draw, prefix + item, fnt, max_width)
        for i, line in enumerate(lines):
            draw.text((x, y), line, font=fnt, fill=fill)
            y += fnt.size + line_gap
        y += 10
    return y


def label(draw, box, text, fill=TEAL):
    draw.rounded_rectangle(box, radius=12, fill=fill)
    tw = draw.textbbox((0, 0), text, font=F_BODY_XS)
    draw.text((box[0] + (box[2] - box[0] - (tw[2] - tw[0])) / 2, box[1] + 10), text, font=F_BODY_XS, fill="white")


slides = []


def slide1():
    img = cover_bg()
    d = ImageDraw.Draw(img)
    d.rectangle([1020, 0, W, H], fill=(12, 22, 22, 122))
    d.text((1080, 245), "背  影", font=font(FONT_SERIF, 128), fill="#fff6e8")
    d.line([1088, 400, 1540, 400], fill="#d28b4d", width=5)
    d.text((1090, 430), "朱自清", font=font(FONT_SERIF, 54), fill="#f3e3c9")
    d.text((1092, 515), "在一个背影里，读懂沉默的父爱", font=F_SUBTITLE, fill="#f3e3c9")
    d.text((1092, 860), "初三语文 · 经典散文精读", font=F_BODY_SM, fill="#dfc9aa")
    return img


def slide2():
    img = base()
    add_header(img, "导入：你记得父母的哪个背影？", 2, "情境唤醒")
    d = ImageDraw.Draw(img)
    rounded(d, [126, 178, 1794, 880], 22)
    d.text((190, 235), "有没有一个瞬间，你忽然发现：", font=font(FONT_SERIF, 52), fill=TEAL)
    d.text((190, 330), "父母也会疲惫、笨拙、变老？", font=font(FONT_SERIF, 66), fill=ACCENT)
    items = ["放学时，父母转身离开的背影", "车站里，一再叮嘱后的背影", "雨夜中，撑伞走在前面的背影", "医院走廊里，强装镇定的背影"]
    text_block(d, (230, 470), items, F_BODY, max_width=760, bullet=True)
    rounded(d, [1080, 455, 1650, 735], 18, fill="#f0eadf")
    d.text((1130, 500), "课堂活动", font=F_H2, fill=TEAL)
    text_block(d, (1130, 570), ["用一句话写下“我见过的一个背影”。", "任选两三位同学分享。"], F_BODY_SM, max_width=460, bullet=True)
    return img


def slide3():
    img = base()
    add_header(img, "作者与背景", 3, "知人论世")
    d = ImageDraw.Draw(img)
    rounded(d, [110, 170, 860, 875], 18)
    d.text((165, 225), "朱自清", font=font(FONT_SERIF, 72), fill=TEAL)
    text_block(d, (170, 335), ["现代散文家、诗人、学者。", "代表作：《背影》《荷塘月色》《春》等。", "语言朴素清新，情感真挚含蓄。"], F_BODY, max_width=610, bullet=True)
    rounded(d, [970, 170, 1810, 875], 18)
    d.text((1025, 225), "创作背景", font=font(FONT_SERIF, 62), fill=TEAL)
    text_block(d, (1030, 330), ["《背影》写于1925年。", "文章由父亲来信触发回忆。", "信中提到身体衰弱、境况不佳。", "作者回忆八年前浦口车站送别的往事。"], F_BODY, max_width=670, bullet=True)
    d.text((1030, 720), "理解提示：这不是一次简单送别，而是多年后在思念与愧悔中重新读懂父亲。", font=F_KAI, fill=ACCENT)
    return img


def slide4():
    img = base()
    add_header(img, "整体感知：文章写了什么？", 4, "结构梳理")
    d = ImageDraw.Draw(img)
    xs = [150, 560, 970, 1380]
    titles = ["开篇设疑", "回忆往事", "望父买橘", "别后思念"]
    desc = ["最不能忘记\n的是父亲背影", "祖母去世\n父亲赋闲\n家境衰败", "父亲穿铁道\n爬月台\n为我买橘", "读父亲来信\n泪光中再现\n背影"]
    for i, x in enumerate(xs):
        rounded(d, [x, 220, x + 330, 550], 18, fill="#fff8ec")
        d.ellipse([x + 118, 250, x + 212, 344], fill=TEAL)
        d.text((x + 148, 268), str(i + 1), font=F_H2, fill="white")
        d.text((x + 70, 385), titles[i], font=F_H2, fill=ACCENT)
        for j, line in enumerate(desc[i].split("\n")):
            d.text((x + 55, 445 + j * 38), line, font=F_BODY_XS, fill=INK)
        if i < 3:
            d.line([x + 340, 385, x + 395, 385], fill=ACCENT, width=6)
            d.polygon([(x + 395, 385), (x + 372, 370), (x + 372, 400)], fill=ACCENT)
    rounded(d, [210, 670, 1710, 850], 18, fill="#f0eadf")
    d.text((270, 715), "主要内容", font=F_H2, fill=TEAL)
    d.text((455, 715), "文章通过回忆父亲送“我”上车并为“我”买橘子的往事，表现深沉含蓄的父爱，", font=F_BODY_SM, fill=INK)
    d.text((455, 765), "也写出“我”对父亲由不理解到感动、愧悔、思念的变化。", font=F_BODY_SM, fill=INK)
    return img


def slide5():
    img = base()
    add_header(img, "精读起点：为什么偏偏是“买橘”？", 5, "问题牵引")
    d = ImageDraw.Draw(img)
    rounded(d, [132, 190, 1788, 848], 24)
    d.text((200, 260), "买橘子，本是一件小事。", font=font(FONT_SERIF, 58), fill=TEAL)
    d.text((200, 360), "朱自清为什么写得这样细？", font=font(FONT_SERIF, 70), fill=ACCENT)
    text_block(d, (240, 500), ["父亲本可以让脚夫去买，却坚持亲自去。", "他没有说“我爱你”，只是笨拙而吃力地行动。", "小小橘子里，装着父亲的体贴、牵挂与不放心。"], F_BODY, max_width=1200, bullet=True)
    d.text((240, 735), "课堂追问：一件“小事”为什么能写出“大爱”？", font=F_KAI, fill=GREEN)
    return img


def slide6():
    img = base()
    add_header(img, "精读品析：父亲的外貌描写", 6, "细节铺垫")
    d = ImageDraw.Draw(img)
    words = ["黑布小帽", "黑布大马褂", "深青布棉袍", "肥胖的身子"]
    for i, w in enumerate(words):
        x = 160 + i * 425
        rounded(d, [x, 210, x + 330, 335], 16, fill="#efe6d6")
        d.text((x + 45, 248), w, font=F_H2, fill=TEAL)
    rounded(d, [170, 450, 860, 800], 18)
    d.text((225, 500), "写出了什么？", font=F_H2, fill=ACCENT)
    text_block(d, (230, 575), ["色彩暗沉：黑、深青，压抑沉重。", "衣着朴素：困顿中的父亲。", "身体肥胖：为后文攀爬艰难作铺垫。"], F_BODY_SM, max_width=540, bullet=True)
    rounded(d, [990, 450, 1750, 800], 18)
    d.text((1045, 500), "思考", font=F_H2, fill=ACCENT)
    d.text((1045, 580), "如果删去“肥胖的身子”，", font=F_BODY, fill=INK)
    d.text((1045, 635), "后面父亲买橘的动作", font=F_BODY, fill=INK)
    d.text((1045, 690), "还会不会这样打动人？", font=F_BODY, fill=INK)
    return img


def slide7():
    img = base()
    add_header(img, "精读重点：望父买橘动作分析", 7, "表格对比")
    d = ImageDraw.Draw(img)
    x0, y0 = 100, 175
    colw = [420, 610, 610]
    rowh = [72, 126, 126, 126, 126, 126]
    headers = ["父亲的动作", "表现出的艰难", "“我”的感受"]
    rows = [
        ["蹒跚地走到铁道边", "年老体胖，行动迟缓", "开始注意到父亲的不易"],
        ["慢慢探身下去", "小心、吃力，也有危险", "心里不安，感到担忧"],
        ["两手攀着上面", "必须借助手臂力量支撑", "被父亲的艰难触动"],
        ["两脚再向上缩", "动作笨拙，却仍坚持", "感到酸楚、心疼"],
        ["肥胖的身子向左微倾", "身体失衡，爬得非常吃力", "“我的泪很快地流下来了”"],
    ]
    d.rounded_rectangle([x0, y0, x0 + sum(colw), y0 + sum(rowh)], radius=18, fill=PANEL, outline=LINE, width=3)
    x = x0
    for i, h in enumerate(headers):
        d.rectangle([x, y0, x + colw[i], y0 + rowh[0]], fill=TEAL)
        d.text((x + 28, y0 + 18), h, font=F_BODY_SM, fill="white")
        x += colw[i]
    y = y0 + rowh[0]
    for r, row in enumerate(rows):
        x = x0
        fill = "#fffaf1" if r % 2 == 0 else "#f4ecdf"
        d.rectangle([x0, y, x0 + sum(colw), y + rowh[r + 1]], fill=fill)
        for c, cell in enumerate(row):
            lines = wrap_text(d, cell, F_TABLE, colw[c] - 54)
            for j, line in enumerate(lines[:3]):
                d.text((x + 26, y + 30 + j * 34), line, font=F_TABLE, fill=ACCENT if c == 0 else INK)
            d.line([x, y0, x, y0 + sum(rowh)], fill=LINE, width=2)
            x += colw[c]
        d.line([x0, y, x0 + sum(colw), y], fill=LINE, width=2)
        y += rowh[r + 1]
    d.line([x0 + sum(colw), y0, x0 + sum(colw), y0 + sum(rowh)], fill=LINE, width=2)
    d.text((120, 925), "设计意图：把“动作描写”与“情感变化”对应起来，读出细节里的父爱。", font=F_BODY_SM, fill=GREEN)
    return img


def slide8():
    img = base()
    add_header(img, "精读追问：这些动词为什么不能换？", 8, "语言品味")
    d = ImageDraw.Draw(img)
    pairs = [("蹒跚", "不只是“走”，写出步履不稳。"), ("探身", "写出小心试探，也写出危险。"), ("攀", "必须抓住支撑物，写出吃力。"), ("缩", "身体笨重，动作艰难。"), ("微倾", "细小姿态，让艰难可见。")]
    for i, (w, exp) in enumerate(pairs):
        y = 185 + i * 145
        rounded(d, [140, y, 410, y + 96], 18, fill="#efe6d6")
        d.text((225, y + 22), w, font=F_H2, fill=ACCENT)
        d.text((480, y + 26), exp, font=F_BODY, fill=INK)
    rounded(d, [1035, 235, 1725, 785], 18, fill="#f0eadf")
    d.text((1090, 290), "课堂活动", font=F_H2, fill=TEAL)
    text_block(d, (1095, 365), ["把原文动词换成“走、下、爬、抬、斜”。", "比较表达效果。", "结论：不夸张，却让读者看见父亲每一次吃力。"], F_BODY_SM, max_width=520, bullet=True)
    return img


def slide9():
    img = base()
    add_header(img, "“我”的几次流泪", 9, "情感线索")
    d = ImageDraw.Draw(img)
    points = [
        ("第一次", "祖母去世、家境惨淡", "因悲哀而流泪"),
        ("第二次", "望见父亲买橘的背影", "因感动、心疼而流泪"),
        ("第三次", "父亲离去，再看背影", "因离别而流泪"),
        ("第四次", "读父亲来信，想到衰老", "因思念与愧悔而流泪"),
    ]
    for i, (n, scene, feeling) in enumerate(points):
        y = 200 + i * 165
        d.ellipse([160, y, 260, y + 100], fill=ACCENT if i == 1 else TEAL)
        d.text((183, y + 30), str(i + 1), font=F_H2, fill="white")
        d.text((310, y + 4), n, font=F_H2, fill=ACCENT)
        d.text((310, y + 54), scene, font=F_BODY, fill=INK)
        d.text((970, y + 54), feeling, font=F_BODY, fill=GREEN)
    d.text((260, 910), "追问：哪一次流泪最能表现“我”真正读懂父亲？为什么？", font=F_KAI, fill=ACCENT)
    return img


def slide10():
    img = base()
    add_header(img, "难点突破：从“聪明过分”到潸然泪下", 10, "理解变化")
    d = ImageDraw.Draw(img)
    left = ["年轻时的“我”", "自以为懂事", "觉得父亲的话和安排有些多余", "“聪明过分”其实是成年后的自责"]
    right = ["后来的“我”", "读到父亲来信", "“大约大去之期不远矣”", "意识到父亲衰老、生命将尽"]
    rounded(d, [120, 185, 850, 640], 20)
    d.text((185, 245), left[0], font=F_H2, fill=TEAL)
    text_block(d, (190, 330), left[1:], F_BODY_SM, max_width=560, bullet=True)
    rounded(d, [1070, 185, 1800, 640], 20)
    d.text((1135, 245), right[0], font=F_H2, fill=TEAL)
    text_block(d, (1140, 330), right[1:], F_BODY_SM, max_width=560, bullet=True)
    d.line([880, 405, 1040, 405], fill=ACCENT, width=8)
    d.polygon([(1040, 405), (1005, 380), (1005, 430)], fill=ACCENT)
    rounded(d, [265, 730, 1655, 885], 18, fill="#f0eadf")
    d.text((325, 775), "情感变化：不耐烦、嫌父亲迂 → 感动 → 惦念 → 愧悔、思念、真正理解父爱", font=F_BODY, fill=INK)
    return img


def slide11():
    img = base()
    add_header(img, "写法总结：白描与以小见大", 11, "方法迁移")
    d = ImageDraw.Draw(img)
    rounded(d, [130, 200, 850, 805], 20)
    d.text((190, 260), "白描手法", font=font(FONT_SERIF, 58), fill=TEAL)
    text_block(d, (195, 370), ["不浓墨重彩，不直接喊情感。", "用朴素语言写衣着、动作、背影。", "看似平淡，却真实有力。"], F_BODY, max_width=560, bullet=True)
    rounded(d, [1030, 200, 1750, 805], 20)
    d.text((1090, 260), "以小见大", font=font(FONT_SERIF, 58), fill=TEAL)
    text_block(d, (1095, 370), ["写的是“买橘子”这一件小事。", "表现的是深沉、隐忍、笨拙而伟大的父爱。", "一个背影，写出亲情、岁月与人生无常。"], F_BODY, max_width=560, bullet=True)
    d.text((270, 910), "课堂活动：找一句最“平淡”却最打动人的句子，说说它为什么有力量。", font=F_KAI, fill=ACCENT)
    return img


def slide12():
    img = base()
    add_header(img, "拓展延伸：寻找生活中的“背影”", 12, "生活链接")
    d = ImageDraw.Draw(img)
    rounded(d, [120, 185, 1780, 835], 22)
    d.text((190, 245), "活动：我记忆中的一个背影", font=font(FONT_SERIF, 58), fill=TEAL)
    prompts = ["那是谁的背影？", "当时发生了什么？", "你当时怎么想？", "现在再想，你有什么新的理解？"]
    for i, p in enumerate(prompts):
        x = 210 + (i % 2) * 780
        y = 385 + (i // 2) * 170
        rounded(d, [x, y, x + 660, y + 110], 16, fill="#f4ecdf")
        d.text((x + 40, y + 32), p, font=F_BODY, fill=INK)
    d.text((210, 730), "流程：静默回忆1分钟 → 写下3个关键词：人物、动作、感受 → 小组交流分享。", font=F_BODY_SM, fill=GREEN)
    return img


def slide13():
    img = base()
    add_header(img, "课后作业：亲情小练笔", 13, "表达训练")
    d = ImageDraw.Draw(img)
    rounded(d, [135, 190, 860, 820], 20)
    d.text((200, 250), "题目任选其一", font=F_H2, fill=TEAL)
    text_block(d, (205, 345), ["《那个背影，我一直记得》", "《我终于读懂了你》", "《藏在小事里的爱》"], F_BODY, max_width=560, bullet=True)
    rounded(d, [1000, 190, 1765, 820], 20)
    d.text((1065, 250), "写作要求", font=F_H2, fill=TEAL)
    text_block(d, (1070, 345), ["选择一个真实生活细节。", "至少写一个动作描写。", "不空喊“爱”，用具体场景表现亲情。", "300至500字。"], F_BODY, max_width=600, bullet=True)
    d.text((220, 920), "结束语：有些爱不善表达，却一直在背影里等我们读懂。", font=F_KAI, fill=ACCENT)
    return img


slides = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12, slide13]


for i, maker in enumerate(slides, start=1):
    img = maker().convert("RGB")
    img.save(OUT / f"slide_{i:02d}.png", quality=95)

print(f"Rendered {len(slides)} slides to {OUT}")
