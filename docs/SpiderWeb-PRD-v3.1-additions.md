# SpiderWeb PRD v3.1 — Tambahan & Pindaan

**Dokumen ini adalah tambahan kepada SpiderWeb PRD v3.0 Full.**
**Baca bersama PRD asal. Sections 1–60 kekal tidak berubah.**
**Versi:** 3.1
**Status:** Draft

---

## Perubahan Kepada Sections Sedia Ada

### UPDATE: Section 12 — GitHub Connection

Tambah subseksyen baru: **12.4 Webhook Security**

```txt
12.4 Webhook Security

Setiap project yang connect GitHub akan create webhook di GitHub.
Webhook ini hantar HTTP POST ke SpiderWeb bila ada push.

Masalah tanpa security:
Sesiapa yang tahu webhook URL boleh trigger deploy palsu.

Penyelesaian — HMAC Signature Validation:

1. SpiderWeb generate webhook secret semasa create webhook.
2. Secret disimpan encrypted dalam database.
3. GitHub sign setiap request dengan:
   X-Hub-Signature-256: sha256=<HMAC-SHA256(secret, payload)>
4. SpiderWeb verify signature sebelum proses payload.
5. Kalau signature tidak match → return 401, log security event.
6. Secret boleh di-rotate dari Settings page project.
```

Rules tambahan:

```txt
Webhook secret mesti disimpan encrypted.
Secret rotation mesti invalidate semua pending webhooks.
Invalid signature mesti dilog dalam security_events table.
Webhook URL mesti include project-specific token, bukan sekadar project ID.
```

---

### UPDATE: Section 35 — Deployment Flow

Tambah dua subseksyen baru selepas 35.4.

#### 35.5 Zero-Downtime Deploy Strategy

```txt
MVP Decision:
SpiderWeb MVP akan ada short downtime semasa redeploy.
Ini adalah keputusan sedar — bukan bug.

Alasan:
- Simpler implementation untuk MVP.
- Most small web apps boleh tolerate 10-30 saat downtime.
- Zero-downtime perlu blue/green infrastructure yang lebih komplex.

MVP behaviour:
1. Stop container lama.
2. Pull / extract code baru.
3. Run install + build.
4. Start container baru.
5. Domain pointing semula.

Downtime window = masa dari stop sampai container baru ready.

UI mesti tunjuk:
"Project akan mengalami downtime singkat semasa redeploy."

Future (post-MVP):
Blue/green deployment:
- Start container baru.
- Health check container baru.
- Switch traffic bila siap.
- Stop container lama.
Zero downtime.
```

#### 35.6 Concurrent Deployment Handling

```txt
Situasi:
User push ke GitHub dua kali dalam masa 30 saat.
Atau user tekan Redeploy semasa deploy masih berjalan.

Behavior yang perlu diimplementasi:

Rule 1: Satu project hanya boleh ada SATU active deployment pada satu masa.
Rule 2: Deployment baru yang datang semasa deployment aktif = queue.
Rule 3: Maksimum queue = 1. Kalau ada lagi satu dalam queue, replace queue tersebut.

Flow:
Deploy A berjalan
→ Deploy B masuk → masuk queue
→ Deploy C masuk → replace B dalam queue
→ Deploy A selesai → mulakan Deploy C (bukan B)

Status:
running_deploy_id  = ID deployment yang sedang berjalan
queued_deploy_id   = ID deployment dalam queue (nullable)

UI mesti tunjuk:
- Status "Building" untuk deployment aktif.
- Status "Queued" untuk deployment dalam queue.
- Button "Cancel Queue" untuk buang queued deployment.

Activity log mesti catat bila deployment di-queue dan bila ia di-replace.
```

---

### UPDATE: Section 44 — API Concept

Tambah subseksyen baru: **44.4 API Versioning**

```txt
44.4 API Versioning

Semua routes mesti guna prefix versi dari hari pertama.

Format:
/api/v1/<resource>

Contoh:
POST /api/v1/auth/send-code
GET  /api/v1/projects
POST /api/v1/projects/:id/redeploy

Kenapa dari hari pertama:
Bila API breaking change perlu dilakukan pada v2, clients lama masih boleh guna v1.
Tanpa versioning, setiap breaking change akan break semua integration.

Deprecation policy:
v1 mesti disupport minimum 6 bulan selepas v2 release.
Deprecation notice mesti ada dalam response header:
  Deprecation: true
  Sunset: Sat, 01 Jan 2028 00:00:00 GMT

Agent API juga mesti guna versi:
POST /agent/v1/project/start
POST /agent/v1/heartbeat
```

---

## Sections Baru

### Section 61 — Real-time Logs & Streaming

Deployment logs dan runtime logs perlu boleh dilihat secara real-time.

#### 61.1 Streaming Strategy

```txt
MVP: Server-Sent Events (SSE)

Kenapa SSE bukan WebSocket:
- SSE lebih simple untuk one-way stream (server → client).
- Tidak perlu library tambahan.
- Built-in browser support.
- Reconnect automatic.

SSE Endpoint:
GET /api/v1/projects/:id/logs/stream
  → Content-Type: text/event-stream
  → Chunked response dengan log lines

Deployment log stream:
GET /api/v1/projects/:id/deployments/:deployId/logs/stream

Agent menghantar logs ke panel via:
POST /agent/v1/logs/push (batch push setiap 500ms)
Panel forward ke SSE clients yang subscribe.
```

#### 61.2 Log Retention Policy

```txt
Deployment logs:
- Disimpan 30 hari.
- Selepas 30 hari, padam automatically.
- Maximum saiz per deployment log: 5MB.
- Jika melebihi 5MB, log akan dipotong dari awal (FIFO).

Runtime logs (container stdout/stderr):
- Hanya simpan 1,000 baris terkini dalam memory/buffer.
- Untuk full historical logs, user perlu setup external logging (future feature).
- MVP: logs hanya available semasa project running.

Activity logs:
- Disimpan 12 bulan.
- Selepas 12 bulan, archive ke cold storage (future).
- MVP: kekal dalam database tanpa expiry.

Security event logs:
- Disimpan 24 bulan minimum.
- Tidak boleh dipadam oleh user.
- Admin sahaja boleh access.
```

---

### Section 62 — Rate Limiting — Extended

Seksyen 11.6 dalam PRD asal hanya cover auth endpoints. Seksyen ini extend kepada semua endpoint sensitif.

#### 62.1 Rate Limit Table

```txt
Endpoint                              Limit              Window
--------------------------------------------------------------
POST /api/v1/auth/send-code           3 requests         10 minit per IP/email
POST /api/v1/auth/verify-code         5 attempts         15 minit per IP/email
POST /api/v1/projects                 10 requests        1 jam per user
POST /api/v1/projects/:id/redeploy    5 requests         10 minit per project
POST /api/v1/projects/:id/start       10 requests        1 jam per project
POST /api/v1/projects/:id/files/upload 20 requests       1 jam per project
POST /api/v1/projects/:id/backups     3 requests         1 jam per project
POST /api/v1/projects/:id/env/import  10 requests        1 jam per project
POST /api/v1/projects/:id/database    5 requests         1 jam per project
POST /api/v1/admin/*                  100 requests       1 minit per admin
```

#### 62.2 Rate Limit Response

Bila limit dicapai:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 600
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1719500400

{
  "error": "rate_limited",
  "message": "Too many requests. Try again in 10 minutes.",
  "retryAfter": 600
}
```

#### 62.3 File Upload Size Limits

```txt
ZIP upload (create project / deploy):
- Maximum: 512MB
- Jika melebihi: return 413 Payload Too Large

Individual file upload (file manager):
- Maximum: 50MB per file
- Jika melebihi: return 413

Total project storage:
- Ikut plan user.
- Default: 5GB
- Jika melebihi storage quota: upload ditolak dengan mesej jelas.

ZIP extraction safety:
- Check extracted size sebelum extract penuh (zip bomb protection).
- Maximum extracted size: 2x compressed size atau 1GB, mana lebih kecil.
- Validate path dalam ZIP — reject path traversal (../../etc).
```

---

### Section 63 — Project Deletion Cascade

Bila user atau admin delete project, ini yang perlu berlaku.

#### 63.1 Soft Delete vs Hard Delete

```txt
MVP decision: Soft Delete dengan 7-hari grace period.

Kenapa soft delete:
- Bagi user chance undo kalau silap delete.
- Mencegah data loss accidental.
- Senang untuk audit trail.

Status baru: "pending_deletion"

Flow:
User klik Delete Project
→ Confirmation modal (taip nama project)
→ Project status = "pending_deletion"
→ Project stops (container down, domain disabled)
→ Email notification dihantar
→ Timer 7 hari bermula
→ Selepas 7 hari: hard delete bermula
→ Activity log: "project.deletion_scheduled"

User boleh cancel dalam tempoh 7 hari:
→ Status kembali ke previous status
→ Project start semula
→ Activity log: "project.deletion_cancelled"

Admin boleh force hard delete tanpa tunggu 7 hari.
```

#### 63.2 Hard Delete Cascade

```txt
Apabila hard delete dijalankan (oleh system selepas 7 hari atau admin):

1. Stop dan destroy container di node (Agent command).
2. Delete semua project files dari node.
3. Delete managed PostgreSQL database (jika ada).
4. Unregister semua domains (disable routing, SSL revoked).
5. Delete semua backups dari storage.
6. Delete semua environment variables (encrypted values).
7. Delete semua project member records.
8. Delete deployment records (soft — keep for audit).
9. Delete domain records.
10. Mark activity logs as "project_deleted" (tidak dipadam — audit trail).
11. Delete project row dari database.

Urutan penting: domain → container → files → database → backups → metadata.

Jika mana-mana step gagal:
- Log error.
- Mark project sebagai "deletion_failed".
- Alert admin.
- Jangan teruskan ke step seterusnya tanpa manual review.
```

#### 63.3 Domain Behavior Semasa Pending Deletion

```txt
Semasa "pending_deletion":
- Domain tunjuk "suspension page" (bukan project).
- SSL kekal valid (jangan revoke awal).
- User masih boleh access panel.
- DNS record kekal (user perlu remove sendiri dari DNS provider).

Selepas hard delete:
- Reverse proxy config dipadam.
- SSL certificate revoked atau tidak direnew.
- Jika user ada custom domain, mereka perlu update DNS sendiri.
```

---

### Section 64 — User Deletion Cascade

Bila admin delete user account.

#### 64.1 Pre-deletion Check

```txt
Sebelum user boleh dipadam, system mesti check:

1. Adakah user ada active projects?
   Jika YA → tunjuk list projects dan paksa resolve dulu.

Options untuk resolve:
   a. Transfer ownership ke user lain.
   b. Delete semua projects (trigger project cascade).
   c. Suspend projects sahaja.

2. Adakah user ada role dalam project orang lain?
   Jika YA → remove user dari semua project teams secara automatic.

3. Adakah user ada pending invitations?
   Jika YA → cancel semua invitations.
```

#### 64.2 User Hard Delete Cascade

```txt
1. Remove user dari semua project_members records.
2. Cancel semua pending project invites yang dikirim oleh user ini.
3. Cancel semua pending project invites yang diterima oleh user ini.
4. Revoke semua active sessions.
5. Delete GitHub connection (token dipadam).
6. Delete semua email_verification_codes.
7. Transfer atau delete projects (bergantung pada option yang dipilih).
8. Anonymize activity logs (ganti nama dengan "deleted_user").
9. Delete user row.

Activity logs:
Jangan padam activity logs — anonymize sahaja.
Ganti actor_user_id dengan null, simpan "deleted_user" dalam metadata.
Ini penting untuk audit trail.
```

---

### Section 65 — Agent Lifecycle & Upgrade Strategy

PRD asal ada flow untuk install agent (seksyen 29.3) tetapi tiada spec untuk upgrade.

#### 65.1 Agent Version Tracking

```txt
Agent mesti report versi dalam setiap heartbeat:

