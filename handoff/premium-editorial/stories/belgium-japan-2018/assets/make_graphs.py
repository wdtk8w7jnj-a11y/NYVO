from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle


OUT = Path(__file__).parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

BG = "#09090B"
PANEL = "#131316"
IVORY = "#F4F0E8"
RUBY = "#B7223A"
GRAY = "#A49D94"
MUTED = "#77736D"
LINE = "#47433E"
FIELD = "#0D1210"
FONT = "DejaVu Sans"


def new_canvas(kicker, title, subtitle, footer):
    fig, ax = plt.subplots(figsize=(16, 9), dpi=120)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    ax.text(5, 94, kicker.upper(), color=RUBY, fontsize=12, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(5, 87, title, color=IVORY, fontsize=25, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(5, 80.5, subtitle, color=GRAY, fontsize=12, fontfamily=FONT, va="top")
    if footer:
        ax.text(5, 3.5, footer, color=MUTED, fontsize=8.5, fontfamily=FONT, va="bottom")
    return fig, ax


def panel(ax, x, y, w, h, edge="#38383D", face=PANEL, radius=1.4):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0.0,rounding_size={radius}",
                         facecolor=face, edgecolor=edge, linewidth=1.1)
    ax.add_patch(box)
    return box


def save(fig, filename):
    fig.savefig(OUT / filename, facecolor=BG, dpi=120, bbox_inches=None)
    plt.close(fig)


def graph_sequence():
    fig, ax = new_canvas(
        "NYVO Story / le match en quatre minutes",
        "Une avance qui se construit",
        "Belgique–Japon · début de seconde période",
        "Repères : Japan Football Association · frise schématique, non proportionnelle.",
    )
    panel(ax, 5, 57, 90, 15)
    ax.text(8, 68.5, "ENTRE LES DEUX BUTS", color=GRAY, fontsize=9, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(8, 63, "Hazard touche le poteau droit", color=IVORY, fontsize=17,
            fontweight="bold", fontfamily=FONT, va="top")
    ax.text(91, 62.5, "4 MIN", color=RUBY, fontsize=24, fontweight="bold",
            fontfamily=FONT, ha="right", va="center")
    ax.plot([15, 85], [39, 39], color=LINE, lw=2.4, solid_capstyle="round")
    ax.plot([15, 85], [39, 39], color=RUBY, lw=1.5, alpha=.7, solid_capstyle="round")
    xs = [17, 50, 83]
    for x, color in zip(xs, [IVORY, GRAY, RUBY]):
        ax.add_patch(Circle((x, 39), 1.05, facecolor=BG, edgecolor=color, linewidth=2.2, zorder=3))
    items = [
        (17, "48′", "HARAGUCHI", "Belgique 0–1 Japon", IVORY),
        (50, "ENTRE-TEMPS", "HAZARD", "poteau droit", GRAY),
        (83, "52′", "INUI", "Belgique 0–2 Japon", RUBY),
    ]
    for x, time, name, detail, accent in items:
        ax.text(x, 49, time, color=IVORY, fontsize=13, fontweight="bold",
                fontfamily=FONT, ha="center", va="bottom")
        ax.text(x, 31.5, name, color=IVORY, fontsize=12, fontweight="bold",
                fontfamily=FONT, ha="center", va="top")
        ax.text(x, 26, detail, color=GRAY if accent != RUBY else "#D1B6BA",
                fontsize=9, fontfamily=FONT, ha="center", va="top")
    save(fig, "01-sequence-48-52.png")


def graph_substitutions():
    fig, ax = new_canvas(
        "NYVO Story / repères du match",
        "Le double changement de la 65e",
        "La Belgique est menée 0–2 · chronologie jusqu’au but vainqueur",
        "Temps et buteurs : FIFA · la chronologie ne prouve pas la causalité.",
    )
    panel(ax, 5, 58, 90, 15)
    ax.text(8, 69, "MARTÍNEZ FAIT ENTRER", color=GRAY, fontsize=9, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(8, 65.5, "Fellaini + Chadli", color=IVORY, fontsize=16, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(8, 59.5, "Mertens + Carrasco sortent", color=GRAY, fontsize=9.5,
            fontfamily=FONT, va="top")
    panel(ax, 65, 60, 27, 11, edge="#672034", face="#1B1114", radius=1.2)
    ax.text(68, 67.5, "APRÈS LA 65e", color="#E5A0AB", fontsize=8, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(68, 63.7, "2 / 3", color=IVORY, fontsize=17, fontweight="bold",
            fontfamily=FONT, va="top")
    ax.text(77, 63.7, "buts par les entrants", color=GRAY, fontsize=7.4,
            fontfamily=FONT, va="top")
    ax.text(5, 50, "CHRONOLOGIE · SCORE BELGE", color=GRAY, fontsize=9,
            fontweight="bold", fontfamily=FONT, va="top")
    ax.plot([10, 90], [36, 36], color=LINE, lw=2.4, solid_capstyle="round")
    ax.plot([10, 90], [36, 36], color=RUBY, lw=1.5, alpha=.7, solid_capstyle="round")
    points = [
        (13, "65′", "ENTRÉES", "Fellaini, Chadli", IVORY),
        (36, "69′", "VERTONGHEN", "1–2", RUBY),
        (61, "74′", "FELLAINI", "2–2", RUBY),
        (87, "90+4′", "CHADLI", "3–2", RUBY),
    ]
    for x, time, name, detail, color in points:
        ax.add_patch(Circle((x, 36), 1.0, facecolor=BG, edgecolor=color, linewidth=2.2, zorder=3))
        ax.text(x, 42, time, color=IVORY, fontsize=11.5, fontweight="bold",
                fontfamily=FONT, ha="center", va="bottom")
        ax.text(x, 30, name, color=IVORY, fontsize=9.2, fontweight="bold",
                fontfamily=FONT, ha="center", va="top")
        ax.text(x, 25, detail, color=GRAY, fontsize=8.7, fontfamily=FONT,
                ha="center", va="top")
    panel(ax, 5, 11, 90, 8, edge="#34343A", face=PANEL, radius=1.1)
    ax.text(8, 15, "Lecture chronologique : deux entrants marquent, sans isoler leur effet du collectif.",
            color="#D5CEC3", fontsize=9.5, fontfamily=FONT, va="center")
    save(fig, "02-double-changement.png")


def graph_counter():
    fig, ax = new_canvas(
        "NYVO Story / schéma tactique",
        "Le contre en onze secondes",
        "90+4′ · de la relance de Courtois à la finition de Chadli",
        "",
    )
    # Pitch, halfway line, centre circle and boxes.
    ax.add_patch(FancyBboxPatch((5, 25), 90, 43, boxstyle="round,pad=0.0,rounding_size=1.2",
                                facecolor="#101013", edgecolor="#34343A", linewidth=1.1))
    ax.add_patch(Rectangle((7, 27), 86, 39, facecolor=FIELD, edgecolor="#66615A", linewidth=1.2))
    ax.plot([50, 50], [27, 66], color=LINE, lw=1.2)
    ax.add_patch(Circle((50, 46.5), 5.0, facecolor="none", edgecolor=LINE, lw=1.2))
    ax.add_patch(Rectangle((7, 37), 12, 19, facecolor="none", edgecolor=LINE, lw=1.1))
    ax.add_patch(Rectangle((81, 37), 12, 19, facecolor="none", edgecolor=LINE, lw=1.1))
    ax.add_patch(Rectangle((89, 41), 1.5, 11, facecolor="none", edgecolor=IVORY, lw=1.5))
    # Symbolic progression and low cross.
    routes = [((16, 34), (32, 41), "solid"), ((34, 42), (54, 55), "solid"), ((56, 55), (76, 42), "dashed"), ((76, 42), (88, 49), "dashed")]
    for start, end, style in routes:
        ax.add_patch(FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=14,
                                     color=RUBY, linewidth=1.8,
                                     linestyle="--" if style == "dashed" else "-",
                                     connectionstyle="arc3,rad=0.05"))
    players = [
        ((16, 34), "1", "COURTOIS"), ((33, 42), "2", "DE BRUYNE"),
        ((55, 55), "3", "MEUNIER"), ((76, 42), "4", "LUKAKU"), ((88, 49), "5", "CHADLI"),
    ]
    for (x, y), num, name in players:
        ax.add_patch(Circle((x, y), 1.25, facecolor=IVORY, edgecolor=BG, linewidth=1.2, zorder=4))
        ax.text(x, y, num, color=BG, fontsize=7.5, fontweight="bold", ha="center", va="center", zorder=5)
    # Short numbered captions.
    captions = [
        (8, "1  COURTOIS", "relance au sol"), (27, "2  DE BRUYNE", "progresse, transmet"),
        (47, "3  MEUNIER", "reçoit, centre bas"), (67, "4  LUKAKU", "laisse passer"),
        (84, "5  CHADLI", "conclut"),
    ]
    for x, label, detail in captions:
        ax.text(x, 19, label, color=IVORY, fontsize=8.4, fontweight="bold",
                fontfamily=FONT, ha="center", va="top")
        ax.text(x, 15, detail, color=GRAY, fontsize=7.5, fontfamily=FONT,
                ha="center", va="top")
    panel(ax, 5, 6, 90, 7, edge="#45202A", face="#171316", radius=1.0)
    ax.text(8, 9.5, "11 SECONDES", color="#E5A0AB", fontsize=11, fontweight="bold",
            fontfamily=FONT, va="center")
    ax.text(31, 9.5, "du départ de l’action au but · schéma explicatif, pas une carte de tracking",
            color="#C4BDB3", fontsize=8.8, fontfamily=FONT, va="center")
    save(fig, "03-contre-11-secondes.png")


if __name__ == "__main__":
    graph_sequence()
    graph_substitutions()
    graph_counter()
    print("Créés : 01-sequence-48-52.png, 02-double-changement.png, 03-contre-11-secondes.png")
