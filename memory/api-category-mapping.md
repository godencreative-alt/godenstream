---
name: api-category-mapping
description: API parameters for category vs subcategory mapping
metadata:
  type: project
---

When fetching from the GodenPG API (`api.godenpg.dev`):
- For `comic` endpoints (`/comic/latest`, `/comic/search`), use the parameter `subcategory` (e.g., `subcategory=manga` or `subcategory=manhwa`), NOT `type`.
- For `anime` endpoints, hentai is integrated under anime via `subcategory=hentai`.
- For `entertainment`, movies use `subcategory=movie`, and adult video uses `subcategory=adult`.

**Why:** The backend parser relies specifically on these exact parameter names. Passing `type` instead of `subcategory` for comics causes the scraper backend to fallback to manga silently.
**How to apply:** When creating or editing `fetch*` functions in `lib/api.ts`, check that the query parameters match this contract.