{
  "node_id": "node_123",
  "agent_version": "1.2.3",
  ...
}

Panel simpan agent_version dalam nodes table.
Panel bandingkan dengan latest_agent_version dalam platform_settings.

Jika agent_version < latest_agent_version:
→ Node status tunjuk "update_available" badge.
→ Admin alert (tidak critical, hanya informational).
→ Jika agent_version terlalu lama (major version gap) → node status = "warning".
```

#### 65.2 Manual Upgrade Flow (MVP)

```txt
MVP: Manual upgrade sahaja.

Admin perlu:
1. Buka Admin → Nodes → [Node Name].
2. Klik "Upgrade Agent".
3. Panel hantar upgrade command ke agent via API.
4. Agent download binary baru dari panel atau CDN.
5. Agent verify checksum.
6. Agent restart diri sendiri dengan binary baru.
7. Agent reconnect ke panel.
8. Panel verify versi baru dalam next heartbeat.
9. Jika upgrade fail: agent revert ke binary lama.

Status semasa upgrade:
Node status = "upgrading"
Projects pada node kekal running (agent upgrade tidak affect containers).
```

#### 65.3 Upgrade Rules

```txt
1. Satu node upgrade pada satu masa (tidak parallel upgrade semua nodes).
2. Upgrade mesti ada checksum verification.
3. Rollback mesti automatic jika binary baru gagal start.
4. Upgrade log mesti disimpan.
5. Admin mesti dapat notification bila upgrade selesai atau gagal.
6. Future: auto-upgrade dengan maintenance window yang boleh dikonfigurasi.
```

#### 65.4 Agent Binary Distribution

```txt
Binary boleh didistribusikan melalui:
- Panel sendiri: GET /downloads/agent/<version>/spiderweb-agent-linux-amd64
- GitHub Releases (public CDN)
- S3-compatible object storage

Setiap binary mesti ada:
- SHA256 checksum file
- Signature verification (optional MVP, required production)

install-agent.sh mesti support:
- Fresh install
- Upgrade existing installation
- Version pinning: --version 1.2.3
```

---

### Section 66 — Port Allocation & Container Networking

PRD asal tidak explain bagaimana multiple projects pada satu node boleh guna port yang sama.

#### 66.1 Internal Port Isolation

```txt
Masalah:
Project A port 3000.
Project B port 3000.
Keduanya dalam node yang sama.

Penyelesaian: Docker internal networking.

Setiap project container berjalan dalam Docker network sendiri.
Port 3000 dalam container A ≠ port 3000 dalam container B.
Docker assign internal container IP secara automatic.

Reverse proxy (Traefik/Caddy) forward berdasarkan domain, bukan port:
domain: clinic.com → container: spiderweb_project_abc → internal IP: 172.18.0.5:3000
domain: myapp.com  → container: spiderweb_project_xyz → internal IP: 172.18.0.8:3000
```

#### 66.2 Container Network Config

```txt
Setiap project container:
- Network mode: bridge (Docker default).
- No host port binding (port tidak exposed ke host secara direct).
- Reverse proxy access container via Docker network.
- Container tidak boleh access containers lain secara langsung.

Security:
- Disable container-to-container communication (icc=false dalam Docker daemon).
- Setiap project dalam isolated Docker network.
- Reverse proxy sahaja yang boleh access containers.
```

#### 66.3 Port Validation

```txt
User set port dalam Startup page.
Panel mesti validate port sebelum deploy:

Valid range: 1024 - 65535
Reserved ports yang tidak dibenarkan:
- 22   (SSH)
- 80   (HTTP)
- 443  (HTTPS)
- 2375 (Docker daemon)
- 5432 (PostgreSQL — walau pun Docker isolated, elak confusion)

Jika user set port yang tidak valid:
→ Tunjuk error sebelum deploy.
→ Suggest port 3000 atau 8000.
```

---

### Section 67 — Build Cache Strategy

Build tanpa cache boleh ambil masa 3-5 minit untuk project besar. Cache mengurangkan masa ini secara signifikan.

#### 67.1 Cache Scope

```txt
Cache disimpan per project, per runtime type.
Cache tidak dikongsi antara projects.

Cache yang disupport:
- Node.js:  node_modules/ directory
- Python:   pip cache directory / .venv
- PHP:      vendor/ directory (Composer)
- Go:       Go module cache
- Dockerfile: Docker layer cache
```

#### 67.2 Cache Behavior

```txt
Semasa install step:
1. Agent check jika cache ada untuk project ini.
2. Jika cache ada dan package lock file tidak berubah → restore cache → skip install.
3. Jika cache tiada atau lock file berubah → fresh install → simpan cache baru.

Lock files yang dimonitor:
- Node.js:  package-lock.json / yarn.lock / pnpm-lock.yaml
- Python:   requirements.txt hash
- PHP:      composer.lock
- Go:       go.sum

Cache invalidation:
- Lock file berubah → padam cache, fresh install.
- User boleh "Clear Build Cache" dari Settings page.
- Cache auto-expire selepas 7 hari tidak digunakan.
```

#### 67.3 Cache Storage

```txt
Cache disimpan di node dalam:
/var/lib/spiderweb/cache/<project_id>/<runtime>/

Maximum cache size per project: 2GB.
Jika melebihi: padam cache lama (LRU).

Jika project dipindahkan ke node lain:
Cache tidak dipindahkan (berat).
Fresh install pada node baru.
Cache akan rebuild secara automatic.
```

---

### Section 68 — Wildcard DNS & Default Subdomain Setup

Seksyen 20 dalam PRD asal cover custom domain flow tetapi tidak explain setup teknikal untuk default subdomain `*.spiderweb.host`.

#### 68.1 Wildcard DNS Requirement

```txt
Untuk default subdomain berfungsi:
Platform owner mesti setup wildcard DNS:

Type: A
Name: *
Value: <central-ingress-IP>
TTL: 300

Atau jika ada multiple ingress:
Type: CNAME
Name: *
Value: ingress.spiderweb.host
```

#### 68.2 Central Ingress Architecture

```txt
Kenapa central ingress bukan direct node IP:

Jika default subdomain → node IP terus:
- DNS mesti diubah bila project berpindah node.
- User mungkin ada cache DNS lama.

Jika default subdomain → central ingress:
- Project boleh berpindah node tanpa DNS change.
- Ingress forward berdasarkan subdomain → project → node.
- Lebih robust untuk multi-node setup.

Flow:
clinic-system.spiderweb.host
→ *.spiderweb.host CNAME ingress.spiderweb.host
→ Central ingress / load balancer
→ Lookup project ID dari subdomain
→ Forward ke correct node + container
```

#### 68.3 Subdomain Format

```txt
Format: <project-slug>.spiderweb.host

Rules:
- project-slug mesti lowercase
- Hanya alphanumeric dan hyphen (-)
- Minimum 3 aksara
- Maximum 63 aksara
- Tidak boleh start atau end dengan hyphen
- Mesti unique merentasi semua projects

Conflict resolution:
Jika slug sudah diambil:
→ Auto-append nombor: clinic-system-2, clinic-system-3
→ Atau tunjuk error dan minta user pilih nama lain
```

---

### Section 69 — PostgreSQL Version & Connection Pooling

#### 69.1 PostgreSQL Version

```txt
MVP default: PostgreSQL 16 (latest stable).

User tidak boleh pilih versi dalam MVP.
Admin boleh set default version dalam platform_settings.
Future: user pilih versi (14, 15, 16).

Version disimpan dalam managed_postgres_databases table:
postgres_version VARCHAR(10) DEFAULT '16'
```

#### 69.2 Connection Pooling

```txt
Masalah tanpa pooling:
1000 projects × 10 connections each = 10,000 connections.
PostgreSQL default max_connections = 100.
= System crash.

Penyelesaian: PgBouncer (connection pooler).

Architecture:
Projects → PgBouncer → PostgreSQL

PgBouncer config:
pool_mode = transaction  (transaction-level pooling, paling efficient)
max_client_conn = 5000
default_pool_size = 5 per database

Connection string yang diberi kepada user:
DATABASE_URL=postgresql://user:pass@pgbouncer.internal:5432/db_name

Notes:
- PgBouncer berjalan sebagai service dalam node.
- Transaction pooling: prepared statements tidak disupport.
- Jika user perlukan prepared statements, connection string direct boleh diberi (dengan warning).
```

#### 69.3 Database Limits Per Project

```txt
Connection limit per database: 10 concurrent connections (via PgBouncer).
Storage limit per database: ikut plan.
Default: 1GB per database.

Jika storage limit hampir:
→ 80%: warning email.
→ 95%: write operations disabled.
→ 100%: database read-only.

Admin boleh increase limit manually.
```

---

### Section 70 — Error & Suspension Pages

PRD asal menyebut "Domain shows suspension page" tetapi tidak menjelaskan spec.

#### 70.1 Page Types

```txt
SpiderWeb mesti serve page tertentu apabila project tidak available:

1. Suspension Page
   Triggered when: admin suspend project
   HTTP status: 503
   Content: "This service has been suspended. Contact support."
   Branding: SpiderWeb platform branding

2. Project Stopped Page
   Triggered when: project manually stopped
   HTTP status: 503
   Content: "This service is currently offline."
   Branding: SpiderWeb atau project owner branding (future)

3. Build In Progress Page
   Triggered when: project deploying
   HTTP status: 503
   Content: "Deployment in progress. Please wait."
   Auto-refresh: 30 saat

4. Project Not Found Page
   Triggered when: domain registered tapi project deleted
   HTTP status: 404
   Content: "This project no longer exists."

5. Rate Limited Page
   Triggered when: project endpoint rate limited (future feature)
   HTTP status: 429
```

#### 70.2 Who Serves These Pages

```txt
Pages ini diserve oleh reverse proxy (Traefik/Caddy), bukan container.

Bila container down:
Reverse proxy detect → serve appropriate status page.

Implementation:
Traefik: custom error pages via middleware
Caddy: handle directive dengan custom response

Pages perlu:
- Responsive (mobile + desktop)
- No external dependencies (self-contained HTML/CSS)
- SpiderWeb branding (logo, colors)
- Contact / support link
```

#### 70.3 Admin Customization (Future)

```txt
Future feature:
Admin boleh upload custom suspension page per platform.
Platform owner boleh set custom brand.
Project owner boleh set custom "offline" page.

MVP: SpiderWeb default pages sahaja.
```

---

### Section 71 — Health Check & Platform Availability

Section ini cover endpoint yang diperlukan oleh load balancers, monitoring, dan agent.

#### 71.1 Panel Health Endpoints

```txt
GET /health
Response:
{
  "status": "ok",
  "version": "1.0.0",
  "database": "ok",
  "queue": "ok",
  "timestamp": "2026-06-26T10:00:00Z"
}
HTTP 200 jika semua ok.
HTTP 503 jika ada component down.

GET /health/ready
Response: 200 jika panel ready terima traffic.
Digunakan oleh load balancer health check.

GET /health/live
Response: 200 jika process masih hidup.
Digunakan oleh container orchestrator (Kubernetes, etc.).
```

#### 71.2 Agent Health Endpoint

```txt
Agent mesti expose local health endpoint:

GET http://localhost:8765/health
{
  "status": "ok",
  "node_id": "node_123",
  "agent_version": "1.0.0",
  "docker": "ok",
  "proxy": "ok"
}

