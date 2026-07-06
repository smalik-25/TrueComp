"""Curated taxonomy for entity resolution (hand-built reference).

Archive and avant-garde menswear has no canonical identifiers, so resolution
leans on this seed: brand aliases, per-brand model names, archetype vocabulary,
and season-code patterns. It is intentionally incomplete and covers the in-scope
brands first. Grow it as the residual unmatched set shows what is missing.
"""
from __future__ import annotations

import re

# Canonical brand -> alias substrings (already in brand_norm form: lowercase,
# punctuation collapsed to spaces). Match is substring-first, then fuzzy.
BRAND_ALIASES: dict[str, list[str]] = {
    # archive / avant-garde core listed first, so a collab title resolves to the
    # archive label rather than the mainstream one it was paired with
    "Rick Owens": ["rick owens", "rick owen", "rickowens", "drkshdw", "ricks owens"],
    "Maison Margiela": [
        "maison margiela", "margiela", "maison martin margiela", "mm6", "mmm",
    ],
    "Number (N)ine": ["number nine", "number n ine", "numbernine", "nnine"],
    "Undercover": ["undercover", "undercoverism", "jun takahashi"],
    "Comme des Garcons": [
        "comme des garcons", "cdg", "homme plus", "junya watanabe", "junya",
        "ganryu", "play",
    ],
    "Boris Bidjan Saberi": ["boris bidjan saberi", "bbs", "boris bidjan"],
    "Enfants Riches Deprimes": [
        "enfants riches deprimes", "enfant riches deprimes", "enfant riche deprimes",
        "erd",
    ],
    "Raf Simons": ["raf simons", "raf simon", "raf"],
    "Yohji Yamamoto": ["yohji yamamoto", "yohji", "y 3", "pour homme"],
    "Helmut Lang": ["helmut lang", "helmut"],
    "Carol Christian Poell": ["carol christian poell", "ccp", "poell"],
    "Ann Demeulemeester": ["ann demeulemeester", "demeulemeester"],
    "Julius": ["julius", "julius 7", "julius7"],
    "Guidi": ["guidi"],
    "Kiko Kostadinov": ["kiko kostadinov", "kiko"],
    "Craig Green": ["craig green"],
    "Our Legacy": ["our legacy"],
    "1017 Alyx 9SM": ["alyx", "1017 alyx", "1017 alyx 9sm"],
    "Bottega Veneta": ["bottega veneta", "bottega"],
    "Issey Miyake": ["issey miyake", "issey", "homme plisse", "plisse"],
    "Kapital": ["kapital", "kountry"],
    "Needles": ["needles", "nepenthes"],
    "Neighborhood": ["neighborhood", "nbhd"],
    "Visvim": ["visvim"],
    "Mastermind Japan": ["mastermind japan", "mastermind"],
    "Mihara Yasuhiro": ["mihara yasuhiro", "maison mihara", "mihara"],
    "Hysteric Glamour": ["hysteric glamour", "hysterics"],
    "Blackmeans": ["blackmeans"],
    "Wales Bonner": ["wales bonner"],
    "White Mountaineering": ["white mountaineering"],
    "Nanamica": ["nanamica"],
    "Engineered Garments": ["engineered garments"],
    "South2 West8": ["south2 west8", "s2w8", "south to west"],
    "Hender Scheme": ["hender scheme"],
    "Acne Studios": ["acne studios", "acne"],
    "Jil Sander": ["jil sander"],
    "Stone Island": ["stone island", "stone isl"],
    "C.P. Company": ["cp company", "c p company"],
    "Vetements": ["vetements"],
    "Martine Rose": ["martine rose"],
    "Roa": ["roa"],
    "Salomon": ["salomon"],
    "Arcteryx": ["arcteryx", "arc teryx", "veilance"],
    "Moncler": ["moncler"],
    "Thom Browne": ["thom browne"],
    "The Row": ["the row"],
    "Vivienne Westwood": ["vivienne westwood", "westwood"],
    "Saint Laurent": ["saint laurent", "ysl", "yves saint laurent"],
    "Dior": ["dior", "dior homme"],
    "Givenchy": ["givenchy"],
    "Prada": ["prada"],
    "Miu Miu": ["miu miu"],
    "Gucci": ["gucci"],
    "Balenciaga": ["balenciaga"],
    "Louis Vuitton": ["louis vuitton", "lv"],
    "Chanel": ["chanel"],
    "Off-White": ["off white"],
    "Chrome Hearts": ["chrome hearts"],
    "Gallery Dept": ["gallery dept", "gallery department"],
    "Saint Michael": ["saint michael"],
    "Aime Leon Dore": ["aime leon dore", "ald"],
    "Human Made": ["human made"],
    "Jjjjound": ["jjjjound"],
    "Bape": ["bape", "a bathing ape", "bathing ape"],
    "Supreme": ["supreme"],
    "Stussy": ["stussy"],
    "Braindead": ["braindead", "brain dead"],
    "Carhartt": ["carhartt", "carhartt wip"],
    "Evisu": ["evisu"],
    "Beams": ["beams"],
    "Takashi Murakami": ["takashi murakami", "murakami"],
    "Hyein Seo": ["hyein seo"],
    "Oakley": ["oakley"],
    "Seiko": ["seiko"],
    "Deal Design": ["deal design"],
    "Haven Court": ["haven court"],
    "Karsten Kroening": ["karsten kroening"],
    "Kraftwork": ["kraftwork"],
    "After-Hrs": ["after hrs"],
    "86 West": ["86 west"],
}

