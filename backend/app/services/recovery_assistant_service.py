import re
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from flask import current_app
from app.services.matching_engine import MatchingEngine

CATEGORIES_MAP = {
    "electronics": ["laptop", "phone", "macbook", "iphone", "samsung", "charger", "earbuds", "airpods", "headphones", "tablet", "ipad", "calculator", "mouse", "keyboard", "watch"],
    "wallets": ["wallet", "purse", "billfold", "cardholder", "money", "cash"],
    "keys": ["key", "keys", "keychain", "bike key", "room key", "fob"],
    "backpacks": ["backpack", "bag", "tote", "duffel", "satchel", "pouch", "rucksack"],
    "cards": ["id", "id card", "student card", "campus card", "driver license", "atm", "debit card", "credit card", "metro card"],
    "books": ["book", "textbook", "notebook", "folder", "binder", "notes", "diary"],
    "clothing": ["jacket", "hoodie", "coat", "sweater", "cap", "hat", "scarf", "gloves", "umbrella"],
    "bottles": ["bottle", "flask", "thermos", "tumbler", "sipper", "water bottle"],
}

CATEGORY_CANONICAL = {
    "electronics": "Electronics & Laptops",
    "wallets": "Wallets & Purses",
    "keys": "Keys & Keychains",
    "backpacks": "Backpacks & Bags",
    "cards": "Student IDs & Cards",
    "books": "Books & Notebooks",
    "clothing": "Clothing & Apparel",
    "bottles": "Water Bottles & Accessories",
}

CAMPUS_LOCATIONS = [
    "Central Library",
    "Science Complex",
    "Student Union",
    "Cafeteria",
    "Sports Arena",
    "Engineering Block",
    "Auditorium",
    "Hostel",
    "Dormitory",
    "Parking",
    "Gymnasium",
    "Computer Lab",
]

COLORS = [
    "black", "blue", "red", "white", "grey", "gray", "green", "yellow", "brown", "silver", "gold", "pink", "purple", "orange"
]

BRANDS = [
    "apple", "dell", "hp", "lenovo", "samsung", "asus", "acer", "sony", "nike", "adidas", "puma", "casio", "hydro flask", "wildcraft", "boat", "jbl", "oneplus"
]

# Hinglish keyword translations for multilingual campus support
HINGLISH_MAP = {
    "mera": "my", "meri": "my", "mere": "my",
    "kho": "lost", "kho gaya": "lost", "gum": "lost", "bhul": "forgot", "chhut": "left",
    "kal": "yesterday", "aaj": "today", "parso": "day before yesterday",
    "batua": "wallet", "chabi": "key", "basta": "bag", "kitab": "book", "paani": "water",
}


