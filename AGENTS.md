## Git Deployment for AI Agents
When the user says "انشر على جيت هب" or "deploy to GitHub":
1. Run `git status` to check current state
2. Run `git diff --stat` to see what changed
3. Stage all files: `git add -A`
4. Commit with a descriptive Arabic+English message: `git commit -m "type: short description in English"
5. Push: `git push origin main`
6. Confirm to the user the commit hash was pushed

Always check `git status` first — if working tree clean, tell user nothing to deploy.

## Goal
- Build and deploy an Arabic form builder with appointment booking, conditional logic, auto-save, drag-and-drop reordering, collaboration, payment info display, role-filtered response management, admin user controls, email verification via Resend, admin ban/limits, static_text rich text editor, custom submit button, offer countdown timer, products system with Supabase Storage images & cart, test/quiz mode toggle, إضافات question types, and a "شركاء النجاح" partner showcase page with ideas, likes, templates, and referrals.

## Constraints & Preferences
- Arabic RTL UI throughout
- Mobile-responsive design
- Email verification via Resend using verified domain `openappo.com` (sends from `noreply@openappo.com`)
- Verification code: 6 digits, expires in 10 minutes, stored in `verification_codes` table (RLS disabled, service role key used)
- `visibility_rules` stored inside `options` JSONB as `_visibility_rules` – no schema change needed for conditional logic
- `appointment` question type has DB CHECK constraint (SQL in `sql/006_appointment_types.sql` – executed)
- No Node.js locally – all dependency changes committed and tested via Vercel build logs
- GitHub remote: `origin` → `https://github.com/momarzouk1998/OPEN.FORM.git` (public)
- Domain `openappo.com` owned, `forms.openappo.com` configured on Vercel, Resend domain verified for email
- Rebranded from "OpenApp.Form" to "Forms.OpenappO"
- Partner templates require admin approval before public display

## Progress
### Done
- Arabic calendar date picker with month grid, today highlight, past disabled, day navigation arrows
- Availability filtering: `bookedSlots` fetches responses, fully-booked dates show red strikethrough
- Arabic AM/PM time display (`formatArabicTime`)
- Fix `enable_auto_save` DB error – removed from Supabase update payload
- Save button + dark mode toggle added to edit page header
- `date_range` visual calendar: single grid, From/To selection, range highlighting
- @dnd-kit/core, sortable, utilities installed; `SortableQuestionItem` component
- Drag & drop reordering via `DndContext` + `SortableContext` per page
- Collaboration via Supabase Realtime channel: presence tracking, broadcast, avatars
- Payment info system, floating action menu, RichTextEditor, Theme Designer
- Products system with Supabase Storage, cart, إضافات question types
- Partners page, profile page, admin pages, forgot/reset password
- **Bug fixes batch (#1–55):** 50/54 bugs fixed (only #9 monolithic components باقي)

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- `visibility_rules` stored inside `options` JSONB as `_visibility_rules` to avoid DB migration
- `appointment` answer stored as `{ date: "YYYY-MM-DD", time: "HH:MM" }` object in form response JSON
- Calendar built inline in `FormFiller.tsx` (no separate component)
- `enable_auto_save` is frontend-only (localStorage) – removed from Supabase update payload since column doesn't exist
- Payment/products/countdown stored in `page_titles._*` JSONB to avoid new DB columns
- `hidden` property on questions is editor-only (not persisted to DB)
- Floating action menu uses gear icon + click-away overlay for clean UX
- Rebrand to "Forms.OpenappO" to match domain `forms.openappo.com`
- New DB columns `banned`, `form_limit`, `submission_limit` on `profiles` table for admin user management
- RichTextEditor uses `contentEditable` + `document.execCommand` (no extra dependencies)
- Submit button settings live in Theme Designer (tab "الزر") with live preview
- Products use Supabase Storage `products` bucket (public, 2MB max, image/jpeg/png/webp)
- إضافات question types added to QuestionType union with inline editor UI; backward compatibility via `page_titles` fallback in FormFiller
- Github repo made public to allow Vercel Hobby Plan deployments
- Arrays saved with `_visibility_rules` as last array element instead of spread into object to preserve array identity
- Partner templates require admin approval (`approved` boolean) before appearing in public listings

## Next Steps
1. Fix remaining bug #9: Split monolithic components (FormFiller.tsx ~1600 lines, edit/page.tsx ~3800 lines, create/page.tsx ~2200 lines) into smaller files
2. Build and test deployment on Vercel

## Critical Context
- Build passes with latest commits on Vercel (Next.js 15.5.18) – remote builds only (no Node.js locally)
- Resend domain verified: emails send from `noreply@openappo.com`
- Site live at `https://forms.openappo.com`
- Local `.env.local` must match Vercel env vars
- SQL `sql/008_partners.sql` must be executed in Supabase SQL Editor before partner pages will work
- Partner profile edits (links, company, bio) are saved directly to `profiles` table by each user from their profile page
- Avatar upload on profile page uses the existing `project-images` bucket

## Relevant Files
- `src/app/forms/[id]/edit/page.tsx` : question editor, DnD, floating menu (gear icon), collaboration, payment/products/countdown settings UI, theme designer with button tab, `_is_test` toggle, إضافات question types, points hidden when test disabled
- `src/app/forms/[id]/FormFiller.tsx` : date_range calendar, payment info display, product grid + cart, countdown banner, submitted screen with total responses, score hidden if not test, custom submit button style, safe parseOptions for old-format objects
- `src/app/forms/[id]/page.tsx` : server component loading form data
- `src/app/forms/create/page.tsx` : form creation, إضافات types, `_is_test` toggle, fixed options save for arrays
- `src/app/admin/users/page.tsx` : ban/unban, form_limit/submission_limit, banned filter
- `src/components/RichTextEditor.tsx` : WYSIWYG toolbar for static_text
- `src/components/Header.tsx` : added "شركاء النجاح" nav link
- `src/types/index.ts` : `QuestionType` includes countdown_timer / products_block / payment_info_block; `Form.page_titles` typed as `Record<string, any>`; new `PartnerIdea`, `PartnerLike`, `Referral`, `UserTemplate`, `PartnerProfile` interfaces
- `sql/007_user_limits.sql` : banned, form_limit, submission_limit on profiles
- `sql/008_partners.sql` : partner columns, partner_ideas, partner_likes, referrals, user_templates tables with RLS
- `src/app/partners/page.tsx` : public partner showcase page with stats, ideas, likes, referral
- `src/app/profile/page.tsx` : company, bio, social links, other links manager, referral code display, avatar upload
- `src/app/login/page.tsx` : banned user rejection, added "نسيت كلمة المرور؟" link
- `src/app/forgot-password/page.tsx` : email input, sends Supabase reset link
- `src/app/reset-password/page.tsx` : new password form, calls `supabase.auth.updateUser`
- `src/app/dashboard/page.tsx` : banned user redirect
- `src/app/admin/page.tsx` : admin dashboard with partner management card