# Per-brand model name -> match tokens (lowercased). Kept small and expandable.
BRAND_MODELS: dict[str, dict[str, list[str]]] = {
    "Rick Owens": {
        "Ramones": ["ramones", "ramone", "sneaks"],
        "Geobasket": ["geobasket", "geo basket"],
        "Geth": ["geth runner", "geth hi", "geth sneaker"],
        "Dunk": ["ro dunk", "dunk"],
        "Bumper": ["bumper", "mega bumper"],
        "Turbodrk": ["turbodrk", "turbo drk"],
        "Turbowpn": ["turbowpn", "turbo weapon", "turboweapon"],
        "Detroit Cut": ["detroit"],
        "Torrance Cut": ["torrance"],
        "Creatch": ["creatch"],
        "Pods": ["pod cargo", "creatch cargo pod", "cargo pods"],
        "Tecuatl": ["tecuatl"],
        "Bozo": ["bozo"],
        "Mastodon": ["mastodon"],
        "Performa": ["performa"],
        "Bauhaus": ["bauhaus", "jumbo bauhaus", "stooges"],
        "Naska": ["naska"],
        "Tommy Tee": ["tommy tee", "tommy t", "tommy long"],
    },
    "Maison Margiela": {
        "GAT": ["gat", "gats", "german army trainer", "replica sneaker", "replica gat"],
        "Future": ["future", "futures", "trashed future"],
        "Replica": ["replica"],
        "Tabi": ["tabi", "tabis", "split toe", "cloven"],
        "5AC": ["5ac"],
    },
    "Balenciaga": {
        "Triple S": ["triple s", "triples", "triple s trainer", "triple s sneaker"],
        "Track": ["track trainer", "track sneaker", "track runner", "track 2", "track 3"],
        "Speed": ["speed trainer", "speed sock", "speed sneaker", "speed runner", "speed"],
        "Defender": ["defender"],
        "Political Campaign": ["political campaign", "campaign logo"],
    },
    "Saint Laurent": {
        "Wyatt": ["wyatt"],
        "L01": ["l01", "l 01"],
        "Teddy": ["teddy jacket", "teddy varsity", "teddy bomber"],
        "Chelsea": ["chelsea boot", "dakota", "jodhpur"],
    },
    "Dior": {
        "Luster": ["luster", "lustre", "waxed denim", "clawmark", "claw mark", "19cm"],
        "Navigate": ["navigate"],
        "M65": ["m65", "m 65"],
    },
    "Vetements": {
        "DHL": ["dhl"],
        "Reworked Denim": ["reworked denim", "spliced jean", "reworked jean"],
    },
    "Undercover": {
        "Scab": ["scab"],
        "Chaos Balance": ["chaos balance", "balance chaos"],
        "Daybreak": ["daybreak"],
        "Overbreak": ["overbreak"],
        "Bear Tee": ["bear tee"],
        "Witch's Cell Division": ["witch", "wcd"],
    },
    "Raf Simons": {
        "Ozweego": ["ozweego", "oswego"],
        "Stan Smith": ["stan smith"],
        "Bomber": ["bomber"],
        "Riot": ["riot"],
        "Virginia Creeper": ["virginia creeper"],
    },
    "Carol Christian Poell": {
        "Goodyear": ["goodyear"],
        "Drip Boot": ["drip"],
        "Dauber": ["dauber"],
    },
    "Number (N)ine": {
        "Give Peace a Chance": ["give peace a chance", "gpac", "patch denim", "patch jeans"],
        "Double Skull": ["double skull"],
        "Mickey Vedder": ["mickey vedder"],
        "Hybrid": ["high streets hybrid", "hybrid jacket"],
        "Napoleon": ["napoleon jacket"],
    },
    "Salomon": {
        "XT-6": ["xt 6", "xt6"],
        "Speedcross": ["speedcross"],
        "ACS Pro": ["acs pro", "acs"],
        "XT-4": ["xt 4", "xt4"],
    },
    "Visvim": {
        "FBT": ["fbt"],
        "Skagway": ["skagway"],
        "Christo": ["christo"],
    },
}

