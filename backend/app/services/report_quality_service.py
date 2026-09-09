import re


class ReportQualityService:
    @staticmethod
    def analyze_quality(data: dict):
        """
        Evaluates report data before submission to ensure high recovery probability.
        Checks for:
        - Title clarity and length
        - Brand specification
        - Primary color identification
        - Location precision (not generic)
        - Description depth and unique characteristics
        - Private distinctive identifiers / secret marks
        - Photo presence
        """
        score = 0
        feedback = []
        strengths = []

        title = (data.get("title") or "").strip()
        brand = (data.get("brand") or "").strip()
        color = (data.get("color") or "").strip()
        location = (data.get("location") or "").strip()
        desc = (data.get("description") or "").strip()
        distinctive = (data.get("distinctive_features") or "").strip()
        has_image = bool(data.get("has_image") or data.get("image_url"))

        # 1. Title evaluation (15 pts)
        if len(title) >= 10 and len(title.split()) >= 2:
            score += 15
            strengths.append("Descriptive item name provided")
        elif len(title) >= 3:
            score += 8
            feedback.append("Make the title more specific (e.g. 'Space Gray iPad Air' instead of 'Tablet')")
        else:
            feedback.append("Title is too brief; please mention the exact item type")

        # 2. Brand / Manufacturer (15 pts)
        if brand and len(brand) >= 2:
            score += 15
            strengths.append(f"Brand identified ({brand})")
        else:
            feedback.append("Adding the brand/make (e.g. Apple, Nike, Casio) significantly boosts AI match accuracy")

        # 3. Color specification (15 pts)
        if color and len(color) >= 2:
            score += 15
            strengths.append(f"Color specified ({color})")
        else:
            feedback.append("Specify the dominant or accent color of the item")

        # 4. Campus Location precision (15 pts)
        generic_locations = ["campus", "somewhere", "outside", "unknown"]
        if location and location.lower() not in generic_locations and len(location) >= 5:
            score += 15
            strengths.append(f"Clear campus location recorded")
        elif location:
            score += 8
            feedback.append("Specify a room, floor, or nearby landmark (e.g. 'Central Library - 2nd Floor Quiet Zone')")
        else:
            feedback.append("Add the campus building or area where the item was lost or found")

        # 5. Description depth (15 pts)
        desc_words = len(desc.split())
        if desc_words >= 15:
            score += 15
            strengths.append("Rich description with contextual details")
        elif desc_words >= 5:
            score += 10
            feedback.append("Expand description: mention accessories, contents, or circumstances")
        else:
            feedback.append("Description is very brief. Include condition, material, or what was inside")

        # 6. Distinctive features / Private markers (15 pts)
        if distinctive and len(distinctive) >= 5:
            score += 15
            strengths.append("Distinctive features / secret markers registered")
        else:
            feedback.append("Add unique identifying marks (scratches, stickers, keychain, engraving) to prevent fraud")

        # 7. Photograph attached (10 pts)
        if has_image:
            score += 10
            strengths.append("Photo attached for visual AI matching")
        else:
            feedback.append("Uploading a clear photo increases recovery probability by over 60%")

        # Normalize score
        final_score = min(100, max(10, score))

        if final_score >= 80:
            rating = "Excellent"
            badge_color = "emerald"
            recommendation = "High-quality report! The AI matching engine has excellent fidelity to locate your item."
        elif final_score >= 50:
            rating = "Good"
            badge_color = "amber"
            recommendation = "Good report, but adding a few missing details will help our matching algorithm find matches faster."
        else:
            rating = "Needs Detail"
            badge_color = "rose"
            recommendation = "This description is quite general. Adding brand, color, or a photo will drastically improve matching success."

        return {
            "quality_score": final_score,
            "rating": rating,
            "badge_color": badge_color,
            "recommendation": recommendation,
            "strengths": strengths,
            "suggestions": feedback,
            "status_code": 200,
        }
