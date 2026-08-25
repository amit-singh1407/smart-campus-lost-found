"""Smart matching service for lost and found reports.

This module is intentionally scaffolded to follow the project architecture:
- rule-based comparison
- semantic similarity checks
- score aggregation
- notification generation

Production code should connect to MongoDB and run the matching logic after each
new item report is created.
"""


def calculate_match_score(lost_item, found_item):
    """Compute a similarity score between a lost and found report.

    The real implementation should compare category, brand, color, date, location,
    and text description, then combine rule-based scoring with NLP similarity.
    """
    score = 0
    reasons = []
    for field, points in {"category": 25, "brand": 20, "color": 20, "location": 15}.items():
        lost_value = (lost_item.get(field) or "").lower()
        found_value = (found_item.get(field) or "").lower()
        if lost_value and lost_value == found_value:
            score += points
            reasons.append(f"{field} matches")

    lost_words = set((lost_item.get("item_name") or "").lower().split())
    found_words = set((found_item.get("item_name") or "").lower().split())
    if lost_words and lost_words.intersection(found_words):
        score += 20
        reasons.append("item name overlaps")

    return {
        "score": min(score, 100),
        "status": "POSSIBLE_MATCH" if score >= 40 else "NO_MATCH",
        "reason": ", ".join(reasons) if reasons else "No strong shared details.",
        "lost_item_id": lost_item.get("_id"),
        "found_item_id": found_item.get("_id"),
    }