Digunakan oleh:
- systemd untuk restart jika agent crash.
- Panel untuk verify agent connectivity.
- Local monitoring tools.
```

---

## Pindaan Kepada Schema Database

### UPDATE: Section 43.6 — nodes table

Tambah column baru:

```txt
nodes:
id
location_id
name
fqdn
public_ip
private_ip
status
agent_version          ← BARU: versi agent terpasang
latest_agent_version   ← BARU: versi agent terkini (dari platform_settings)
allow_new_projects
cpu_total
memory_total
disk_total
last_heartbeat_at
created_at
updated_at
```

### UPDATE: Section 43.7 — projects table

Tambah column baru:

```txt
projects:
id
owner_id
node_id
location_id
name
slug
type
status
deletion_scheduled_at  ← BARU: bila project akan di-hard-delete
source_type
github_repo
github_branch
webhook_secret_encrypted  ← BARU: GitHub webhook secret
default_subdomain
primary_domain
runtime
install_command
build_command
start_command
port
working_directory
running_deploy_id      ← BARU: FK ke deployments (active)
queued_deploy_id       ← BARU: FK ke deployments (queued)
created_at
updated_at
```

### UPDATE: Section 43 — Table Baru: webhook_events

```txt
webhook_events
id
project_id
source              -- "github"
event_type          -- "push", "pull_request"
delivery_id         -- GitHub X-GitHub-Delivery header
signature_valid     -- boolean
payload             -- JSON
status              -- "accepted", "rejected", "processed", "failed"
created_at
```

### UPDATE: Section 43 — Table Baru: project_build_cache

```txt
project_build_cache
id
project_id
runtime             -- "node", "python", "php", "go"
lock_file_hash      -- SHA256 of lock file
cache_path          -- path di node
size_bytes
last_used_at
created_at
```

---

## Pindaan Kepada API

### UPDATE: Section 44.1 — Semua routes guna /api/v1/ prefix

```txt
Sebelum:  POST /api/auth/send-code
Selepas:  POST /api/v1/auth/send-code

Sebelum:  GET  /api/projects
Selepas:  GET  /api/v1/projects
```

Semua routes dalam seksyen 44 PRD asal perlu guna `/api/v1/` prefix.

### Tambah routes baru:

```txt
Client API (tambahan):

GET  /api/v1/projects/:id/logs/stream          ← SSE log stream
GET  /api/v1/projects/:id/deployments          ← deployment history
GET  /api/v1/projects/:id/deployments/:depId/logs/stream ← specific deploy log

POST /api/v1/projects/:id/webhook/rotate-secret ← rotate GitHub webhook secret
POST /api/v1/projects/:id/cache/clear           ← clear build cache

Admin API (tambahan):

GET  /api/v1/admin/nodes/:id/agent-version      ← check agent version
POST /api/v1/admin/nodes/:id/upgrade-agent      ← trigger agent upgrade
GET  /api/v1/admin/projects?status=pending_deletion ← projects pending deletion
POST /api/v1/admin/projects/:id/force-delete    ← force hard delete
```

---

## Non-Negotiable Requirements Tambahan

Tambah kepada seksyen 5 (Non-Negotiable Requirements):

```txt
22. GitHub webhook mesti validate HMAC signature sebelum proses.
23. Semua API routes mesti guna /api/v1/ prefix dari hari pertama.
24. Project deletion mesti ada 7-hari grace period (soft delete).
25. User deletion mesti resolve semua active projects dulu.
26. Container networking mesti isolated — project tidak boleh reach containers lain.
27. Build cache mesti invalidate bila lock file berubah.
28. Agent mesti report version dalam setiap heartbeat.
29. Semua file uploads mesti validate size sebelum accept.
30. ZIP uploads mesti ada path traversal protection.
31. Default subdomain routing mesti guna central ingress, bukan direct node IP.
```

---

## Success Criteria Tambahan

Tambah kepada seksyen 59 (Success Criteria):

```txt
18. GitHub webhook validate HMAC signature — invalid signature dilog dan ditolak.
19. API versioning konsisten — semua routes guna /api/v1/.
20. Project deletion ada 7-hari recovery window yang berfungsi.
21. Dua deployment berturut-turut tidak run serentak — satu queue, satu active.
22. Container A tidak boleh reach container B dalam node yang sama.
23. Build cache mengurangkan install time pada deploy kedua.
24. Agent upgrade berjaya dari panel tanpa downtime pada running projects.
25. Wildcard DNS *.spiderweb.host pointing ke central ingress.
26. File upload > 512MB ditolak dengan mesej jelas.
```

---

---

### Section 72 — SSL Certificate Management

#### 72.1 SSL Issuance Strategy

```txt
Provider: Let's Encrypt (ACME protocol)
Implementation: Caddy (auto-HTTPS built-in) atau Traefik dengan ACME plugin

Semua domain mendapat SSL secara automatic:
1. Default subdomain: *.spiderweb.host → wildcard cert (issued sekali untuk semua subdomains)
2. Custom domain: issued per domain selepas DNS verified

Wildcard cert untuk *.spiderweb.host:
- Issued oleh platform owner sekali.
- Renewal automatic (60 hari sebelum expiry).
- Satu cert covers semua default subdomains.
- Tidak perlu issue cert baru untuk setiap project.

Custom domain cert:
- Issued selepas DNS verification lulus.
- Caddy/Traefik handle issuance dan renewal automatic.
- Challenge method: HTTP-01 (lebih simple) atau DNS-01 (untuk wildcard).
```

#### 72.2 Let's Encrypt Rate Limits

```txt
Let's Encrypt ada strict rate limits:
- 50 certificates per registered domain per week.
- 5 duplicate certificates per week.
- 300 pending authorizations per account per week.

Implikasi untuk SpiderWeb:
Jika ramai user tambah custom domain serentak, rate limit boleh tercapai.

Mitigasi:
1. Cache certificate per domain — jangan request baru kalau cert masih valid.
2. Queue cert issuance — jangan issue serentak.
3. Monitor rate limit usage via Let's Encrypt API.
4. Fallback: ZeroSSL sebagai alternative ACME provider.
5. Admin alert bila rate limit hampir (>40/50 certs dalam seminggu).
```

#### 72.3 SSL Status & Renewal

```txt
SSL status dalam domains table:
- ssl_status: "pending" | "issuing" | "active" | "failed" | "expired" | "renewing"
- ssl_issued_at: timestamp
- ssl_expires_at: timestamp
- ssl_provider: "letsencrypt" | "zerossl"

Renewal:
- Auto-renewal 30 hari sebelum expiry.
- Jika renewal gagal → alert admin + retry 3x dengan 24 jam gap.
- Jika expired → domain serve SSL warning page.
- User dapat email notification 14 hari sebelum expiry jika renewal stuck.
```

---

### Section 73 — Email Delivery Service

Auth SpiderWeb bergantung 100% pada email (verification code). Email delivery mesti reliable.

#### 73.1 Provider Strategy

```txt
MVP: Satu primary provider + satu fallback provider.

Recommended:
Primary:  Resend / Postmark / AWS SES (transactional, reliable)
Fallback: SMTP sendiri (jika primary down)

Admin configure dalam Admin → Settings:
- Email provider
- API key (encrypted)
- From address
- Reply-to address
- Fallback SMTP credentials

Jangan guna Gmail SMTP atau Outlook SMTP untuk production.
```

#### 73.2 Email Retry Policy

```txt
Jika email gagal dihantar:

Retry 1: Selepas 30 saat
Retry 2: Selepas 2 minit
Retry 3: Selepas 10 minit
Selepas 3 retry gagal → switch ke fallback provider → retry 3x lagi.
Selepas semua gagal → log error + alert admin.

Timeout per send attempt: 10 saat.

Verification code:
Jika email gagal, user akan nampak:
"Email gagal dihantar. Cuba semula atau hubungi support."
Jangan expose provider error ke user.
```

#### 73.3 Email Templates (Senarai)

```txt
Semua emails mesti ada template HTML + plain text fallback.

Template yang diperlukan MVP:
1. email.verification_code   — Login/register verification code
2. email.account_recovery    — Account recovery code
3. email.project_deployed    — Deployment success notification
4. email.deployment_failed   — Deployment failed notification
5. email.domain_verified     — Custom domain DNS verified
6. email.backup_failed       — Backup creation failed
7. email.project_invited     — User invited to project
8. email.project_deleted     — Project deletion scheduled (7-day warning)
9. email.storage_warning     — Storage usage > 80%
10. email.db_storage_warning — PostgreSQL storage > 80%
11. email.node_offline       — (Admin only) Node offline > 5 minit
12. email.agent_upgrade_done — (Admin only) Agent upgrade complete/failed

Template requirements:
- Responsive HTML (works di mobile email client)
- SpiderWeb branding (logo, color)
- Plain text version untuk email clients yang tidak support HTML
- Unsubscribe link untuk non-critical emails
- Footer dengan company info dan SSM number
```

---

### Section 74 — Queue System Architecture

Banyak operations dalam SpiderWeb tidak boleh berjalan secara synchronous (terlalu lama).

#### 74.1 Kenapa Queue Diperlukan

```txt
Operations yang MESTI masuk queue (bukan synchronous):
- Deploy project (boleh ambil 10 minit)
- Create backup (boleh ambil masa)
- Restore backup (boleh ambil masa)
- Issue SSL certificate (boleh ambil masa)
- Verify DNS (polling)
- Send email notification
- Agent upgrade
- Project hard delete cascade
- Build cache cleanup
- System backup

Operations yang BOLEH synchronous:
- Start/stop/restart project (agent command, <10 saat)
- Update environment variables
- Create PostgreSQL database (agent command, <30 saat)
- Rotate webhook secret
```

#### 74.2 Queue Implementation

```txt
MVP: PostgreSQL-based queue (tanpa Redis dependency).

Kenapa PostgreSQL queue untuk MVP:
- Tiada infrastructure tambahan.
- ACID guarantees — job tidak hilang.
- Cukup untuk ratusan concurrent jobs.

Future: BullMQ + Redis untuk scale besar.

Queue table schema:
jobs
id
type               -- "deploy", "backup", "ssl_issue", "dns_verify", etc.
payload            -- JSON
status             -- "pending" | "running" | "done" | "failed" | "cancelled"
priority           -- 1 (highest) - 10 (lowest)
attempts           -- berapa kali dah cuba
max_attempts       -- default 3
run_at             -- bila nak run (untuk scheduled jobs)
started_at
completed_at
failed_at
error_message
created_at
```

#### 74.3 Job Priority

```txt
Priority 1 (Highest):
- Auth email send (user tunggu)
- Project start/stop command

Priority 2:
- Deploy project
- SSL certificate issue

Priority 3:
- DNS verification polling
- Database creation

Priority 5:
- Backup create
- Backup restore

Priority 7:
- Agent upgrade
- Build cache cleanup

Priority 10 (Lowest):
- System backup
- Log cleanup
- Old session cleanup
```

#### 74.4 Dead Letter Queue

```txt
Jika job gagal selepas max_attempts:
→ Job dipindahkan ke dead_letter_jobs table.
→ Admin dapat alert.
→ Admin boleh retry manual atau padam.
→ Jangan auto-retry tanpa investigation.

dead_letter_jobs
id
original_job_id
type
payload
error_message
last_attempt_at
created_at
```

---

### Section 75 — Encryption Standards

Semua sensitive data dalam SpiderWeb mesti dienkripsi.

#### 75.1 Encryption Algorithm

```txt
Algorithm: AES-256-GCM (symmetric encryption)
Key size: 256 bits
IV/Nonce: 96 bits (random, per-encryption)
Authentication tag: 128 bits

Kenapa AES-256-GCM:
- Industry standard
- Authenticated encryption (detect tampering)
- Fast untuk server-side
- Widely supported

Data yang MESTI dienkripsi at rest:
- GitHub access token
- GitHub refresh token
- Webhook secrets
- Environment variable values (yang is_secret = true)
- PostgreSQL passwords
- Node tokens
- Backup encryption keys (jika ada)
- Email provider API keys
```

#### 75.2 Key Management

```txt
Encryption key disimpan dalam:
- Environment variable: SPIDERWEB_ENCRYPTION_KEY
- TIDAK dalam database
- TIDAK dalam codebase
- TIDAK dalam git

