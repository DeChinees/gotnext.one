UPDATE auth.users
SET
    confirmation_token = '',
    email_change = '',
    email_change_token_new = '',
    recovery_token = ''
WHERE email = 'user@example.com';