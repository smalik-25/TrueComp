from __future__ import annotations

from resolution import taxonomy
from resolution.resolver import resolve


def test_full_signal_title_high_confidence():
    r = resolve("SS09 Rick Owens Silver Wax Detroit Cut Denim", "rick owens")
    assert r.brand_display == "Rick Owens"
    assert r.model_name == "Detroit Cut"
    assert r.archetype == "denim"
    assert r.season_code == "SS09"
    assert r.confidence == "high"
    assert r.matched
    assert r.canonical_key == "rick owens|denim|detroit cut|ss09"


def test_brand_from_keyword_when_title_omits_it():
    # title carries only a model; brand comes from the seed query
    r = resolve("TURBODRK HI Zebra size 41", "rick owens")
    assert r.brand_display == "Rick Owens"
    assert r.model_name == "Turbodrk"
    assert r.archetype == "footwear"     # model implies footwear
    assert r.confidence == "high"


def test_ebay_margiela_gat():
    r = resolve("Maison Margiela Gats 44 EU", "margiela GATs")
    assert r.brand_display == "Maison Margiela"
    assert r.model_name == "GAT"
    assert r.archetype == "footwear"


def test_archetype_only_is_medium():
    r = resolve("drawstring pods shorts S", "rick owens")
    assert r.brand_display == "Rick Owens"
    assert r.model_name is None
    assert r.archetype == "pants"        # "shorts"
    assert r.confidence == "medium"
    assert r.matched


def test_brand_only_is_not_matched():
    r = resolve("Rick Owens mystery object", "rick owens")
    assert r.brand_display == "Rick Owens"
    assert r.archetype is None
    assert r.model_name is None
    assert r.confidence == "brand_only"
    assert not r.matched
    assert r.canonical_key is None


def test_unresolved_when_no_brand():
    r = resolve("plain grey hoodie", None)
    assert r.brand_display is None
    assert r.confidence == "unresolved"
    assert not r.matched


def test_same_piece_gets_same_key():
    a = resolve("Rick Owens DRKSHDW Vegan Ramones", "rick owens")
    b = resolve("rick owens ramones black", "rick owens ramones")
    assert a.canonical_key == b.canonical_key == "rick owens|footwear|ramones|"


def test_season_normalization():
    assert taxonomy.season_code("Rick Owens SS2009 jacket") == "SS09"
    assert taxonomy.season_code("AW04 bomber") == "AW04"
    assert taxonomy.season_code("no season here") is None


def test_expanded_brand_salomon():
    r = resolve("Salomon XT-6 Black Phantom", "salomon")
    assert r.brand_display == "Salomon"
    assert r.model_name == "XT-6"
    assert r.archetype == "footwear"


def test_expanded_brand_our_legacy():
    r = resolve("Our Legacy Borrowed Bomber Jacket", "our legacy")
    assert r.brand_display == "Our Legacy"
    assert r.archetype in ("outerwear",)  # bomber / jacket


def test_short_alias_needs_word_boundary():
    # "roa" must not fire inside "crossroads"; no brand from that title/keyword
    r = resolve("crossroads graphic hoodie", None)
    assert r.brand_display is None


def test_short_alias_matches_as_word():
    r = resolve("ROA Andreas hiking boot", "roa")
    assert r.brand_display == "Roa"
    assert r.archetype == "footwear"


def test_model_comes_from_title_not_keyword():
    # a "rick owens ramones" search that returns a Geobasket must NOT be tagged
    # Ramones from the keyword; the title decides the model
    r = resolve("Rick Owens Geobasket Black Milk Leather", "rick owens ramones")
    assert r.brand_display == "Rick Owens"
    assert r.model_name == "Geobasket"
    assert r.model_name != "Ramones"