Key format: 32 bytes hex string (64 hex characters)

Key rotation procedure:
1. Generate key baru.
2. Re-encrypt semua secrets dengan key baru.
3. Update SPIDERWEB_ENCRYPTION_KEY.
4. Verify semua secrets boleh di-decrypt.
5. Old key boleh dibuang.

CRITICAL: Jika encryption key hilang, semua encrypted data tidak boleh dipulihkan.
Key mesti disimpan dalam:
- Password manager (1Password, Bitwarden)
- Secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Minimum 2 secure locations
```

#### 75.3 Password Hashing (User Passwords)

```txt
Note: SpiderWeb guna email verification code, bukan password.
Tiada user password untuk di-hash dalam MVP.

TAPI jika future ada password feature:
Algorithm: Argon2id
Parameters:
- Memory: 64MB
- Iterations: 3
- Parallelism: 4
- Hash length: 32 bytes

JANGAN guna: MD5, SHA-1, SHA-256, bcrypt (untuk password).
```

---

### Section 76 — Reserved Slugs & Naming Rules

#### 76.1 Reserved Project Slugs

```txt
Slugs ini tidak boleh digunakan oleh user:

System reserved:
www, api, app, admin, panel, dashboard, status, health,
mail, smtp, imap, pop3, ftp, sftp, ssh, vpn,
static, assets, cdn, media, files, uploads, storage,
agent, internal, private, secure, ssl, tls,
spiderweb, support, help, docs, documentation,
billing, payment, invoice, account, auth, login, logout,
register, verify, confirm, reset, recover,
new, create, edit, delete, update, manage,
test, staging, dev, development, production, prod

Tambah lebih jika perlu.

Kenapa reserved:
- Elak conflict dengan system routes.
- Elak phishing (e.g. "admin.spiderweb.host").
- Elak confusion.
```

#### 76.2 Reserved Environment Variable Names

```txt
Beberapa env var diurus oleh SpiderWeb secara automatic.
User BOLEH set nilai ini, tapi perlu warning.

SpiderWeb-managed vars:
PORT              — SpiderWeb set ini berdasarkan Startup config.
DATABASE_URL      — Auto-set bila PostgreSQL database dicipta.
POSTGRES_HOST     — Auto-set.
POSTGRES_PORT     — Auto-set.
POSTGRES_DB       — Auto-set.
POSTGRES_USER     — Auto-set.
POSTGRES_PASSWORD — Auto-set.

Jika user cuba set PORT secara manual:
→ Tunjuk warning: "PORT is managed by SpiderWeb. Your value may be overridden."

Jika user cuba set DATABASE_URL secara manual selepas create PostgreSQL:
→ Tunjuk warning: "DATABASE_URL is auto-managed. Setting this manually will override the SpiderWeb-managed value."
```

---

### Section 77 — API Standards (Pagination, Error Format, API Keys)

#### 77.1 List Endpoint Pagination

```txt
Semua list endpoints mesti support pagination.

Format: cursor-based pagination (bukan offset/page number)
Kenapa cursor: lebih performant untuk large datasets, tiada "page drift".

Request:
GET /api/v1/projects?limit=20&cursor=<cursor_token>

Response:
{
  "data": [...],
  "meta": {
    "total": 150,
    "limit": 20,
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "prevCursor": null
  }
}

Default limit: 20
Maximum limit: 100
```

#### 77.2 Standard Error Response Format

```txt
Semua error responses mesti guna format yang sama:

{
  "error": {
    "code": "project_not_found",
    "message": "Project tidak dijumpai atau anda tidak mempunyai akses.",
    "details": {},
    "requestId": "req_abc123"
  }
}

HTTP status codes yang digunakan:
400 — Bad Request (invalid input)
401 — Unauthorized (tidak login)
403 — Forbidden (login tapi tiada permission)
404 — Not Found
409 — Conflict (duplicate slug, etc.)
413 — Payload Too Large
422 — Unprocessable Entity (validation error dengan details)
429 — Too Many Requests
500 — Internal Server Error
503 — Service Unavailable

requestId:
Setiap request mesti ada unique request ID.
Header: X-Request-Id: req_abc123
Log setiap request dengan ID ini untuk debugging.
```

#### 77.3 Validation Error Format

```txt
Untuk 422 Unprocessable Entity:

{
  "error": {
    "code": "validation_failed",
    "message": "Input tidak sah.",
    "details": {
      "fields": [
        { "field": "name", "message": "Name mesti antara 3-63 aksara." },
        { "field": "port", "message": "Port mesti antara 1024-65535." }
      ]
    },
    "requestId": "req_abc123"
  }
}
```

#### 77.4 API Key Authentication (Future)

```txt
MVP: Semua API requests guna session cookie atau Bearer token dari login.

Future: User API Keys untuk programmatic access / CI-CD integration.

API Key format:
sw_live_<32-random-bytes-hex>   -- production
sw_test_<32-random-bytes-hex>   -- testing

Prefix "sw_" membolehkan secret scanning tools detect dan alert.

Permissions: API key boleh di-scope:
- read:projects
- write:projects
- read:deployments
- write:deployments
- read:logs
(etc.)

Key management:
- User boleh create multiple API keys.
- Key boleh revoke bila-bila masa.
- Key tidak pernah ditunjuk semula selepas creation (hanya sekali).
- Key disimpan sebagai hash dalam database.
- Activity log setiap API key usage.
```

---

### Section 78 — Admin MFA & Access Security

Admin panel mempunyai akses kepada semua user, project, dan node. Ia perlu perlindungan tambahan.

#### 78.1 Admin MFA Requirement

```txt
MVP: TOTP (Time-based One-Time Password) untuk Super Admin.
Future: Semua admin role.

TOTP standard: RFC 6238
Compatible dengan: Google Authenticator, Authy, 1Password, Bitwarden

Setup flow:
1. Admin baru diwajibkan setup TOTP semasa first login.
2. Panel generate TOTP secret.
3. Tunjuk QR code untuk scan dengan authenticator app.
4. Admin enter 6-digit code untuk verify.
5. Panel simpan TOTP secret encrypted.
6. Generate 10 backup codes (single-use recovery).

Login flow dengan MFA:
1. Admin enter email.
2. Email verification code dihantar.
3. Admin enter email code.
4. Admin enter TOTP code dari authenticator.
5. Login granted.

Jika TOTP device hilang:
- Admin boleh guna backup code.
- Backup code single-use (padam selepas guna).
- Jika semua backup codes habis → perlu contact Super Admin untuk reset.
```

#### 78.2 Admin IP Allowlist (Optional)

```txt
Future feature:
Admin boleh set IP whitelist untuk panel access.
Jika IP tidak dalam whitelist → 403 dengan mesej "Access restricted."

MVP: Feature ini optional, disabled by default.
Enable melalui: Admin → Settings → Security → IP Allowlist.
```

#### 78.3 Admin Session Policy

```txt
Admin session lebih strict dari user session:

Admin idle timeout: 30 minit (berbanding user 60 minit)
Admin absolute timeout: 8 jam (wajib re-login)
Admin "remember me": Tidak dibenarkan

Setiap sensitive admin action mesti re-verify:
- Delete user: confirm password (email code)
- Suspend platform: confirm password
- Force delete project: confirm password

Admin login dari IP baru:
→ Extra email notification kepada admin tersebut.
→ Log security event.
```

---

### Section 79 — Data Privacy & GDPR Compliance

SpiderWeb menyimpan data peribadi pengguna. Compliance mesti dipertimbangkan.

#### 79.1 Data Yang Disimpan

```txt
Data peribadi yang SpiderWeb simpan:
- Email address
- Name
- Avatar URL (dari GitHub)
- IP address (dalam sessions, activity logs, security events)
- GitHub username
- Login history
- Project names (might contain personal info)
- Environment variables (might contain personal credentials)

Data yang TIDAK disimpan:
- Payment info (Phase 6, guna payment processor)
- Passwords (sistem guna email code)
- GitHub password
```

#### 79.2 Data Retention

```txt
Data retention policy:

Active user: Data disimpan selagi account aktif.
Deleted user: Data anonymized/deleted mengikut cascade (Section 64).
Inactive user (tiada login > 2 tahun): Email reminder → jika tiada response 30 hari → account suspension notice.

IP addresses dalam logs: Anonymize selepas 12 bulan (ganti last octet dengan 0).
Example: 192.168.1.100 → 192.168.1.0

Session data: Padam selepas expire.
Verification codes: Padam selepas consumed atau expired.
```

#### 79.3 Data Export (Right of Access)

```txt
User boleh request export data mereka:

GET /api/v1/profile/export-data

Export contains:
- Profile info
- Project list (names, types, creation dates)
- Activity log (user actions sahaja)
- Domain list
- Backup list (metadata, bukan files)

Format: JSON atau ZIP
Processing time: Async — siap dalam 24 jam, link dihantar via email.
Export link valid: 48 jam sahaja.

Data TIDAK included dalam export:
- Encrypted env variables (security)
- Other users' data
- System logs
```

#### 79.4 Right to Erasure

```txt
User boleh request delete account dari Profile page.

Trigger: Section 64 (User Deletion Cascade).

Selepas deletion request:
- 7 hari grace period (boleh cancel).
- Selepas 7 hari: data dipadam/anonymized.
- Confirmation email dihantar.
- Activity logs anonymized (bukan dipadam — untuk platform security).
```

---

### Section 80 — Node Draining Procedure

Bila admin perlu ambil node offline untuk maintenance atau decommission.

#### 80.1 Drain vs Maintenance Mode

```txt
Maintenance Mode:
- Node masih running.
- Projects kekal running.
- Tiada project baru boleh di-assign ke node ini.
- Admin boleh access node untuk maintenance.
- Node status: "maintenance"

Drain Mode:
- Node dalam proses dipindahkan semua projects keluar.
- Selepas semua projects dipindah: node boleh dimatikan.
- Node status: "draining"
```

#### 80.2 Drain Flow

```txt
Admin klik "Drain Node" pada MY-Node-01:

1. Node status = "draining"
2. Tiada project baru boleh diassign ke node ini.
3. Panel list semua running projects dalam node.
4. Admin pilih destination node untuk setiap project (atau auto-assign).
5. Panel queue migration jobs satu per satu.

Per project migration:
a. Create backup project (files + PostgreSQL).
b. Transfer backup ke destination node.
c. Restore project pada destination node.
d. Update DNS routing ke destination node.
e. Verify project running pada destination node.
f. Stop project pada source node.
g. Mark project migration complete.

6. Selepas semua projects migrated → node status = "offline".
7. Admin boleh safely shutdown server.

UI mesti tunjuk:
- Progress: "8 / 12 projects migrated"
- Status setiap project migration
- Estimated time remaining
- Cancel drain button (akan reverse partially migrated projects)
```

#### 80.3 Migration Failure Handling

```txt
Jika satu project migration gagal:
- Log error.
- Mark project migration sebagai "failed".
- Continue dengan project seterusnya (jangan stop semua).
- Alert admin dengan detail kegagalan.
- Admin boleh retry failed migration secara manual.

Project yang gagal migrated kekal running pada source node.
Drain tidak boleh complete selagi ada failed migrations.
```

---

### Section 81 — Project Ownership Transfer

PRD asal menyebut "Transfer ownership" dalam Settings page tapi tiada spec.

#### 81.1 Transfer Flow

```txt
Owner project boleh transfer ownership kepada user lain.

Syarat:
- Penerima mesti sudah ada account SpiderWeb.
- Penerima mesti sudah ada GitHub connected.
- Penerima mesti ada resource quota yang cukup (project limit, storage).
- Owner boleh transfer kepada project member ATAU user luar project.

