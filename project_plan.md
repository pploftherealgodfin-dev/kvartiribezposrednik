# Квартира под наем без посредник

## 1. Project Description

**Позициониране:** пазар за наем в България с едно единствено обещание — обяви директно от собственик. Без брокери, без агенции, без комисионна. Всяка обява минава проверка и посредниците се филтрират активно.

**Целеви потребители (архетипи):**
- Студентът (18–25) — мобилен, ограничен бюджет, стая/студио до университет, страх от измами.
- Младият специалист (25–35) — 1–2 стаи, снимки, етаж, обзавеждане, транспорт, бърз оглед.
- Семейството (30–45) — 2–3 стаи, спокоен район, училища, дългосрочен договор, домашни любимци.
- Собственикът-любител (35–65) — 1–2 имота, не е технически грамотен, иска прост поток на публикуване.
- Собственикът-инвеститор — няколко имота, dashboard, масови действия, статистики.
- Скритият посредник (противник) — иска да се представя за собственик; системата трябва да го открие и блокира.

**Език:** изцяло български. **Валута:** EUR основна, BGN вторична (фиксиран курс 1.95583).

**Основна SEO ключова дума:** „квартира под наем без посредник“.

## 2. Роли и права

| Роль | Права |
|------|-------|
| Гост | разглеждане, търсене, обяви, landing страници. Без телефон. Без съобщения. |
| Наемател (тел. потвърден) | контакт на собственик, любими, запазени търсения с известия, докладване, съобщения |
| Собственик | всичко на наемател + създаване/редакция/спиране на обяви, „Наета“, статистики, съобщения. Нужна верификация за публикуване. |
| Верифициран собственик | собственик с преминала проверка на документ — значка и ranking boost |
| Модератор | опашка за преглед (нови обяви, доклади, верификации), одобрява/отхвърля/маркира с причина; не може да изтрива потребители |
| Админ | всичко + бан на потребители/телефони/устройства, градове и квартали, статични страници, одитен журнал, експорт |

Правата се проверяват както в UI, така и в логиката (`lib/permissions.ts`). Всяко модераторско/админ действие пише в `audit_log`.

## 3. Page Structure (React SPA, client routing)

**Глобално:**
- Sticky header — лого вляво; основна навигация (Търси, Как работи, Как да разпознаем посредник); „Качи обява“ (primary), любими, вход/профил.
- Footer — 4 колони (град, квартал, информация, контакти) + ред „Само собственици. Без посредници.“

**Страници:**
- `/` — Начало (hero с търсене, trust strip, последни обяви, търсене по университет, популярни градове/квартали, Как работи (табове наемател/собственик), „Как да разпознаем посредник“ teaser, финален CTA)
- `/tarsene` — Резултати (sidebar филтри desktop / bottom-sheet mobile, сортиране, list/map, карти, пагинация)
- `/obiava/:slug` — Обява (галерия, sticky колона с цена/факти/собственик, таблица, описание, приблизителна карта, подобни, „Докладвай“)
- `/kachi-obiava` — Многостъпков wizard с autosave (6 стъпки)
- `/dashboard` — Собственик (обяви, статистики, верификация, съобщения, настройки)
- `/moi-profil` — Наемател (любими, запазени търсения, съобщения, доклади)
- `/admin` — Модератор/Админ (опашки, потребители, банове, trust score, одитен журнал, градове/квартали, статични страници)
- Програмни SEO шаблони:
  - `/kvartiri-bez-posrednik/:grad`
  - `/kvartiri-bez-posrednik/:grad/:kvartal`
  - `/stai-bez-posrednik/:grad`
  - `/kvartiri-bez-posrednik/:grad/pri-universitet/:universitet`
  - `/ednostaini-kvartiri-bez-posrednik/:grad`, `/dvustaini-...`, `/tristaini-...`
  - Авто-noindex, ако обявите са под 3.
- Статични: `/za-nas`, `/kak-raboti`, `/kak-da-razpoznaem-posrednik`, `/obshi-usloviya`, `/politika-za-poveritelnost`, `/biskvitki`, `/kontakti`, `/faq`

## 4. Core Features

