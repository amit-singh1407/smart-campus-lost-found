import re
import math
from datetime import datetime, timezone
from bson import ObjectId
from flask import current_app
from app.utils.email_sender import send_match_notification_email

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    _SKLEARN_AVAILABLE = True
except (ImportError, OSError):
    TfidfVectorizer = None
    cosine_similarity = None
    _SKLEARN_AVAILABLE = False


STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
    "was", "with",
}


class MatchingEngine:
    @staticmethod
    def _fallback_text_similarity(text1: str, text2: str) -> float:
        """Compute TF-IDF cosine similarity without compiled ML dependencies."""
        def terms(text):
            words = [word for word in re.findall(r"\w+", text) if word not in STOP_WORDS]
            return words + [f"{words[index]} {words[index + 1]}" for index in range(len(words) - 1)]

        documents = [terms(text1), terms(text2)]
        vocabulary = set(documents[0]).union(documents[1])
        if not vocabulary:
            return 0.0

        vectors = []
        for document in documents:
            counts = {term: document.count(term) for term in vocabulary}
            vector = {}
            for term, count in counts.items():
                document_frequency = sum(term in other for other in documents)
                inverse_document_frequency = math.log(3 / (1 + document_frequency)) + 1
                vector[term] = (1 + math.log(count)) * inverse_document_frequency if count else 0.0
            vectors.append(vector)

        numerator = sum(vectors[0][term] * vectors[1][term] for term in vocabulary)
        denominator = math.sqrt(sum(value * value for value in vectors[0].values())) * math.sqrt(sum(value * value for value in vectors[1].values()))
        return numerator / denominator if denominator else 0.0

    @staticmethod
    def calculate_text_similarity(text1: str, text2: str) -> float:
        """Compute NLP TF-IDF Cosine Similarity between two text descriptions."""
        t1 = (text1 or "").strip().lower()
        t2 = (text2 or "").strip().lower()

        if not t1 or not t2:
            return 0.0

        try:
            if not _SKLEARN_AVAILABLE:
                return MatchingEngine._fallback_text_similarity(t1, t2)
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                token_pattern=r"(?u)\b\w+\b",
            )
            tfidf_matrix = vectorizer.fit_transform([t1, t2])
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return max(0.0, min(1.0, float(sim)))
        except Exception:
            # Fallback to Jaccard word set similarity
            w1 = set(re.findall(r"\w+", t1))
            w2 = set(re.findall(r"\w+", t2))
            if not w1 or not w2:
                return 0.0
            return len(w1.intersection(w2)) / len(w1.union(w2))

    @staticmethod
    def calculate_date_proximity_score(date_str1: str, date_str2: str) -> float:
        """Score based on how close the lost date and found date are (within 14 days)."""
        try:
            d1 = datetime.fromisoformat(date_str1.replace("Z", "+00:00")).date()
            d2 = datetime.fromisoformat(date_str2.replace("Z", "+00:00")).date()
            diff_days = abs((d1 - d2).days)

            if diff_days <= 1:
                return 10.0
            elif diff_days <= 3:
                return 8.0
            elif diff_days <= 7:
                return 6.0
            elif diff_days <= 14:
                return 3.0
            return 0.0
        except Exception:
            return 5.0  # neutral score if date parse fails

    @staticmethod
    def evaluate_pair(lost_item: dict, found_item: dict) -> dict:
        """
        Evaluate candidate match between a Lost item and a Found item.
        Returns composite similarity score (0-100), breakdown, and match tier.
        """
        breakdown = {}
        score = 0.0

        # 1. Category Matching (Max 25 pts)
        lost_cat = (lost_item.get("category") or "").strip().lower()
        found_cat = (found_item.get("category") or "").strip().lower()
        if lost_cat and found_cat and lost_cat == found_cat:
            cat_score = 25.0
        elif lost_cat == "others" or found_cat == "others":
            cat_score = 10.0
        else:
            cat_score = 0.0
        breakdown["category_score"] = cat_score
        score += cat_score

        # If categories completely differ, cap early
        if cat_score == 0.0:
            return {
                "similarity_score": 10,
                "match_tier": "low",
                "breakdown": breakdown,
                "reasons": ["Mismatched categories"],
            }

        # 2. Location Matching (Max 20 pts)
        lost_loc = (lost_item.get("location") or "").strip().lower()
        found_loc = (found_item.get("location") or "").strip().lower()
        loc_score = 0.0
        if lost_loc and found_loc:
            if lost_loc == found_loc:
                loc_score = 20.0
            elif lost_loc in found_loc or found_loc in lost_loc:
                loc_score = 15.0
            else:
                # check word overlap
                w_lost = set(re.findall(r"\w+", lost_loc))
                w_found = set(re.findall(r"\w+", found_loc))
                if w_lost.intersection(w_found):
                    loc_score = 10.0
        breakdown["location_score"] = loc_score
        score += loc_score

        # 3. Brand Matching (Max 15 pts)
        lost_brand = (lost_item.get("brand") or "").strip().lower()
        found_brand = (found_item.get("brand") or "").strip().lower()
        brand_score = 0.0
        if lost_brand and found_brand:
            if lost_brand == found_brand:
                brand_score = 15.0
            elif lost_brand in found_brand or found_brand in lost_brand:
                brand_score = 10.0
        elif not lost_brand and not found_brand:
            brand_score = 7.0  # neutral
        breakdown["brand_score"] = brand_score
        score += brand_score

        # 4. Color Matching (Max 15 pts)
        lost_color = (lost_item.get("color") or "").strip().lower()
        found_color = (found_item.get("color") or "").strip().lower()
        color_score = 0.0
        if lost_color and found_color:
            if lost_color == found_color:
                color_score = 15.0
            elif lost_color in found_color or found_color in lost_color:
                color_score = 10.0
        elif not lost_color and not found_color:
            color_score = 7.0
        breakdown["color_score"] = color_score
        score += color_score

        # 5. Date Proximity (Max 10 pts)
        date_score = MatchingEngine.calculate_date_proximity_score(
            lost_item.get("date", ""),
            found_item.get("date", ""),
        )
        breakdown["date_score"] = date_score
        score += date_score

        # 6. AI/NLP Description & Title Semantic Similarity (Max 15 pts)
        text_lost = f"{lost_item.get('title', '')} {lost_item.get('description', '')} {lost_item.get('distinctive_features', '')}"
        text_found = f"{found_item.get('title', '')} {found_item.get('description', '')}"

        semantic_ratio = MatchingEngine.calculate_text_similarity(text_lost, text_found)
        nlp_score = semantic_ratio * 15.0
        breakdown["nlp_score"] = round(nlp_score, 2)
        breakdown["semantic_similarity_ratio"] = round(semantic_ratio, 3)
        score += nlp_score

        # Final score rounding & tier categorization
        final_score = int(round(max(0.0, min(100.0, score))))

        if final_score >= 80:
            match_tier = "strong"  # 80-100
        elif final_score >= 60:
            match_tier = "possible"  # 60-79
        else:
            match_tier = "low"

        return {
            "similarity_score": final_score,
            "match_tier": match_tier,
            "breakdown": breakdown,
        }

    @staticmethod
    def run_matching_for_new_item(item_doc: dict, item_id: str):
        """Run matching engine against all opposing open items and record matches."""
        db = current_app.db
        is_lost = item_doc.get("type") == "lost"
        target_type = "found" if is_lost else "lost"

        # Search candidates in opposing type with status 'open' or 'matched'
        candidates = list(
            db.items.find({
                "type": target_type,
                "status": {"$in": ["open", "matched"]},
                "_id": {"$ne": ObjectId(item_id)},
            })
        )

        matches_created = 0

        for candidate in candidates:
            cand_id = str(candidate["_id"])

            lost_candidate = item_doc if is_lost else candidate
            found_candidate = candidate if is_lost else item_doc

            eval_res = MatchingEngine.evaluate_pair(lost_candidate, found_candidate)
            score = eval_res["similarity_score"]
            tier = eval_res["match_tier"]

            # Store match if score >= 60
            if score >= 60:
                lost_id = item_id if is_lost else cand_id
                found_id = cand_id if is_lost else item_id

                match_entry = {
                    "lost_item_id": lost_id,
                    "found_item_id": found_id,
                    "similarity_score": score,
                    "match_tier": tier,
                    "breakdown": eval_res["breakdown"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }

                db.matches.update_one(
                    {"lost_item_id": lost_id, "found_item_id": found_id},
                    {"$set": match_entry},
                    upsert=True,
                )

                # Send in-app notification to the owner of the lost item
                lost_owner_id = lost_candidate.get("user_id")
                if lost_owner_id:
                    notif_title = f"{'🔥 Strong' if tier == 'strong' else '✨ Possible'} Match ({score}%): {lost_candidate.get('title')}"
                    notif_msg = f"A candidate '{found_candidate.get('title')}' at {found_candidate.get('location')} matches your lost report."

                    db.notifications.insert_one({
                        "user_id": lost_owner_id,
                        "type": "match",
                        "match_id": f"{lost_id}_{found_id}",
                        "lost_item_id": lost_id,
                        "found_item_id": found_id,
                        "title": notif_title,
                        "message": notif_msg,
                        "similarity_score": score,
                        "read": False,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                    
                    lost_user_email = lost_candidate.get("user_email")
                    lost_user_name = lost_candidate.get("user_name", "Student")
                    if lost_user_email:
                        send_match_notification_email(
                            recipient_email=lost_user_email,
                            name=lost_user_name,
                            lost_item_title=lost_candidate.get("title", "Lost Item"),
                            found_item_title=found_candidate.get("title", "Found Item"),
                            match_score=score,
                            match_tier=tier
                        )

                matches_created += 1

        return matches_created