Flow:
1. Owner buka /projects/<id>/settings → Danger Zone → Transfer Ownership.
2. Masukkan email penerima.
3. Panel check penerima wujud dan ada quota.
4. Panel hantar invitation email kepada penerima.
5. Penerima click Accept dalam email (valid 48 jam).
6. Ownership berpindah.
7. Owner lama kekal sebagai "Admin" role dalam project (boleh dibuang kemudian).
8. Activity log: "project.ownership_transferred".

Jika penerima reject atau invitation expired:
- Transfer dibatalkan.
- Owner asal kekal sebagai owner.
- Notification dihantar kepada owner asal.
```

---

### Section 82 — Timezone & Date Handling

#### 82.1 Standard

```txt
Semua timestamps dalam SpiderWeb:
- Disimpan dalam UTC dalam database.
- Dihantar dalam ISO 8601 format via API: "2026-06-26T10:30:00Z"
- Dipaparkan dalam timezone user di UI.

User timezone:
- Detect dari browser: Intl.DateTimeFormat().resolvedOptions().timeZone
- User boleh override dalam Profile settings.
- Disimpan dalam users table: timezone VARCHAR(50) DEFAULT 'UTC'

Example UI display:
API returns: "2026-06-26T10:30:00Z"
User in KL:  "26 Jun 2026, 6:30 PM (MYT)"
User in UTC: "26 Jun 2026, 10:30 AM (UTC)"
```

#### 82.2 Relative Time Display

```txt
Untuk activity logs dan timestamps yang recent:
- < 1 minit: "Just now"
- < 1 jam:   "23 minutes ago"
- < 24 jam:  "5 hours ago"
- < 7 hari:  "3 days ago"
- Lebih lama: full date "26 Jun 2026"

Hover / tooltip: tunjuk full timestamp dalam UTC.
```

---

### Section 83 — Panel UI Responsiveness & Accessibility

Panel SpiderWeb mesti berfungsi pada pelbagai device.

#### 83.1 Responsive Breakpoints

```txt
SpiderWeb panel mesti support:

Desktop (≥1280px):
- Full sidebar + main content
- All features available

Tablet (768px - 1279px):
- Collapsible sidebar
- All features available
- Some tables menjadi card layout

Mobile (< 768px):
- Bottom navigation bar (gantikan sidebar)
- Critical features: project status, start/stop, logs
- File editor: read-only (editing susah di mobile)
- Full feature parity tidak diperlukan di mobile MVP
```

#### 83.2 Accessibility Requirements

```txt
Panel mesti ikut WCAG 2.1 Level AA minimum.

Critical requirements:
1. Keyboard navigation penuh untuk semua interactive elements.
2. Focus indicator visible (outline) pada semua focusable elements.
3. Color contrast ratio minimum 4.5:1 untuk body text.
4. Semua images mesti ada alt text.
5. Form fields mesti ada labels (bukan placeholder sahaja).
6. Error messages mesti programmatically associated dengan field.
7. Modal dialogs mesti trap focus dan support Escape key.
8. Loading states mesti ada aria-busy atau live regions.
9. Icons yang functional mesti ada aria-label.

Testing:
- Manual keyboard navigation test setiap page.
- Screen reader test (VoiceOver atau NVDA).
- Contrast checker pada color palette.
```

---

### Section 84 — Reserved & Future: Multi-Environment Projects

Ini adalah spec untuk future feature tetapi perlu dipertimbangkan dalam architecture MVP supaya tidak perlu refactor besar.

#### 84.1 Concept

```txt
Future: User boleh ada multiple environments per project.

Environment types:
- production   (main, live)
- staging      (testing sebelum production)
- preview      (per-branch deployments)

MVP decision:
Satu project = satu environment (production sahaja).

Architecture consideration untuk MVP:
- Jangan hardcode "production" dalam schema.
- projects table boleh ada environment ENUM column dari awal.
- environment VARCHAR(20) DEFAULT 'production'

Ini memudahkan future multi-environment tanpa schema change besar.
```

#### 84.2 Preview Deployments (Future)

```txt
Future feature:
Setiap GitHub branch boleh dapat preview URL.

Example:
main branch        → app.example.com (production)
feature/new-auth   → feature-new-auth--app.spiderweb.host (preview)
fix/bug-123        → fix-bug-123--app.spiderweb.host (preview)

Preview environments:
- Auto-created bila branch push.
- Auto-deleted bila branch deleted atau merged.
- Guna project env variables dari production (dengan override boleh).
- Tidak boleh guna custom domain (default subdomain sahaja).

MVP: Tidak ada. Catat untuk future.
```

---

## Pindaan Schema Tambahan

### Table Baru: jobs (Queue System)

```txt
jobs
id
type              -- "deploy" | "backup" | "ssl_issue" | "dns_verify" | "email_send" | etc.
payload           -- JSONB
status            -- "pending" | "running" | "done" | "failed" | "cancelled"
priority          -- INTEGER (1 highest, 10 lowest)
attempts          -- INTEGER DEFAULT 0
max_attempts      -- INTEGER DEFAULT 3
run_at            -- TIMESTAMPTZ (untuk scheduled jobs)
started_at        -- TIMESTAMPTZ
completed_at      -- TIMESTAMPTZ
failed_at         -- TIMESTAMPTZ
error_message     -- TEXT
created_at        -- TIMESTAMPTZ
```

### Table Baru: dead_letter_jobs

```txt
dead_letter_jobs
id
original_job_id
type
payload
error_message
last_attempt_at
created_at
```

### UPDATE: users table

```txt
users:
id
email
email_verified_at
name
avatar_url
role
status
timezone              ← BARU: user timezone preference
totp_secret_encrypted ← BARU: untuk admin MFA
totp_enabled          ← BARU: boolean
totp_backup_codes     ← BARU: JSONB array (hashed)
data_export_requested_at ← BARU: untuk GDPR data export
created_at
updated_at
```

### Table Baru: api_keys (Future)

```txt
api_keys
id
user_id
name              -- user-given label
key_hash          -- SHA-256 hash of the key
key_prefix        -- first 8 chars for display: "sw_live_ab12..."
scopes            -- JSONB array
last_used_at
expires_at        -- nullable
created_at
revoked_at
```

---

## Non-Negotiable Requirements Tambahan v3.2

```txt
32. Let's Encrypt wildcard cert untuk *.spiderweb.host mesti auto-renew.
33. Email delivery mesti ada fallback provider — auth tidak boleh 100% bergantung pada satu provider.
34. Semua sensitive data mesti enkripsi dengan AES-256-GCM.
35. Encryption key TIDAK boleh disimpan dalam database atau git.
36. Super Admin WAJIB setup TOTP MFA.
37. Admin session idle timeout: 30 minit (lebih ketat dari user).
38. Reserved slugs tidak boleh digunakan sebagai project name.
39. PORT dan DATABASE_URL adalah managed env vars — user mesti dapat warning jika cuba override.
40. Semua API errors mesti ada requestId untuk debugging.
41. User boleh export data mereka dalam masa 24 jam selepas request.
42. Node drain mesti complete semua migrations sebelum node boleh dimatikan.
43. Project environment column mesti ada dalam schema dari hari pertama (default: 'production').
44. Semua timestamps disimpan dalam UTC.
```

---

## Success Criteria Tambahan v3.2

```txt
27. SSL auto-renew berjaya tanpa manual intervention.
28. Email delivery gagal → fallback provider aktif dalam < 1 minit.
29. Encryption key rotated → semua secrets boleh di-decrypt dengan key baru.
30. Admin login tanpa TOTP ditolak (jika MFA enabled).
31. User request data export → ZIP diterima dalam 24 jam.
32. Node drain complete → semua projects running pada destination node.
33. Reserved slug "admin" tidak boleh digunakan sebagai project name.
34. API error response mengandungi requestId yang boleh di-trace dalam logs.
```

---

## Ringkasan Tambahan v3.1 → v3.2

| Section | Perkara |
|---------|---------|
| 12.4 | Webhook HMAC signature validation |
| 35.5 | Zero-downtime deploy decision (MVP: short downtime OK) |
| 35.6 | Concurrent deployment queue behavior |
| 44.4 | API versioning /api/v1/ prefix |
| 61   | Real-time logs via SSE + log retention policy |
| 62   | Extended rate limiting + file upload size limits |
| 63   | Project deletion cascade (soft delete 7 hari) |
| 64   | User deletion cascade + pre-deletion check |
| 65   | Agent lifecycle + upgrade strategy |
| 66   | Port allocation + container network isolation |
| 67   | Build cache strategy |
| 68   | Wildcard DNS + central ingress architecture |
| 69   | PostgreSQL version (16) + PgBouncer connection pooling |
| 70   | Error & suspension pages spec |
| 71   | Health check endpoints |
| 72   | SSL certificate management + Let's Encrypt rate limits |
| 73   | Email delivery service + templates list |
| 74   | Queue system architecture + dead letter queue |
| 75   | Encryption standards (AES-256-GCM) + key management |
| 76   | Reserved slugs + reserved env var names |
| 77   | API standards: pagination, error format, API keys |
| 78   | Admin MFA (TOTP) + session policy |
| 79   | GDPR compliance + data export + right to erasure |
| 80   | Node draining procedure |
| 81   | Project ownership transfer flow |
| 82   | Timezone & date handling standards |
| 83   | Panel UI responsiveness + accessibility (WCAG 2.1 AA) |
| 84   | Multi-environment architecture consideration (Future) |

**Jumlah Non-Negotiable Requirements: 21 → 44**
**Jumlah Success Criteria: 17 → 34**

---

### Section 85 — Deployment Rollback

#### 85.1 Kenapa Rollback Penting

```txt
Scenario biasa:
User deploy version baru → app crash → perlu revert dengan cepat.
Tanpa rollback, user kena redeploy commit lama secara manual (lambat, messy).

SpiderWeb mesti support rollback ke deployment sebelumnya.
```

#### 85.2 Deployment History

```txt
Panel simpan history semua deployments per project.

deployments table (tambah fields):
id
project_id
commit_sha
commit_message
commit_author
branch
status          -- "queued" | "building" | "running" | "failed" | "rolled_back" | "superseded"
build_snapshot  -- path ke build artifact (untuk rollback tanpa rebuild)
deployed_at
superseded_at   -- masa bila deployment ini digantikan oleh deployment baru
created_at

UI: Project → Deployments → History list (10 terbaru)
Setiap entry tunjuk: commit message, branch, status, masa, "Rollback" button.
```

#### 85.3 Rollback Flow

```txt
User klik "Rollback" pada deployment D-003:

1. Panel check D-003 ada build_snapshot.
2. Jika ada snapshot → rollback tanpa rebuild (fast path).
3. Jika tiada snapshot → trigger redeploy dari commit_sha D-003 (slow path).
4. Create deployment record baru D-005 dengan status "building".
5. Note dalam D-005: "Rollback dari D-003".
6. D-004 (deployment semasa) mark sebagai "rolled_back".
7. Bila D-005 running → traffic switch ke D-005.
8. Notification: "Rollback ke D-003 berjaya."

Fast path (snapshot tersedia):
- Guna build artifact yang dah ada.
- Skip build step.
- Rollback masa < 60 saat.

Slow path (tiada snapshot):
- Guna commit_sha untuk checkout code lama.
- Run full build semula.
- Sama seperti fresh deployment.
- Masa bergantung kepada build time project.
```

#### 85.4 Build Snapshot Retention

```txt
Simpan build snapshot untuk:
- 5 deployments terbaru per project.
- Snapshots lama dipadam secara automatic (storage saving).

Storage estimate: 50-200MB per snapshot bergantung pada project size.
Storage limit snapshot: Included dalam project storage quota.

Jika project storage hampir penuh:
- Padam snapshots yang paling lama dulu.
- Kekal minimum 2 snapshots (terbaru dan sebelumnya).
```

---

### Section 86 — Project Monitoring & Alerting

#### 86.1 Uptime Monitoring

```txt
SpiderWeb monitor setiap running project secara automatic.