# Archetype vocabulary, checked most-specific first. First hit wins.
ARCHETYPE_TOKENS: list[tuple[str, list[str]]] = [
    ("denim", ["denim", "jeans", "jean"]),
    ("tailoring", [
        "suit", "suiting", "sport coat", "sportcoat", "tuxedo", "two piece",
    ]),
    ("footwear", [
        "sneaker", "sneakers", "boot", "boots", "trainer", "shoe", "shoes",
        "high top", "hightop", "high-top", "low top", "lowtop", "hi top",
        "loafer", "loafers", "mule", "mules", "slip on", "slipon", "slip-on",
        "derby", "oxford", "oxfords", "clog", "clogs", "sandal", "sandals",
        "moccasin", "geobasket",
        # collab-sneaker model names that read as footwear on their own
        "stan smith", "daybreak", "ozweego", "oswego", "turbowpn", "runner",
    ]),
    ("outerwear", [
        "jacket", "coat", "parka", "puffer", "bomber", "blazer", "peacoat",
        "vest", "gilet", "waistcoat", "overcoat", "trench",
    ]),
    ("knit", [
        "knit", "knitwear", "sweater", "cardigan", "turtleneck", "jumper",
        "jumpers",
    ]),
    ("top", [
        "hoodie", "pullover", "sweatshirt", "crewneck", "tee", "t shirt",
        "tshirt", "shirt", "shirts", "longsleeve", "longsleve", "long sleeve",
        "long-sleeve", "jersey", "polo", "henley", "tank",
    ]),
    ("pants", [
        "cargo", "cargos", "trouser", "trousers", "pants", "pant", "shorts",
        "sweatpants", "sweatpant", "joggers", "chino", "chinos", "slacks",
    ]),
    ("accessory", [
        "bag", "backpack", "wallet", "belt", "scarf", "hat", "cap", "ring",
        "necklace", "tote", "pouch", "sunglasses", "beanie", "gloves", "socks",
    ]),
]

# Model -> implied archetype, for models whose name alone fixes the garment.
# Only unambiguous models belong here: the resolver treats this as authoritative
# over a keyword-derived archetype, so a model that spans categories (Replica is a
# whole capsule, footwear and apparel; Political Campaign is a hoodie or a tee)
# must be left out and resolved from the title tokens instead.
MODEL_ARCHETYPE: dict[str, str] = {
    # footwear
    "Ramones": "footwear",
    "Geobasket": "footwear",
    "Geth": "footwear",
    "Dunk": "footwear",
    "Bumper": "footwear",
    "Turbodrk": "footwear",
    "Turbowpn": "footwear",
    "Tecuatl": "footwear",
    "Bozo": "footwear",
    "Mastodon": "footwear",
    "GAT": "footwear",
    "Future": "footwear",
    "Tabi": "footwear",
    "Triple S": "footwear",
    "Track": "footwear",
    "Speed": "footwear",
    "Defender": "footwear",
    "Wyatt": "footwear",
    "Chelsea": "footwear",
    "Navigate": "footwear",
    "Goodyear": "footwear",
    "Drip Boot": "footwear",
    "Ozweego": "footwear",
    "Stan Smith": "footwear",
    "Daybreak": "footwear",
    "Overbreak": "footwear",
    "XT-6": "footwear",
    "XT-4": "footwear",
    "Speedcross": "footwear",
    "ACS Pro": "footwear",
    "FBT": "footwear",
    "Skagway": "footwear",
    "Christo": "footwear",
    # denim
    "Detroit Cut": "denim",
    "Torrance Cut": "denim",
    "Luster": "denim",
    "Give Peace a Chance": "denim",
    "Reworked Denim": "denim",
    # outerwear
    "Bomber": "outerwear",
    "Performa": "outerwear",
    "Bauhaus": "outerwear",
    "Naska": "outerwear",
    "L01": "outerwear",
    "Teddy": "outerwear",
    "M65": "outerwear",
    "Hybrid": "outerwear",
    "Napoleon": "outerwear",
    # tops / graphics
    "DHL": "top",
    "Tommy Tee": "top",
    "Mickey Vedder": "top",
    "Bear Tee": "top",
    # pants / accessory
    "Pods": "pants",
    "5AC": "accessory",
}

# Season codes: SS09, AW04, FW21, also 4-digit years. Normalized to e.g. "SS09".
_SEASON_RE = re.compile(r"\b(SS|AW|FW|PF)\s?(\d{4}|\d{2})\b", re.IGNORECASE)


def season_code(text: str | None) -> str | None:
    if not text:
        return None
    m = _SEASON_RE.search(text)
    if not m:
        return None
    tag = m.group(1).upper()
    year = m.group(2)
    if len(year) == 4:
        year = year[2:]
    return f"{tag}{year}"
