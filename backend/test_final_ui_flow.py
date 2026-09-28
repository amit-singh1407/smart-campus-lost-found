from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def test_simplified_student_flow_is_reflected_in_ui_text():
    user_layout = (ROOT / 'frontend/src/layouts/UserLayout.jsx').read_text(encoding='utf-8')
    admin_layout = (ROOT / 'frontend/src/layouts/AdminLayout.jsx').read_text(encoding='utf-8')
    item_details = (ROOT / 'frontend/src/pages/user/ItemDetailsPage.jsx').read_text(encoding='utf-8')

    assert 'My Possible Matches' not in user_layout
    assert 'My Claims' not in user_layout
    assert 'Report Found Item' in user_layout
    assert 'Find Lost & Found' in user_layout

    assert 'Claims Verification' not in admin_layout
    assert 'Inventory Moderation' in admin_layout

    assert 'THIS IS MY ITEM' in item_details
    assert 'Ownership Request' in item_details
    assert 'Private Identifying Markers' not in item_details