Monitoring method:
- HTTP GET ke / (atau custom health path yang user set).
- Interval: setiap 60 saat.
- Timeout: 10 saat.
- Dari: Panel sendiri (bukan dari luar) — monitor internal response.

Status:
- "up"      : response 2xx dalam < timeout.
- "degraded": response 2xx tapi lambat (> 5 saat).
- "down"    : timeout atau response non-2xx.

Response time tracking:
- Simpan response time setiap check.
- Tunjuk average response time dalam Project Overview.
- Graph: 24 jam terakhir.

Simpan dalam: project_checks table
id
project_id
status
response_time_ms
http_status
checked_at
```

#### 86.2 Resource Monitoring

```txt
Agent report resource usage setiap 30 saat kepada Panel.

Metrics yang dikumpul:
- cpu_percent     : CPU usage container (%)
- memory_mb       : Memory usage (MB)
- memory_limit_mb : Container memory limit (MB)
- rx_bytes        : Network bytes received (rolling 30s)
- tx_bytes        : Network bytes sent (rolling 30s)

Simpan dalam: project_metrics table (time-series)
id
project_id
cpu_percent
memory_mb
memory_limit_mb
rx_bytes
tx_bytes
recorded_at

Retention: 7 hari (kemudian aggregate ke hourly averages, simpan 30 hari)

UI: Project → Metrics → graphs untuk CPU, Memory, Network
```

#### 86.3 Alert Rules

```txt
User boleh set alert rules per project.

Default alerts (auto-enabled):
1. Downtime alert — project down > 2 minit berturut-turut.
2. Memory alert — memory > 90% limit selama 5 minit.

Optional alerts (user enable/disable):
3. Slow response — response time > 3 saat selama 10 minit.
4. CPU alert — CPU > 80% selama 10 minit.
5. Deployment failed — setiap kali deploy gagal.

Alert delivery:
- Email (default ON).
- In-panel notification (default ON).
- Future: Webhook, Slack, Telegram.

Alert suppression:
- Jangan hantar alert berulang setiap minit.
- Resend selepas 1 jam jika masalah masih berterusan.
- "Resolved" notification bila masalah selesai.
```

---

### Section 87 — Resource Quotas & Plan Tiers

```txt
PENTING: Tanpa quota definition, semua feature lain tidak boleh di-implement dengan betul.
Schema, validation, billing — semua bergantung kepada plan limits.
```

#### 87.1 Plan Tiers (MVP)

```txt
MVP: 2 tiers sahaja. Tambah lebih kemudian.

┌─────────────────────────────────────────────────────────────┐
│ QUOTA                    │ FREE          │ PRO             │
├─────────────────────────────────────────────────────────────┤
│ Projects                 │ 2             │ 10              │
│ Project storage          │ 512 MB        │ 5 GB            │
│ PostgreSQL databases     │ 1             │ 5               │
│ PostgreSQL storage (per) │ 256 MB        │ 2 GB            │
│ Custom domains           │ 0             │ 3 per project   │
│ Team members per project │ 1 (solo only) │ 5               │
│ Monthly bandwidth        │ 5 GB          │ 100 GB          │
│ Log retention            │ 7 hari        │ 30 hari         │
│ Backup retention         │ 3 backups     │ 10 backups      │
│ Deployment history       │ 5             │ 20              │
│ Build timeout            │ 5 minit       │ 15 minit        │
│ Container RAM            │ 256 MB        │ 512 MB          │
│ Container CPU            │ 0.25 vCPU     │ 0.5 vCPU        │
│ Support                  │ Community     │ Email (48h SLA) │
└─────────────────────────────────────────────────────────────┘

Pricing: Phase 6 (billing). Semasa MVP: semua user dapat FREE tier.
```

#### 87.2 Quota Enforcement

```txt
Bila user cuba melebihi quota:

Create project (dah ada 2 pada FREE):
→ 403: "Anda telah mencapai had 2 project untuk plan Free. Upgrade ke Pro untuk tambah lebih."

Upload file (melebihi storage):
→ 413: "Storage project anda penuh (512MB/512MB). Padam fail lama atau upgrade ke Pro."

Add custom domain (pada FREE):
→ 403: "Custom domain memerlukan plan Pro."

Add team member (pada FREE):
→ 403: "Plan Free hanya untuk penggunaan solo. Upgrade ke Pro untuk jemput ahli pasukan."

Deployment exceed build timeout:
→ Deploy gagal: "Build melebihi had masa 5 minit. Optimize build anda atau upgrade ke Pro."
```

#### 87.3 Quota Storage dalam Schema

```txt
UPDATE: users table
plan              -- "free" | "pro" (default: "free")
plan_expires_at   -- nullable (untuk future billing)

Quota check dilakukan real-time semasa setiap operation.
Jangan cache quota status — semak langsung dari DB.

Admin boleh set custom quota per user (override plan limit).
Guna dalam users table:
custom_quota -- JSONB nullable (override specific limits sahaja)
Contoh: { "projects": 5 } → user ini dapat 5 projects walaupun FREE.
```

---

### Section 88 — Member Permission Matrix

#### 88.1 Roles

```txt
Setiap project ada 4 roles:

OWNER   — Pemilik project. Satu sahaja. Boleh transfer ownership.
ADMIN   — Trusted member. Boleh manage semua kecuali transfer ownership.
DEVELOPER — Regular team member. Boleh buat kerja tapi tidak boleh manage settings.
VIEWER  — Read-only access. Untuk client atau stakeholder.
```

#### 88.2 Permission Matrix

```txt
Gunakan ✓ = Dibenarkan, ✗ = Tidak dibenarkan

FEATURE                             │ OWNER │ ADMIN │ DEV │ VIEWER
────────────────────────────────────┼───────┼───────┼─────┼───────
VIEW project overview               │   ✓   │   ✓   │  ✓  │   ✓
VIEW real-time logs                 │   ✓   │   ✓   │  ✓  │   ✓
VIEW metrics / monitoring           │   ✓   │   ✓   │  ✓  │   ✓
VIEW deployment history             │   ✓   │   ✓   │  ✓  │   ✓
────────────────────────────────────┼───────┼───────┼─────┼───────
TRIGGER manual deploy               │   ✓   │   ✓   │  ✓  │   ✗
ROLLBACK deployment                 │   ✓   │   ✓   │  ✓  │   ✗
START / STOP / RESTART project      │   ✓   │   ✓   │  ✓  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
VIEW env variables (non-secret)     │   ✓   │   ✓   │  ✓  │   ✗
VIEW env variables (secret)         │   ✓   │   ✓   │  ✗  │   ✗
ADD / EDIT env variables            │   ✓   │   ✓   │  ✗  │   ✗
DELETE env variables                │   ✓   │   ✓   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
ADD custom domain                   │   ✓   │   ✓   │  ✗  │   ✗
DELETE custom domain                │   ✓   │   ✓   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
CREATE PostgreSQL database          │   ✓   │   ✓   │  ✗  │   ✗
VIEW database credentials           │   ✓   │   ✓   │  ✗  │   ✗
DELETE database                     │   ✓   │   ✓   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
CREATE backup                       │   ✓   │   ✓   │  ✗  │   ✗
RESTORE backup                      │   ✓   │   ✓   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
INVITE members                      │   ✓   │   ✓   │  ✗  │   ✗
CHANGE member role                  │   ✓   │   ✓   │  ✗  │   ✗
REMOVE member                       │   ✓   │   ✓   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
EDIT project settings (name, etc.)  │   ✓   │   ✓   │  ✗  │   ✗
CHANGE GitHub repository            │   ✓   │   ✗   │  ✗  │   ✗
TRANSFER ownership                  │   ✓   │   ✗   │  ✗  │   ✗
DELETE project                      │   ✓   │   ✗   │  ✗  │   ✗
────────────────────────────────────┼───────┼───────┼─────┼───────
VIEW billing / plan                 │   ✓   │   ✗   │  ✗  │   ✗
```

#### 88.3 Permission Enforcement

```txt
Permission checks MESTI dilakukan di backend — bukan frontend sahaja.

Setiap API request semak:
1. User authenticated? (401 jika tidak)
2. User adalah member project ini? (403 jika tidak)
3. User role mempunyai permission untuk action ini? (403 jika tidak)

Error response:
403 "Anda tidak mempunyai permission untuk melakukan tindakan ini."

Jangan expose "apa permission yang diperlukan" dalam error message (security).

project_members table:
id
project_id
user_id
role           -- "owner" | "admin" | "developer" | "viewer"
invited_by
joined_at
created_at
```

---

### Section 89 — Log Search & Filtering

Section 61 cover real-time log streaming. Section ini cover searchable log history.

#### 89.1 Log Storage

```txt
Logs disimpan dalam dedicated log storage (bukan main PostgreSQL).

Options (pilih satu):
A. PostgreSQL dengan partition by date (simple, no extra infra)
B. ClickHouse (fast, tapi extra infra)
C. Loki (Grafana ecosystem, tapi complex)

MVP recommendation: PostgreSQL dengan partition.
Cukup untuk ratusan users. Scale ke ClickHouse bila perlu.

project_logs table (partitioned by day):
id
project_id
deployment_id  -- nullable (log dari build vs runtime)
level          -- "debug" | "info" | "warn" | "error"
source         -- "stdout" | "stderr" | "system" | "deploy"
message        -- TEXT
timestamp      -- TIMESTAMPTZ

Index: (project_id, timestamp DESC) — untuk fast retrieval.
Index: (project_id, level, timestamp DESC) — untuk filter by level.
```

#### 89.2 Log API

```txt
GET /api/v1/projects/:id/logs

Query parameters:
level      : "error" | "warn" | "info" | "debug" (optional, default: all)
source     : "stdout" | "stderr" | "system" | "deploy" (optional)
search     : keyword search dalam message (optional, max 100 chars)
from       : ISO 8601 datetime (optional, default: 24 jam lepas)
to         : ISO 8601 datetime (optional, default: sekarang)
limit      : 100-1000 (default: 200)
cursor     : pagination cursor

