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
- Save button + dark mode toggle added to edit page header (dark mode state toggles `dark` class on `<html>`)
- `date_range` visual calendar: single grid, From/To selection, range highlighting, day count display, clear button
- @dnd-kit/core, sortable, utilities installed; `SortableQuestionItem` component wraps each card with drag handle
- Drag & drop reordering via `DndContext` + `SortableContext` per page (closestCenter, verticalListSortingStrategy)
- Collaboration via Supabase Realtime channel: presence tracking, form-update broadcast, user avatars in header
- Payment info system: stored in `page_titles._payment` (JSONB), settings UI in modal, displayed to filler before submit
- Floating action menu (`settings gear icon`) under each question with click-away close, إخفاء, نقل إلى البداية/النهاية, الصفحة, عرض بجوار السؤال السابق, المنطق الشرطي
- Old inline sections (Conditional Logic, Page/Row Group) removed – build syntax error fixed
- `SortableQuestionItem` export changed to non-exported function (Next.js page export restriction)
- Domain `openappo.com` purchased, verified in Resend for email sending
- `forms.openappo.com` configured as custom domain on Vercel (CNAME → cname.vercel-dns.com)
- `RESEND_FROM_EMAIL` set to `noreply@openappo.com` (Vercel env var)
- Rebranded name to "Forms.OpenappO" – updated all code references including styled headers
- SQL migration `sql/007_user_limits.sql`: added `banned`, `form_limit`, `submission_limit` columns to `profiles`
- Admin users page (`src/app/admin/users/page.tsx`): ban/unban toggle, form_limit/submission_limit inputs, banned badge + filter
- Limit enforcement in form creation (banned + form_limit check) and form submission (banned + submission_limit check in `FormFiller.tsx`)
- Dashboard and login pages: banned users signed out and rejected login with error message
- RichTextEditor component (`src/components/RichTextEditor.tsx`): WYSIWYG for static_text with Bold/Italic/Underline, font family & size, text/background color, alignment, lists, offer templates (خصم, كشف مجاني, عرض رمضان)
- RichTextEditor used in both edit page and create page for static_text questions
- Static_text rendered as HTML via `dangerouslySetInnerHTML` in FormFiller
- Submit button customization (text + color + textColor) stored in `page_titles._submit_button`
- Submit button settings moved to Theme Designer as new "الزر" tab with color presets, text input, text color picker, and live preview button
- Old submit button section removed from settings modal
- Offer countdown stored in `page_titles._offer_countdown` (ISO datetime), settings UI in edit modal
- Live countdown banner with HH:MM:SS in FormFiller (red gradient, auto-hides when expired or submitted)
- Success screen redesigned: checkmark + "تم إرسال طلبك بنجاح ✅", total response count from `form_responses`, "أنشئ نموذجك مجانًا 🚀" CTA linking to `https://forms.openappo.com`, score display hidden when not test mode
- Products system stored in `page_titles._products` array of `{ id, name, description, price, image_url, available }`
- Product management UI in settings modal with Supabase Storage image upload to `products` bucket
- Product catalog display in FormFiller with grid, add-to-cart with +/- quantity, cart total summary
- Cart data (`__cart`) injected into `answers` on form submission
- `_is_test` flag in `page_titles`, toggle in create + edit pages, hides all points fields when disabled, hides score on success screen
- Fixed `page_titles` type from `Record<string, string>` to `Record<string, any>` across types, edit, and FormFiller
- Fixed `addOption` null spread error with `|| []` fallback
- Added three new question types: `countdown_timer`, `products_block`, `payment_info_block` under "إضافات" category in both edit and create pages
- Vercel repo made public to resolve Hobby Plan deployment block
- Removed "متصل" text from collaboration indicator in button bar
- Changed save button icon from download (arrow to tray) to floppy disk
- Fixed "not iterable" error for old-format options (object with numeric keys) – converts to array on load, uses `Array.isArray` checks in `addOption` and scale points input
- Added `parseOptions` stripping of `_visibility_rules` from array format in edit, create, and FormFiller
- Fixed save/load path: array options now appended with `_visibility_rules` as last element instead of spreading into object
- Partners SQL migration (`sql/008_partners.sql`): added columns to `profiles` (company, facebook_url, linkedin_url, youtube_url, other_links, bio, is_partner, referral_code, referral_count) and new tables (partner_ideas, partner_likes, referrals, user_templates with approved flag)
- Partners public page (`src/app/partners/page.tsx`): cards with avatar, stats (forms/templates/submissions/referrals), ideas list with implemented status, like button, referral link copy
- Added "شركاء النجاح" link to Header.tsx (desktop + mobile nav)
- Forgot password page (`src/app/forgot-password/page.tsx`): email input, sends reset link via Supabase
- Reset password page (`src/app/reset-password/page.tsx`): new password form, calls `supabase.auth.updateUser`
- Added "نسيت كلمة المرور؟" link to login page
- Profile page (`src/app/profile/page.tsx`): added company, bio, social links (Facebook/LinkedIn/YouTube), other links manager, referral code display with copy button
- Profile update handler now saves all new partner fields (company, bio, social links, other_links)
- Points display ("النقاط") hidden when test mode is disabled
- Admin approval required for user templates before public display
- Avatar upload added to profile page (uploads to `project-images` bucket)
- Admin partner management card added to admin dashboard

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
1. Deploy SQL migration `sql/008_partners.sql` to Supabase via SQL Editor
2. Build Admin partner management UI (`/admin/partners`): mark users as partners, add/approve ideas, approve user templates
3. Build user template creation flow: "تحويل إلى قالب" button in form edit page
4. Register referral code on user signup if `ref` param present
5. Add partner badge/indicator in admin users page
6. Test build on Vercel

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
