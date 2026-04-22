"""
Auth Email Extension - Single Function Router (SMTP enabled)

Routes (via ?action= query parameter):
  POST /auth?action=register       - Register new user
  POST /auth?action=verify-email   - Verify email with 6-digit code
  POST /auth?action=login          - Login and get tokens
  POST /auth?action=refresh        - Refresh access token
  POST /auth?action=logout         - Logout and revoke tokens
  POST /auth?action=reset-password - Request/complete password reset
  GET  /auth?action=health         - Check DB schema
"""
from handlers import register, login, logout, refresh, reset_password, health, verify_email, me, update_status, update_profile, club_members, chat, users_list, referral_stats, withdrawal_request, withdrawal_history, admin_withdrawals, referral_click
from utils.http import options_response, error, get_origin_from_event


ROUTES = {
    'register': register.handle,
    'login': login.handle,
    'refresh': refresh.handle,
    'logout': logout.handle,
    'reset-password': reset_password.handle,
    'health': health.handle,
    'verify-email': verify_email.handle,
    'me': me.handle,
    'update-profile': update_profile.handle,
    'club-members': club_members.handle,
    'chat': chat.handle,
    'update-status': update_status.handle,
    'users-list': users_list.handle,
    'referral-stats': referral_stats.handle,
    'withdrawal-request': withdrawal_request.handle,
    'withdrawal-history': withdrawal_history.handle,
    'admin-withdrawals': admin_withdrawals.handle,
    'referral-click': referral_click.handle,
}

# Actions that allow GET method
GET_ACTIONS = {'health', 'me', 'users-list', 'referral-stats', 'withdrawal-history', 'admin-withdrawals', 'club-members', 'chat'}
# Actions that allow both GET and POST
BOTH_ACTIONS = {'admin-withdrawals', 'chat'}


def handler(event: dict, context) -> dict:
    """Main router for auth endpoints."""
    method = event.get('httpMethod', 'GET').upper()
    origin = get_origin_from_event(event)

    if method == 'OPTIONS':
        return options_response(origin)

    # Extract action from query parameters
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # Actions that allow both GET and POST
    if action in BOTH_ACTIONS and method in ('GET', 'POST'):
        return ROUTES[action](event, origin)

    # Some actions allow GET only
    if action in GET_ACTIONS and method == 'GET':
        return ROUTES[action](event, origin)

    if method != 'POST':
        return error(405, 'Method not allowed', origin)

    if not action or action not in ROUTES:
        return error(404, f'Unknown action: {action}. Use ?action=health|login|register|refresh|logout|reset-password|verify-email', origin)

    return ROUTES[action](event, origin)