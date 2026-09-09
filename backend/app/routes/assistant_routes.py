from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from app.models.schemas import AssistantChatSchema, QualityAnalyzeSchema
from app.services.recovery_assistant_service import RecoveryAssistantService
from app.services.report_quality_service import ReportQualityService
from app.middleware.auth import jwt_optional_custom

assistant_bp = Blueprint("assistant", __name__)


@assistant_bp.post("/chat")
@jwt_optional_custom
def chat_assistant():
    """AI Personal Recovery Assistant for conversational lost item discovery."""
    try:
        data = request.get_json() or {}
        validated = AssistantChatSchema(**data)
        user_id = getattr(g, "user_id", None)
        result = RecoveryAssistantService.assist_recovery(validated.query, user_id=user_id)
        return jsonify(result), result.get("status_code", 200)
    except ValidationError as err:
        return jsonify({"message": "Invalid assistant query", "errors": err.errors()}), 422
    except Exception as e:
        return jsonify({"message": f"Assistant query error: {str(e)}"}), 500


@assistant_bp.post("/analyze-quality")
def analyze_report_quality():
    """AI Report Quality Assistant inspecting report completeness pre-submission."""
    try:
        data = request.get_json() or {}
        validated = QualityAnalyzeSchema(**data)
        result = ReportQualityService.analyze_quality(validated.model_dump())
        return jsonify(result), 200
    except ValidationError as err:
        return jsonify({"message": "Invalid quality request", "errors": err.errors()}), 422
    except Exception as e:
        return jsonify({"message": f"Quality analysis error: {str(e)}"}), 500