class RecoveryAssistantService:
    @staticmethod
    def parse_user_query(query: str):
        """
        Extracts structured intent: item category, color, brand, location, relative date, and search terms.
        Supports standard English and Hinglish expressions.
        """
        q = query.lower().strip()

        # Check intent type
        is_lost = True
        if any(w in q for w in ["found", "mil gaya", "mila", "recovered", "got"]):
            if not any(w in q for w in ["lost", "kho gaya", "gum", "looking for"]):
                is_lost = False

        # Extract Category
        detected_cat_key = None
        for cat_key, keywords in CATEGORIES_MAP.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", q):
                    detected_cat_key = cat_key
                    break
            if detected_cat_key:
                break
        
        # Check Hinglish words
        if not detected_cat_key:
            if "batua" in q: detected_cat_key = "wallets"
            elif "chabi" in q: detected_cat_key = "keys"
            elif "basta" in q: detected_cat_key = "backpacks"
            elif "kitab" in q: detected_cat_key = "books"

        detected_category = CATEGORY_CANONICAL.get(detected_cat_key, "Others" if not detected_cat_key else "Others")

        # Extract Color
        detected_color = ""
        for c in COLORS:
            if re.search(r"\b" + re.escape(c) + r"\b", q):
                detected_color = c.capitalize()
                break

        # Extract Brand
        detected_brand = ""
        for b in BRANDS:
            if re.search(r"\b" + re.escape(b) + r"\b", q):
                detected_brand = b.capitalize()
                break

        # Extract Location
        detected_location = ""
        for loc in CAMPUS_LOCATIONS:
            if re.search(r"\b" + re.escape(loc.lower()) + r"\b", q):
                detected_location = loc
                break

        # Extract Date
        date_hint = ""
        now = datetime.now(timezone.utc)
        if "yesterday" in q or "kal" in q:
            date_hint = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        elif "today" in q or "aaj" in q:
            date_hint = now.strftime("%Y-%m-%d")
        elif "day before yesterday" in q or "parso" in q:
            date_hint = (now - timedelta(days=2)).strftime("%Y-%m-%d")

        return {
            "is_lost": is_lost,
            "category": detected_category if detected_cat_key else None,
            "color": detected_color,
            "brand": detected_brand,
            "location": detected_location,
            "date": date_hint,
            "raw_query": query,
        }

    @staticmethod
    def assist_recovery(query: str, user_id: str = None):
        """
        Executes interactive recovery guidance: parses user prompt, searches database for opposing items,
        scores candidates, and provides contextual action recommendations.
        """
        db = current_app.db
        parsed = RecoveryAssistantService.parse_user_query(query)
        target_type = "found" if parsed["is_lost"] else "lost"

        # Construct query filters
        search_filter = {"type": target_type, "status": {"$in": ["open", "matched"]}}
        if parsed["category"] and parsed["category"] != "Others":
            search_filter["category"] = parsed["category"]

        candidates = list(db.items.find(search_filter).sort("created_at", -1).limit(50))

        # Fallback if no exact category match found
        if not candidates and parsed["category"]:
            candidates = list(db.items.find({"type": target_type, "status": {"$in": ["open", "matched"]}}).sort("created_at", -1).limit(50))

        # Rank candidates against parsed attributes
        synthetic_query_item = {
            "title": query,
            "category": parsed["category"] or "Others",
            "brand": parsed["brand"],
            "color": parsed["color"],
            "location": parsed["location"] or "Campus",
            "date": parsed["date"],
            "description": query,
        }

        ranked_matches = []
        for doc in candidates:
            eval_res = MatchingEngine.evaluate_pair(
                synthetic_query_item if parsed["is_lost"] else doc,
                doc if parsed["is_lost"] else synthetic_query_item,
            )
            score = eval_res["similarity_score"]
            if score >= 40:  # Include relevant candidates
                from app.services.item_service import ItemService
                public_doc = ItemService._public_item(doc)
                public_doc["similarity_score"] = score
                public_doc["match_tier"] = eval_res["match_tier"]
                ranked_matches.append(public_doc)

        ranked_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_matches = ranked_matches[:6]

        # Generate intelligent response message and next action recommendation
        if top_matches:
            highest_score = top_matches[0]["similarity_score"]
            if highest_score >= 80:
                response_text = f"Great news! I found {len(top_matches)} potential candidate(s) in the campus registry. The highest match is {highest_score}% identical to what you described."
                recommended_action = "view_and_claim"
            else:
                response_text = f"I discovered {len(top_matches)} possible matching item(s) (up to {highest_score}% similarity). Review the matches below to verify if any belong to you."
                recommended_action = "review_matches"
        else:
            response_text = "I couldn't find an exact match currently turned in to the campus lost & found. Don't worry! I recommend filing an official Lost Report right now so our matching engine alerts you the instant it is handed in."
            recommended_action = "create_report"

        # Actionable guidance tips
        guidance_steps = []
        if top_matches:
            guidance_steps.append("Review the candidate items below and select the one that matches your lost item.")
            guidance_steps.append("Be prepared to answer private verification questions (secret marks, contents, lockscreen details).")
            guidance_steps.append("Once verified, security will coordinate the handover and final return process.")
        else:
            guidance_steps.append("Submit an official Lost Item report with brand, color, and unique identifying marks.")
            guidance_steps.append("Enable Smart Watchlist to receive immediate push notifications if someone turns it in.")
            guidance_steps.append("Check in with the Central Campus Security Desk or Library Help Desk.")

        return {
            "parsed_attributes": parsed,
            "response_text": response_text,
            "recommended_action": recommended_action,
            "guidance_steps": guidance_steps,
            "matches": top_matches,
            "matches_count": len(top_matches),
            "status_code": 200,
        }
