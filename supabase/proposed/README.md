# Proposed database changes — NOT APPLIED

These files are deliberately outside `supabase/migrations/` so no tool applies them automatically.
Each one touches security on a database that holds real users and financial records, so each needs
the owner's explicit approval and the listed precondition check first. None deletes or rewrites data.

| File | What it changes | Precondition before applying |
|------|-----------------|------------------------------|
| `001_lock_email_verification_rpcs.sql` | Removes public EXECUTE on `mark_email_verified` / `confirm_email_verification` | Confirm in API logs that nothing still calls them |
| `002_pin_function_search_path.sql` | Pins `search_path` on 28 functions flagged by the Supabase advisor | Run on a Supabase branch first; smoke-test transfer/document RPCs |
| `003_stop_public_read_of_otp_and_exchange_pii.sql` | Hides `otp_*` settings and exchange contact data from anonymous reads | Identify what writes/reads `otp_*` and which pages need anonymous exchange lookup |

Rollback for every file is described inside it.