- [ ] Регистрация/вход, роли и тел. верификация (SMS — интегрира се по-късно)
- [ ] Обяви: wizard, чернови, autosave, качество и валидация
- [ ] Lifecycle state machine (draft → pending_review → active → rented/expired/deactivated/rejected/flagged/removed)
- [ ] Trust score + anti-broker детекция (детерминистична, без AI)
- [ ] Докладване и автоматично скриване
- [ ] Търсене, филтри, сортиране, запазени търсения с известия
- [ ] Защита на контакти (разкриване на телефон с лимит и лог)
- [ ] Съобщения (conversations/messages) с анти-спам лимити
- [ ] Модераторски/админ панел + одитен журнал
- [ ] Programmatic SEO страници + JSON-LD + sitemap
- [ ] Известия (имейл, подготвени SMS hooks)
- [ ] GDPR: consent banner, експорт/изтриване, политики

## 5. Data Model Design (PostgreSQL / Supabase-ready)

| Таблица | Полета |
|---------|--------|
| users | id, role, phone, phone_verified, email, name, trust_score, status, created_at |
| verifications | id, user_id, type, document_url, status, reviewed_by, reviewed_at |
| cities | id, slug, name, lat, lng |
| neighborhoods | id, city_id, slug, name, lat, lng |
| universities | id, city_id, slug, name, lat, lng |
| listings | id, owner_id, type, status, title, description, price_eur, deposit, area_m2, rooms, floor, total_floors, furnished, pets_allowed, utilities_included, available_from, min_term_months, city_id, neighborhood_id, address_private, lat_approx, lng_approx, created_at, expires_at, rented_at |
| listing_photos | id, listing_id, url, position, phash |
| favorites | id, user_id, listing_id, created_at |
| saved_searches | id, user_id, filters_json, alert_frequency |
| conversations | id, listing_id, tenant_id, owner_id, created_at |
| messages | id, conversation_id, sender_id, body, created_at, read_at |
| reports | id, listing_id, reporter_id, reason, status, resolved_by |
| phone_reveals | id, listing_id, viewer_id, created_at |
| audit_log | id, actor_id, action, entity, entity_id, meta, created_at |
| bans | id, type[phone|device|ip|email], value, reason, created_at |

Индекси: (city_id, status), (neighborhood_id, status), price_eur, status; full-text за български.

## 6. Backend / Third-party Integration Plan

- **База данни:** НЕ е свързана в момента → временни mock данни зад repository интерфейс (`lib/repository`). Свързване с Readdy Backend или SaaS Supabase по-късно, без промяна по страниците.
- **Файлово хранилище (снимки):** Supabase Storage (public bucket) — по-късно.
- **SMS доставчик (тел. верификация):** по-късно чрез доставчик на SMS + Edge Function.
- **Имейл известия:** Resend (по-късно).
- **Shopify / Stripe / др.:** не са нужни.

## 7. Технически бележки (важно)

Платформата генерира **React + Vite SPA** (client rendering), не Next.js. Затова:
- Няма истински SSR/SSG. SEO се прави максимално добре клиентски: семантичен HTML, уникални `<title>`/meta/canonical на страница, JSON-LD (BreadcrumbList, RealEstateListing/Offer, FAQPage), динамични Latin URL-и, лесен бъндъл, lazy-заредени изображения.
- `sitemap.xml` и `robots.txt` са сървърни файлове — ще се добавят, когато проектът се хоства с такъв контрол.
- Ако по-късно е нужен истински статичен HTML за максимално ранкиране, проектът трябва да се хоства на Next.js/SSG среда извън тази платформа.

## 8. Development Phase Plan

### Phase 1 — Ядро и данни (текуща)
- Goal: чист, тестваем двигател на продукта преди UI.
- Deliverable: `project_plan.md`; дизайн токени; `src/lib/types.ts` + `config.ts`; чисти функции в `/lib` (state machine, trust score, anti-broker, permissions, quality score, ranking, search, geo, phone protection, reporting, validation, seo, format); mock данни; repository интерфейс + mock реализация; минимална българска начална страница, която консумира repository-то.

### Phase 2 — Начална страница (пълен дизайн)
- Goal: пълен landing по картата (hero, trust strip, последни обяви, университети, градове/квартали, Как работи, посредник teaser, CTA).
- Deliverable: готов начален екран + глобални header/footer.

### Phase 3 — Търсене и обява
- Goal: резултати с филтри/сортиране/пагинация + страница на обява с галерия, sticky контакт, карта, докладване.

### Phase 4 — Публикуване и dashboard
- Goal: wizard за обява с autosave + dashboard за собственик и наемател.

### Phase 5 — Модерация, SEO шаблони, статични страници
- Goal: админ/модератор панел + programmatic SEO страници + статични страници + GDPR.

### Phase 6 — Свързване на реалната база / SMS / storage
- Goal: подмяна на mock repository с реална база.