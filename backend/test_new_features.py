import unittest
from app import create_app
from app.services.recovery_assistant_service import RecoveryAssistantService
from app.services.report_quality_service import ReportQualityService
from app.services.claim_service import ClaimService
from app.services.item_service import ItemService
from app.services.notification_service import NotificationService


class TestNewFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_assistant_query_parsing(self):
        query = "Mera black wallet Central Library me kal kho gaya"
        parsed = RecoveryAssistantService.parse_user_query(query)
        self.assertTrue(parsed["is_lost"])
        self.assertEqual(parsed["category"], "Wallets & Purses")
        self.assertEqual(parsed["color"], "Black")
        self.assertEqual(parsed["location"], "Central Library")
        self.assertTrue(bool(parsed["date"]))

    def test_report_quality_assistant(self):
        # Sparse report
        sparse = ReportQualityService.analyze_quality({
            "title": "keys",
            "category": "Keys & Keychains",
        })
        self.assertLess(sparse["quality_score"], 50)
        self.assertIn("suggestions", sparse)

        # High-quality report
        rich = ReportQualityService.analyze_quality({
            "title": "Black Nike Backpack",
            "category": "Backpacks & Bags",
            "brand": "Nike",
            "color": "Black",
            "location": "Central Library - 2nd Floor",
            "description": "Left behind near the reference section with textbooks and water bottle inside",
            "distinctive_features": "Red keychain on the zipper and subtle tear on the front pocket",
            "has_image": True,
        })
        self.assertGreaterEqual(rich["quality_score"], 80)
        self.assertEqual(rich["rating"], "Excellent")

    def test_claim_priority_calculation(self):
        item_high_val = {
            "title": "MacBook Pro M2",
            "category": "Electronics & Laptops",
            "is_high_value": True,
        }
        claim_data = {
            "proof_description": "My laptop serial number is C02G1234MD6R with AppleCare receipt attached.",
            "answers_to_private_questions": "Wallpaper is Yosemite national park with stickers on the cover.",
        }
        res = ClaimService._calculate_claim_priority(item_high_val, claim_data)
        self.assertIn(res["priority_tier"], ["URGENT", "HIGH"])
        self.assertEqual(res["fraud_risk"], "LOW")
        self.assertGreaterEqual(res["priority_score"], 70)

    def test_privacy_preserving_public_item(self):
        mock_item = {
            "_id": "60d5ec49f1b2c82d88c8e111",
            "title": "Found iPhone 13",
            "category": "Electronics & Laptops",
            "location": "Science Complex",
            "description": "Black phone in black case",
            "distinctive_features": "SECRET_ENGRAVING_123",
            "private_verification_questions": "SECRET_WALLPAPER_DOG",
            "storage_shelf": "Shelf C",
            "storage_locker": "Locker 4",
            "storage_status": "STORED",
            "storage_id": "LF-20260909-ABC",
            "is_high_value": True,
            "type": "found",
        }
        public_view = ItemService._public_item(mock_item)
        # Verify secret markers are NOT exposed in public item
        self.assertNotIn("distinctive_features", public_view)
        self.assertNotIn("private_verification_questions", public_view)
        # Verify public safe fields ARE exposed
        self.assertEqual(public_view["storage_locker"], "Locker 4")
        self.assertTrue(public_view["has_verification_questions"])
        self.assertTrue(public_view["is_high_value"])

    def test_public_item_image_fallback_and_normalization(self):
        found_item = {
            "_id": "60d5ec49f1b2c82d88c8e112",
            "title": "Black Backpack",
            "type": "found",
            "found_image": "https://res.cloudinary.com/demo/found.jpg",
            "location": "Central Library",
        }
        public_found = ItemService._public_item(found_item)
        self.assertEqual(public_found["image_url"], "https://res.cloudinary.com/demo/found.jpg")
        self.assertEqual(public_found["imageUrl"], "https://res.cloudinary.com/demo/found.jpg")

        legacy_lost_item = {
            "_id": "60d5ec49f1b2c82d88c8e113",
            "title": "MacBook Air",
            "type": "lost",
            "imageUrl": "https://res.cloudinary.com/demo/lost.jpg",
            "location": "Central Library",
        }
        public_lost = ItemService._public_item(legacy_lost_item)
        self.assertEqual(public_lost["image_url"], "https://res.cloudinary.com/demo/lost.jpg")
        self.assertEqual(public_lost["imageUrl"], "https://res.cloudinary.com/demo/lost.jpg")

    def test_campus_lost_item_alert_creation(self):
        alert = NotificationService.create_campus_lost_item_alert({
            "_id": "lost_item_123",
            "title": "Black Backpack",
            "location": "Central Library",
            "date": "2026-09-24",
            "image_url": "https://res.cloudinary.com/demo/backpack.jpg",
            "reference_id": "LOST-2026-10234",
        })

        self.assertEqual(alert["type"], "CAMPUS_LOST_ITEM")
        self.assertEqual(alert["target_type"], "ALL_ACTIVE_STUDENTS")
        self.assertIn("Black Backpack", alert["message"])
        self.assertEqual(alert["reference_id"], "LOST-2026-10234")


if __name__ == "__main__":
    unittest.main()
