# Niko & Kim Memories PHP Backend

## Setup

1. Install PHP and Composer on your machine.
2. Open a terminal in this folder:
   ```bash
   cd c:/Users/Admin/Downloads/niko_kim_memories/api
   composer install
   ```
3. Start the PHP server from the root workspace folder:
   ```bash
   cd c:/Users/Admin/Downloads/niko_kim_memories
   php -S localhost:8000
   ```

## API endpoints

- `http://localhost:8000/api/auth.php?action=login`
- `http://localhost:8000/api/auth.php?action=register`
- `http://localhost:8000/api/dashboard.php?action=get_dashboard&user_id=1`
- `http://localhost:8000/api/chat.php?action=get_messages&user_id=1`
- `http://localhost:8000/api/chat.php?action=send&user_id=1`
- `http://localhost:8000/api/letters.php?action=get_letters&user_id=1`
- `http://localhost:8000/api/letters.php?action=save&user_id=1`
- `http://localhost:8000/api/letters.php?action=delete&user_id=1`
- `http://localhost:8000/api/planner.php?action=get_planner&user_id=1`
- `http://localhost:8000/api/planner.php?action=toggle_task&user_id=1`
- `http://localhost:8000/api/planner.php?action=add_plan&user_id=1`
- `http://localhost:8000/api/memories.php?action=get_memories&user_id=1`
- `http://localhost:8000/api/memories.php?action=save&user_id=1`
- `http://localhost:8000/api/mail.php?action=send`

## Notes

- `auth.php` stores users in `api/data/users.json`.
- `dashboard.php` returns zeroed default values for new users.
- `mail.php` uses PHPMailer when `vendor/autoload.php` exists.

## Reset defaults

Dashboard values are initialized to zero so the UI starts empty and ready for real data.

## Supabase Setup

If you want to use Supabase as the database backend, run the SQL in `supabase-schema.sql` in your Supabase SQL editor.

1. Open Supabase and go to the SQL editor.
2. Copy the contents of `supabase-schema.sql` and execute it.
3. Create a `.env` file at the project root and set:

```env
SUPABASE_URL=https://gteeqqwqgthlbwezqlhr.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
```

4. Use `api/supabase.php` to call Supabase from PHP, or migrate the frontend/auth logic to Supabase directly.

> Note: For production, use a service role key only on the server and never expose it in client-side code.