Response:
{
  "logs": [
    {
      "id": "...",
      "level": "error",
      "source": "stderr",
      "message": "Cannot read property 'x' of undefined",
      "timestamp": "2026-06-26T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1500,
    "hasMore": true,
    "nextCursor": "..."
  }
}

Keyword search: ILIKE pada message column. Bukan full-text search untuk MVP.
Future: full-text search dengan PostgreSQL tsvector atau ClickHouse.
```

#### 89.3 Log UI

```txt
Project → Logs page:

Toolbar:
[All Levels ▼] [All Sources ▼] [Search...    ] [From: date] [To: date] [Export]

Log list:
- Colour-coded by level: error=red, warn=yellow, info=blue, debug=grey.
- Timestamp (relative + absolute on hover).
- Level badge.
- Source badge.
- Message text (wrap long lines).
- Click message → expand full raw log.

Auto-refresh:
- Toggle "Live" mode untuk stream new logs setiap 5 saat.
- Bila "Live" ON → search dan filter disabled (streaming mode).

Export:
- Export current filtered logs sebagai .txt atau .json.
- Max export: 10,000 baris.
```

---

### Section 90 — SpiderWeb CLI (Future)

Dokumentasikan sekarang supaya architecture sedia dari awal.

#### 90.1 Purpose

```txt
SpiderWeb CLI membolehkan developer:
- Deploy dari terminal tanpa buka panel.
- View logs dari terminal.
- Manage env variables dari terminal.
- Useful untuk CI/CD pipelines.

Install:
npm install -g @spiderweb/cli
atau
npx @spiderweb/cli <command>
```

#### 90.2 Commands

```txt
Authentication:
sw login              -- Login via browser OAuth (atau API key)
sw logout
sw whoami

Project management:
sw projects list
sw projects create
sw link               -- Link current directory ke project

Deployment:
sw deploy             -- Deploy current directory
sw deploy --branch main
sw rollback           -- Rollback ke deployment sebelumnya
sw status             -- Status deployment terkini

Logs:
sw logs               -- Stream logs real-time
sw logs --tail 100
sw logs --level error

Environment variables:
sw env list
sw env set KEY=VALUE
sw env delete KEY
sw env pull           -- Download env vars ke .env.local (tidak sync secret)

Domain:
sw domains list
sw domains add example.com

Database:
sw db list
sw db connect         -- Open psql session ke database project

General:
sw --help
sw --version
```

#### 90.3 CLI Architecture

```txt
CLI guna sama SpiderWeb REST API (/api/v1/).
Tiada API yang exclusive untuk CLI.
API key atau session token untuk auth.

CLI config file: ~/.config/spiderweb/config.json
{
  "apiUrl": "https://panel.spiderweb.host",
  "token": "sw_live_...",
  "defaultProject": "my-project-id"
}

MVP: CLI tidak perlu. Document untuk future.
Build CLI bila API stable (selepas v1.0).
```

---

### Section 91 — In-Panel Notification Center

#### 91.1 Concept

```txt
Setiap user ada notification bell (🔔) di header panel.
Real-time in-app notifications untuk events berkaitan projek mereka.

Notifications berbeza dari emails:
- Email: untuk events penting (deploy failed, downtime, security).
- In-panel: semua events termasuk yang kurang kritikal.
```

#### 91.2 Events Yang Generate Notification

```txt
TINGGI (email + in-panel):
- Deploy failed
- Project down > 2 minit
- SSL cert expiry dalam 7 hari
- Database storage > 90%

SEDERHANA (in-panel sahaja, email optional):
- Deploy successful
- Rollback successful
- Custom domain verified
- New member joined project
- Member left project
- Backup completed
- Backup failed

RENDAH (in-panel sahaja):
- Member role changed
- Env variables updated (notify Owner/Admin)
- GitHub repository changed

System:
- Platform maintenance announcement (Admin create)
- Node migration completed (Admin create)
```

#### 91.3 Notification Table

```txt
notifications
id
user_id
project_id     -- nullable (ada notification yang tidak berkaitan project)
type           -- "deploy_success" | "deploy_failed" | "project_down" | etc.
title          -- "Deploy berjaya"
body           -- "Project my-app berjaya deploy dari commit abc1234."
action_url     -- "/projects/my-app/deployments" (link bila click notif)
read_at        -- nullable (null = unread)
created_at
```

#### 91.4 Delivery

```txt
Real-time delivery via SSE (sama teknologi seperti log streaming).

Endpoint: GET /api/v1/notifications/stream
Client subscribe bila panel dibuka.
Server push new notifications tanpa polling.

Fallback: Polling setiap 30 saat jika SSE connection gagal.

Badge count:
- Tunjuk count unread notifications pada bell icon.
- Mark as read bila user klik notification.
- "Mark all as read" button.

Retention:
- Simpan notifications 90 hari.
- Padam yang lebih lama secara automatic.
```

---

## Pindaan Schema Tambahan v3.3

### Table Baru: project_checks (Uptime Monitoring)

```txt
project_checks
id
project_id
status           -- "up" | "degraded" | "down"
response_time_ms -- INTEGER nullable
http_status      -- INTEGER nullable
error_message    -- TEXT nullable
checked_at       -- TIMESTAMPTZ

Index: (project_id, checked_at DESC)
Retention: 30 hari
```

### Table Baru: project_metrics (Resource Monitoring)

```txt
project_metrics
id
project_id
cpu_percent      -- DECIMAL(5,2)
memory_mb        -- INTEGER
memory_limit_mb  -- INTEGER
rx_bytes         -- BIGINT
tx_bytes         -- BIGINT
recorded_at      -- TIMESTAMPTZ

Index: (project_id, recorded_at DESC)
Retention: 7 hari granular, 30 hari hourly aggregate
```

### Table Baru: alert_rules

```txt
alert_rules
id
project_id
type             -- "downtime" | "memory" | "cpu" | "slow_response" | "deploy_failed"
threshold        -- JSONB (e.g., { "percent": 90, "duration_minutes": 5 })
enabled          -- BOOLEAN DEFAULT true
notify_email     -- BOOLEAN DEFAULT true
notify_inpanel   -- BOOLEAN DEFAULT true
created_at
```

### Table Baru: notifications

```txt
notifications
id
user_id
project_id       -- nullable
type             -- VARCHAR(50)
title            -- VARCHAR(200)
body             -- TEXT
action_url       -- VARCHAR(500) nullable
read_at          -- TIMESTAMPTZ nullable
created_at
```

### UPDATE: deployments table

```txt
Tambah columns:
build_snapshot_path  -- VARCHAR(500) nullable (path ke build artifact)
rollback_of_id       -- INTEGER nullable (FK ke deployments.id)
```

### UPDATE: project_members table

```txt
role column ENUM expand:
"owner" | "admin" | "developer" | "viewer"
```

### UPDATE: users table

```txt
Tambah columns:
plan              -- VARCHAR(20) DEFAULT 'free'
plan_expires_at   -- TIMESTAMPTZ nullable
custom_quota      -- JSONB nullable
```

---

## Non-Negotiable Requirements Tambahan v3.3

```txt
45. Setiap project mesti ada uptime monitoring — check setiap 60 saat.
46. Deploy rollback mesti tersedia untuk sekurang-kurangnya 5 deployment terakhir.
47. Permission check MESTI dilakukan di backend — frontend check adalah optional UX sahaja.
48. VIEWER role tidak boleh melihat secret environment variables dalam apa jua keadaan.
49. Plan quota mesti dikuatkuasakan di backend — bukan client-side validation sahaja.
50. Log retention mengikut plan: Free = 7 hari, Pro = 30 hari.
51. Deployment rollback kembali ke state running dalam < 60 saat (fast path dengan snapshot).
```

---

## Success Criteria Tambahan v3.3

```txt
35. Uptime monitoring detect project down dan trigger alert dalam < 2 minit.
36. Rollback ke deployment sebelumnya berjaya dalam < 60 saat (fast path).
37. VIEWER role cuba access env vars → 403 dikembalikan.
38. FREE user cuba create project ke-3 → 403 dengan mesej upgrade.
39. Log search untuk keyword "error" return results dalam < 3 saat.
40. In-panel notification muncul dalam < 5 saat selepas event berlaku.
41. Resource metrics (CPU, RAM) ditunjuk dalam panel dengan < 30 saat lag.
```

---

## Ringkasan Tambahan v3.2 → v3.3

| Section | Perkara |
|---------|---------|
| 85   | Deployment rollback — history, snapshot, fast/slow path |
| 86   | Project monitoring & alerting — uptime, CPU/RAM, alert rules |
| 87   | Resource quotas & plan tiers — FREE vs PRO limits table |
| 88   | Member permission matrix — 4 roles × 22 features |
| 89   | Log search & filtering — storage, API, UI |
| 90   | SpiderWeb CLI — commands, architecture (Future) |
| 91   | In-panel notification center — SSE delivery, event types |

**Jumlah Non-Negotiable Requirements: 44 → 51**
**Jumlah Success Criteria: 34 → 41**

---

### Section 92 — Platform Status Page

#### 92.1 Purpose

```txt
URL: https://status.spiderweb.host
Public — tidak perlu login untuk akses.
Tunjuk health platform secara real-time kepada semua user dan orang awam.

Bila platform ada masalah, ini tempat pertama user pergi.
Tanpa status page: user flood support dengan soalan "adakah platform down?"
```

#### 92.2 Components Yang Dimonitor

```txt
Status page tunjuk status setiap komponen utama:

┌──────────────────────────────────────────────┐
│ SpiderWeb Status               ● All Systems  │
│                                  Operational  │
├──────────────────────────────────────────────┤
│ ● Panel (Web UI)              Operational     │
│ ● API                         Operational     │
│ ● Authentication              Operational     │
│ ● Deployment Pipeline         Operational     │
│ ● Build System                Operational     │
│ ● DNS & Routing               Operational     │
│ ● SSL Certificates            Operational     │
│ ● Node MY-01 (Kuala Lumpur)   Operational     │
│ ● Node SG-01 (Singapore)      Operational     │
│ ● PostgreSQL Service          Operational     │
│ ● Email Notifications         Operational     │
└──────────────────────────────────────────────┘

Status values:
● Operational     — berfungsi normal
◑ Degraded        — berfungsi tapi lambat / ada masalah kecil
● Partial Outage  — sebahagian users terjejas
● Major Outage    — tidak berfungsi untuk semua users
◐ Under Maintenance — sedang dalam maintenance (dijadualkan)
```

#### 92.3 Incident Management

```txt
Admin boleh create incident dari Admin Panel → Status → New Incident.

Incident fields:
- Title: "API response degraded"
- Affected components: [API, Deployment Pipeline]
- Severity: "investigating" | "identified" | "monitoring" | "resolved"
- Message: penjelasan untuk user (markdown supported)
- Notify users: checkbox (hantar email kepada semua affected users)

Incident updates:
Admin boleh tambah updates kepada incident yang sama.
Example flow:
  14:30 INVESTIGATING: "Kami sedang menyiasat laporan lambat API."
  14:45 IDENTIFIED:    "Punca dikenal pasti — database connection pool penuh."
  15:00 MONITORING:    "Fix telah diaplikasi. Kami memantau situasi."
  15:30 RESOLVED:      "Platform kembali normal. Semua services operational."

Incident history disimpan dan boleh dilihat oleh sesiapa di status page (90 hari).
```

#### 92.4 Scheduled Maintenance

```txt
Admin boleh jadualkan maintenance window:
- Start time + end time
- Affected components
- Message untuk user
- Notify users X jam sebelum (default: 24 jam)

Semasa maintenance window:
- Komponen tunjuk "Under Maintenance"
- User yang cuba deploy akan nampak: "Platform dalam maintenance hingga 15:00 UTC."

Status page auto-update bila maintenance selesai.
```

#### 92.5 Auto-Detection

```txt
Status page ada dua sumber data:
1. Admin-created incidents (manual).
2. Auto-detection dari internal monitoring.

Auto-detection:
Jika uptime check (Section 86) detect komponen down > 5 minit:
→ Auto-create incident dengan severity "investigating".
→ Admin dapat alert untuk update incident secara manual.

Auto-resolve:
Jika komponen kembali "up" selama 10 minit berturut-turut:
→ Auto-update incident ke "monitoring".
→ Admin mesti resolve secara manual (jangan auto-resolve tanpa human confirmation).
```

---

### Section 93 — Build-time vs Runtime Environment Variables

Ini critical untuk user yang guna Next.js, Vite, atau framework lain yang bake env vars pada build time.

#### 93.1 Dua Jenis Env Vars

```txt
RUNTIME env vars:
- Diload oleh server/container semasa application start.
- Boleh berubah tanpa redeploy — restart sahaja sudah cukup.
- Contoh: DATABASE_URL, JWT_SECRET, API_KEY, PORT.
- Cara akses dalam kod: process.env.API_KEY (server-side).

BUILD-TIME env vars:
- Di-embed ke dalam build artifact semasa proses build.
- TIDAK boleh berubah selepas build siap — perlu redeploy untuk update.
- Contoh Next.js: sebarang var bermula dengan NEXT_PUBLIC_.
- Contoh Vite: sebarang var bermula dengan VITE_.
- Cara akses dalam kod: process.env.NEXT_PUBLIC_API_URL (client-side).

Perbezaan kritikal:
RUNTIME  → tukar → restart → nilai baru aktif ✓
BUILD-TIME → tukar → mesti REDEPLOY → nilai baru aktif
```

#### 93.2 Cara SpiderWeb Handle Ini

```txt
SpiderWeb detect framework semasa deploy.

Jika framework = Next.js:
Sebarang env var bermula dengan NEXT_PUBLIC_ adalah build-time var.

Jika framework = Vite / SvelteKit:
Sebarang env var bermula dengan VITE_ atau PUBLIC_ adalah build-time var.

Panel behaviour:
Bila user edit env var yang build-time:
→ Tunjuk warning:
  "⚠ NEXT_PUBLIC_API_URL adalah build-time variable.
   Perubahan ini memerlukan redeploy untuk berkuat kuasa.
   Restart sahaja tidak akan update nilai ini."

Bila user klik Save pada build-time var:
→ Tanya: "Nak trigger redeploy sekarang? [Redeploy] [Simpan Sahaja]"
```

#### 93.3 Dalam Schema

```txt
project_env_vars table (tambah column):
is_build_time  -- BOOLEAN DEFAULT false
               -- SpiderWeb auto-set ini berdasarkan framework + prefix
               -- User tidak boleh set ini secara manual
```

---

### Section 94 — Graceful Shutdown (SIGTERM)

#### 94.1 Masalah Tanpa Graceful Shutdown

```txt
Scenario tanpa graceful shutdown:
User klik "Restart" → container SIGKILL serta-merta → requests yang sedang diproses terpotong
→ User dapat "Connection reset" error
→ Database transactions tergantung (potential data corruption)
→ File writes terhenti separuh jalan (corrupt files)
```

#### 94.2 Graceful Shutdown Flow

```txt
Bila SpiderWeb stop/restart/redeploy sesebuah container:

1. Agent hantar SIGTERM kepada container process.
2. Application mula graceful shutdown:
   - Berhenti accept request baru.
   - Selesaikan requests yang sedang berjalan.
   - Tutup database connections.
   - Flush pending writes.
3. SpiderWeb tunggu sehingga container exit sendiri.
4. Jika container tidak exit dalam grace period → hantar SIGKILL (paksa tutup).

Grace period:
Default: 30 saat
User boleh configure dalam project settings: 5s | 15s | 30s | 60s | 120s
Maximum: 120 saat (2 minit)

Kenapa ada maximum:
Untuk elak container "tersekat" dalam shutdown dan block deployment baru.
```

#### 94.3 Responsibiliti Developer

```txt
SpiderWeb handle SIGTERM dengan betul dari sisi infrastructure.
TAPI application mesti handle SIGTERM dalam code.

SpiderWeb tunjuk panduan dalam docs per runtime:

Node.js:
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

Python (Gunicorn):
SIGTERM handling built-in. Pastikan --timeout set dengan betul.

Jika application ignore SIGTERM:
Container akan dibunuh selepas grace period.
SpiderWeb tunjuk warning dalam deployment logs:
"⚠ Container tidak respond SIGTERM — dihentikan paksa selepas 30s."
```

#### 94.4 Dalam Schema

```txt
projects table (tambah column):
shutdown_timeout_seconds  -- INTEGER DEFAULT 30
```

---

### Section 95 — Outgoing Webhooks (Deploy Notifications)

#### 95.1 Purpose

```txt
User boleh configure SpiderWeb hantar HTTP POST ke URL mereka
bila sesuatu event berlaku.

Use cases:
- Notify Slack channel bila deploy berjaya.
- Notify Discord bila deploy gagal.
- Trigger CI pipeline lain selepas deploy.
- Update external dashboard.
- Notify team via custom internal tools.
```

#### 95.2 Supported Events

```txt
Events yang boleh trigger outgoing webhook:

deployment.success  — Deploy berjaya, project running.
deployment.failed   — Deploy gagal.
deployment.started  — Deploy mula (berguna untuk lock external systems).
rollback.success    — Rollback berjaya.
project.down        — Uptime monitor detect project down.
project.recovered   — Project kembali up selepas down.
```

#### 95.3 Webhook Configuration

```txt
Project → Settings → Webhooks → Add Webhook

Fields:
- URL: https://hooks.slack.com/services/xxx (destination)
- Events: checkbox untuk pilih events (boleh pilih lebih dari satu)
- Secret: optional HMAC secret (untuk verify payload di destination)
- Active: toggle on/off tanpa delete

Max webhooks per project: FREE = 1, PRO = 5.
```

#### 95.4 Payload Format

```txt
SpiderWeb hantar HTTP POST dengan JSON body:

{
  "event": "deployment.success",
  "timestamp": "2026-06-26T10:30:00Z",
  "project": {
    "id": "proj_abc123",
    "name": "my-app",
    "slug": "my-app"
  },
  "deployment": {
    "id": "dep_xyz789",
    "commitSha": "abc1234",
    "commitMessage": "fix: update API endpoint",
    "branch": "main",
    "deployedAt": "2026-06-26T10:30:00Z"
  },
  "actor": {
    "type": "github_push",
    "name": "amad"
  }
}

Headers:
Content-Type: application/json
X-SpiderWeb-Event: deployment.success
X-SpiderWeb-Signature: sha256=<hmac-hex>  (jika secret di-set)
X-SpiderWeb-Delivery: <unique-delivery-id>
```

#### 95.5 Delivery & Retry

```txt
Timeout per delivery: 10 saat.
Retry: 3x (selepas 30s, 2 minit, 10 minit) jika destination return non-2xx.

Webhook delivery log:
Panel tunjuk setiap delivery attempt:
- Event
- Destination URL
- HTTP status response
- Response time
- Payload (untuk debugging)
- Status: "success" | "failed" | "pending"

User boleh trigger "Redeliver" untuk hantar semula delivery yang gagal.

Schema:
outgoing_webhooks
id
project_id
url
events         -- JSONB array of event types
secret_encrypted
active
created_at

outgoing_webhook_deliveries
id
webhook_id
event
payload        -- JSONB
response_status
response_body
attempt_count
delivered_at
failed_at
```

---

### Section 96 — Node Capacity Dashboard

#### 96.1 Purpose

```txt
Admin perlu tahu bila nak tambah node baru.

Tanpa visibility ini:
- Node overload → semua projects dalam node jadi slow.
- Admin tidak tahu sehingga users complain.
- Terlambat untuk scale.

Admin Panel → Nodes → tunjuk capacity setiap node.
```

#### 96.2 Capacity Metrics Per Node

```txt
Untuk setiap node, tunjuk:

┌─────────────────────────────────────────────────────────┐
│ MY-01 (Kuala Lumpur)                         ● Healthy  │
├─────────────────────────────────────────────────────────┤
│ CPU Usage        ████████░░░░░░░░  52% / 100%           │
│ RAM Usage        ██████████░░░░░░  68% / 32 GB          │
│ Disk Usage       ████░░░░░░░░░░░░  28% / 500 GB         │
│ Active Projects  18 / 50                                 │
│ Running Builds   2 / 5 (concurrent build slots)         │
│ Network In       125 MB/s                                │
│ Network Out      89 MB/s                                 │
│ Uptime           47 hari 12 jam                         │
│ Agent Version    v1.2.3                                  │
└─────────────────────────────────────────────────────────┘
```

#### 96.3 Capacity Thresholds & Alerts

```txt
Admin alert bila node mencapai threshold:

CPU > 80% selama 10 minit:
→ Alert: "Node MY-01 CPU tinggi (85%). Pertimbangkan untuk tambah node baru."

RAM > 85%:
→ Alert: "Node MY-01 RAM hampir penuh (87%). Jangan assign project baru ke node ini."

Disk > 80%:
→ Alert: "Node MY-01 disk hampir penuh (82%). Bersihkan atau expand storage."

Active Projects > 80% max (e.g., 40/50):
→ Alert: "Node MY-01 hampir penuh (40/50 projects). Pertimbangkan tambah node."

Auto-action bila RAM > 90%:
→ Node status = "maintenance" (jangan assign project baru).
→ Admin mesti resolve secara manual.
```

#### 96.4 Project Assignment Strategy

```txt
Bila user create project baru, Panel auto-assign ke node.

Assignment algorithm:
1. Exclude nodes dengan status bukan "active".
2. Exclude nodes dengan RAM > 80%.
3. Exclude nodes dengan disk > 75%.
4. Dari nodes yang layak: pilih yang ada paling sikit projects (least loaded).
5. Jika semua nodes melebihi threshold → return error:
   "Platform sedang penuh. Sila hubungi support."

Admin boleh override auto-assignment dan pilih node secara manual.

nodes table (tambah columns):
max_projects          -- INTEGER DEFAULT 50
auto_assign_enabled   -- BOOLEAN DEFAULT true
```

---

## Pindaan Schema Tambahan v3.4

### Table Baru: incidents

```txt
incidents
id
title
severity       -- "investigating" | "identified" | "monitoring" | "resolved"
message        -- TEXT (markdown)
affected       -- JSONB array (komponen yang terjejas)
auto_detected  -- BOOLEAN DEFAULT false
created_at
resolved_at

incident_updates
id
incident_id
severity
message
created_at
```

### Table Baru: outgoing_webhooks

```txt
outgoing_webhooks
id
project_id
url
events            -- JSONB array
secret_encrypted  -- nullable
active            -- BOOLEAN DEFAULT true
created_at

outgoing_webhook_deliveries
id
webhook_id
event
payload           -- JSONB
response_status   -- INTEGER nullable
response_body     -- TEXT nullable
attempt_count     -- INTEGER DEFAULT 0
delivered_at      -- nullable
failed_at         -- nullable
created_at
```

### UPDATE: project_env_vars table

```txt
Tambah column:
is_build_time  -- BOOLEAN DEFAULT false
```

### UPDATE: projects table

```txt
Tambah column:
shutdown_timeout_seconds  -- INTEGER DEFAULT 30
```

### UPDATE: nodes table

```txt
Tambah columns:
max_projects           -- INTEGER DEFAULT 50
auto_assign_enabled    -- BOOLEAN DEFAULT true
```

---

## Non-Negotiable Requirements Tambahan v3.4

```txt
52. Platform mesti ada public status page di status.spiderweb.host.
53. SIGTERM mesti dihantar sebelum SIGKILL — grace period minimum 5 saat.
54. Build-time env vars (NEXT_PUBLIC_*, VITE_*) mesti tunjuk warning redeploy required.
55. Outgoing webhook delivery mesti include HMAC signature header jika secret di-set.
56. Node auto-assignment mesti exclude nodes yang RAM > 80% atau disk > 75%.
```

---

## Success Criteria Tambahan v3.4

```txt
42. Status page update dalam < 2 minit bila komponen down.
43. Container stop → SIGTERM → 30s grace → SIGKILL (bukan langsung SIGKILL).
44. User tukar NEXT_PUBLIC_* var → panel tunjuk redeploy warning.
45. Outgoing webhook berjaya deliver ke Slack dalam < 15 saat selepas deploy.
46. Node capacity dashboard tunjuk real-time CPU dan RAM dengan < 30 saat lag.
```

---

## Ringkasan Tambahan v3.3 → v3.4

| Section | Perkara |
|---------|---------|
| 92   | Platform status page — komponen, incident management, auto-detect |
| 93   | Build-time vs runtime env vars — NEXT_PUBLIC_ warning, redeploy |
| 94   | Graceful shutdown — SIGTERM → grace period → SIGKILL |
| 95   | Outgoing webhooks — Slack/Discord notify, HMAC, retry, delivery log |
| 96   | Node capacity dashboard — CPU/RAM/disk metrics, auto-assignment logic |

**Jumlah Non-Negotiable Requirements: 51 → 56**
**Jumlah Success Criteria: 41 → 46**

---

## Penutup — PRD v3.4 Complete

SpiderWeb PRD Addendum ini (v3.4) melengkapkan PRD asal v3.0 dengan 35 tambahan section (61–96).

**Jumlah keseluruhan Non-Negotiable Requirements: 21 → 56**
**Jumlah keseluruhan Success Criteria: 17 → 46**

Semua domain kritikal untuk production hosting panel telah dicovered:
security, operations, compliance, developer experience, monitoring, billing model, dan platform resilience.
