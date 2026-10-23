-- Mod Manager extension: library, mod packs, duplicates, conflicts, requirements,
-- updates and disk usage. Only uses core_modmanager / core_repository.

local M = {}
local PARALLEL_OK = { [1] = true, [2] = true, [3] = true, [10] = true }
local function parallelNow()
  local v = 3
  pcall(function() v = tonumber(settings.getValue("modNumParallelDownload", 3)) or 3 end)
  return v
end
local function setParallel(n)
  n = tonumber(n)
  if not PARALLEL_OK[n] then return false end
  local ok = pcall(function() settings.setState({ modNumParallelDownload = n }) end)
  log("I", "marketplaceModLib", "parallel downloads set to " .. tostring(n) .. " (ok=" .. tostring(ok) .. ")")
  return ok
end

local logTag = "marketplaceModLib"
local L = require("marketplaceModLibCore")

local LIB_FILE = "settings/marketplaceMod/library.json"
local HASH_FILE = "settings/marketplaceMod/hashes.json"
local EXPORT_DIR = "settings/marketplaceMod/loadouts/"
local SHARE_DIR = "Marketplace/shared/" -- <BeamNG user folder>/Marketplace/shared/
local PACK_FILE_MAX = 512 * 1024
local RECYCLE_DIR = "/mods_recycle/" -- outside /mods, so nothing in it is mounted
local OPS_PER_FRAME = 3
local SCAN_PER_FRAME = 2

local meta = nil
local metaDirty = false
local hashes = nil -- path -> { sig, sha1 }
local hashesDirty = false
local fileLists = {} -- name -> paths (in memory only)
local fileSig = {}
local ops = {} -- queued activate/deactivate operations
local opsTotal = 0
local scan = nil -- { queue = {...}, done, total, hashQueue = {...} }
local libDirty, libTimer = false, 0
local uiSeen = false

local function now() return os.time() end

local function loadMeta()
  if meta then return end
  meta = { tags = {}, fav = {}, loadouts = {}, recycle = {}, notes = {}, urating = {}, names = {}, authors = {}, covers = {},
    ignoreUpd = {}, notDeps = {}, activeAt = {}, cleanup = {}, settings = { keepVersions = 1, autoCheck = true, theme = "dark-orange" } }
  if not jsonReadFile then return end
  local ok, d = pcall(L.readData, LIB_FILE)
  if ok and type(d) == "table" then
    for _, k in ipairs({ "tags", "fav", "recycle", "loadouts", "notes", "urating", "names", "authors", "covers", "ignoreUpd", "notDeps", "activeAt", "cleanup", "settings" }) do if type(d[k]) == "table" then meta[k] = d[k] end end
    -- Lua JSON may turn arrays into objects: normalize lists
    local function arr(t) local o = {}; for _, v in pairs(t or {}) do o[#o + 1] = v end; return o end
    meta.loadouts = arr(meta.loadouts); meta.recycle = arr(meta.recycle); meta.cleanup = arr(meta.cleanup)
    for _, lo in ipairs(meta.loadouts) do lo.mods = arr(lo.mods) end
    for n, t in pairs(meta.tags) do meta.tags[n] = arr(t) end
  end
end
local function saveMeta()
  if meta and jsonWriteFile then pcall(jsonWriteFile, LIB_FILE, meta, true); metaDirty = false end
end
local function loadHashes()
  if hashes then return end
  hashes = {}
  if jsonReadFile then local ok, d = pcall(L.readData, HASH_FILE); if ok and type(d) == "table" then hashes = d end end
end

local function rawMods()
  local mods
  pcall(function() mods = core_modmanager and core_modmanager.getMods and core_modmanager.getMods() end)
  return type(mods) == "table" and mods or {}
end
local function rows() return L.rows(rawMods()) end
local function sigOf(r) return tostring(r.size) .. ":" .. tostring(r.modified) end

-- thumbnails from the Marketplace catalog (online icon/cover) when the mod is from the repository
local function thumbFor(r)
  local t
  if r.tagid and extensions and extensions.marketplaceMod and extensions.marketplaceMod.thumbFor then
    pcall(function() t = extensions.marketplaceMod.thumbFor(r.tagid) end)
  end
  return t
end

local function slimRow(r, issues)
  local info
  if r.tagid and extensions and extensions.marketplaceMod and extensions.marketplaceMod.infoFor then
    pcall(function() info = extensions.marketplaceMod.infoFor(r.tagid) end)
  end
  info = info or {}
  local req, mentioned = L.parseDepsAll(r.message)
  local reqIds, menIds = {}, {}
  for i, d in ipairs(req) do reqIds[i] = d.resourceId end
  for _, id in ipairs(info.requires or {}) do -- requirements known from the shared catalog
    local dup = false; for _, x in ipairs(reqIds) do if x == id then dup = true end end
    if not dup and id ~= r.resourceId then reqIds[#reqIds + 1] = id end
  end
  for i, d in ipairs(mentioned) do menIds[i] = d.resourceId end
  return { stack = L.stackKey(r), origTitle = r.title, origAuthor = r.author, resourceId = r.resourceId, verId = r.verId,
    ctitle = meta.names[r.name], cauthor = meta.authors[r.name], notes = meta.notes[r.name], urating = meta.urating[r.name],
    cover = meta.covers[r.name], activeAt = meta.activeAt[r.name], support = L.supportLinks(r.message),
    reqIds = reqIds, mentionIds = menIds,
    category = info.category, downloads = info.downloads, rating = info.rating, ratings = info.ratings, published = info.published,
    images = info.images, photos = r.photos, ignored = r.tagid and meta.ignoreUpd[r.tagid] or nil,
    name = r.name, title = r.title, author = r.author, file = r.file, active = r.active, size = r.size,
    added = r.added, modified = r.modified, updated = r.updated, type = r.type, unpacked = r.unpacked,
    tagid = r.tagid, version = r.version, repo = r.repo, icon = r.icon, thumb = thumbFor(r),
    key = L.keyOf(r), issues = issues and issues[r.name] or nil }
end

local lastHealth = nil
local function issuesMap()
  local m = {}
  if not lastHealth then return m end
  for _, g in ipairs(lastHealth.duplicates or {}) do for _, n in ipairs(g.mods) do m[n] = (m[n] or "") .. "D" end end
  for n, c in pairs(lastHealth.perMod or {}) do if c > 0 then m[n] = (m[n] or "") .. "C" end end
  for _, d in ipairs(lastHealth.deps or {}) do
    for _, x in ipairs(d.deps) do if x.status ~= "active" and d.active then m[d.mod] = (m[d.mod] or "") .. "R"; break end end
  end
  return m
end

local function recycleBytes()
  loadMeta()
  local b = 0
  for _, e in ipairs(meta.recycle) do b = b + (tonumber(e.size) or 0) end
  return b
end

local broken = {}
local function scanBroken()
  broken = {}
  pcall(function()
    for _, e in ipairs(core_modmanager.getPossiblyBrokenMods() or {}) do
      broken[#broken + 1] = { mod = tostring(e[1]), files = #(e[2] or {}), sample = (e[2] or {})[1] }
    end
  end)
end

local function sendLibrary()
  if not guihooks then return end
  loadMeta()
  local rs = rows()
  local issues = issuesMap()
  local list = {}
  for i, r in ipairs(rs) do list[i] = slimRow(r, issues) end
  local disk = L.disk(rs, recycleBytes())
  local los = {}
  for i, lo in ipairs(meta.loadouts) do
    local found, missing = L.resolve(rs, lo.mods)
    local size = 0
    local fset = {}
    for _, n in ipairs(found) do fset[n] = true end
    for _, r in ipairs(rs) do if fset[r.name] then size = size + r.size end end
    los[i] = { id = lo.id, desc = lo.desc, emoji = lo.emoji, size = size, pinned = lo.pinned, name = lo.name, alwaysOn = lo.alwaysOn or false, cover = lo.cover, count = #lo.mods,
      installed = #found, missing = #missing, mods = lo.mods }
  end
  guihooks.trigger("MarketplaceModLibrary", { mods = list, total = #rs, active = disk.activeCount, disk = disk,
    tags = meta.tags, fav = meta.fav, loadouts = los, recycle = meta.recycle,
    notes = meta.notes, settings = meta.settings, ignoreUpd = meta.ignoreUpd, notDeps = meta.notDeps,
    cleanup = meta.cleanup, broken = broken, stacks = #L.stacks(rs), parallel = parallelNow(),
    busy = #ops > 0 and { done = opsTotal - #ops, total = opsTotal } or nil })
end

local function sendHealth()
  if not guihooks then return end
  local h = lastHealth or {}
  guihooks.trigger("MarketplaceModHealth", { scanning = scan ~= nil,
    progress = scan and { done = scan.done, total = scan.total } or nil,
    duplicates = h.duplicates or {}, conflicts = h.conflicts or {}, deps = h.deps or {}, perMod = h.perMod or {},
    scannedAt = h.at })
end

-- ---------- health scan (lazy, a few zips per frame) ----------
local function readZipList(path)
  local files
  pcall(function()
    local zip = ZipArchive()
    if zip:openArchiveName(path, "r") then
      files = {}
      for _, v in pairs(zip:getFileList() or {}) do if type(v) == "string" then files[#files + 1] = v end end
      zip:close()
    end
  end)
  return files
end

local function startScan()
  local raw = rawMods()
  local rs = L.rows(raw)
  loadHashes()
  scan = { queue = {}, hashQueue = {}, done = 0, total = 0, rows = rs }
  for _, r in ipairs(rs) do
    if r.active and fileSig[r.name] ~= sigOf(r) then
      local repoList = raw[r.name] and L.repoFiles(raw[r.name])
      if repoList then fileLists[r.name] = repoList; fileSig[r.name] = sigOf(r)
      elseif r.unpacked then
        -- unpacked folder: list via FS
        pcall(function()
          local base = r.path or ""
          local fl = FS:findFiles(base, "*", -1, true, false) or {}
          local out = {}
          for _, f in ipairs(fl) do out[#out + 1] = f:sub(#base + 1) end
          fileLists[r.name] = out; fileSig[r.name] = sigOf(r)
        end)
      elseif r.path then scan.queue[#scan.queue + 1] = r end
    end
  end
  for _, r in ipairs(L.hashCandidates(rs)) do
    local h = hashes[r.path]
    if not (h and h.sig == sigOf(r)) then scan.hashQueue[#scan.hashQueue + 1] = r end
  end
  scan.total = #scan.queue + #scan.hashQueue
end

local function finishScan()
  local rs = scan.rows
  local hmap = {}
  for _, r in ipairs(rs) do local h = r.path and hashes[r.path]; if h and h.sig == sigOf(r) then hmap[r.name] = h.sha1 end end
  local conflicts, perMod = L.conflicts(rs, fileLists)
  lastHealth = { duplicates = L.duplicates(rs, hmap), conflicts = conflicts, perMod = perMod, deps = L.dependencies(rs), at = now() }
  scanBroken()
  scan = nil
  if hashesDirty and jsonWriteFile then pcall(jsonWriteFile, HASH_FILE, hashes, false); hashesDirty = false end
  sendHealth()
  libDirty = true
end

local function stepScan()
  if not scan then return end
  for _ = 1, SCAN_PER_FRAME do
    local r = table.remove(scan.queue, 1)
    if r then
      fileLists[r.name] = readZipList(r.path) or {}
      fileSig[r.name] = sigOf(r)
      scan.done = scan.done + 1
    else
      local h = table.remove(scan.hashQueue, 1)
      if not h then finishScan(); return end
      local sha
      pcall(function() sha = FS:hashFileSHA1(h.path) end)
      if sha then hashes[h.path] = { sig = sigOf(h), sha1 = sha }; hashesDirty = true end
      scan.done = scan.done + 1
      break -- hashing is heavier: one per frame
    end
  end
  if scan and scan.done % 10 == 0 then sendHealth() end
end

-- ---------- activation queue ----------
local function queueOps(activate, deactivate)
  for _, n in ipairs(activate) do ops[#ops + 1] = { "a", n } end
  for i, n in ipairs(deactivate) do ops[#ops + 1] = { "d", n, i < #deactivate } end -- last one saves state
  opsTotal = #ops
end

local function stepOps()
  for _ = 1, OPS_PER_FRAME do
    local op = table.remove(ops, 1)
    if not op then return end
    pcall(function()
      if op[1] == "a" then core_modmanager.activateMod(op[2])
      else core_modmanager.deactivateMod(op[2], op[3]) end
    end)
    if #ops == 0 then
      pcall(function() if core_modmanager.requestState then core_modmanager.requestState() end end)
      libDirty = true
    end
  end
end

-- ---------- UI API ----------
function M.uiLibrary() uiSeen = true; loadMeta(); sendLibrary() end
function M.uiHealth(force)
  uiSeen = true
  if force then fileSig = {}; lastHealth = nil end
  if not scan then startScan() end
  sendHealth()
end

function M.uiSetActive(name, active)
  pcall(function() if active then core_modmanager.activateMod(name) else core_modmanager.deactivateMod(name) end end)
  libDirty = true
end
function M.uiSetActiveMany(names, active)
  local a, d = {}, {}
  for _, n in pairs(names or {}) do if active then a[#a + 1] = n else d[#d + 1] = n end end
  queueOps(a, d)
end

function M.uiToggleFav(name)
  loadMeta(); meta.fav[name] = (not meta.fav[name]) or nil; metaDirty = true; libDirty = true
end
function M.uiSetTags(name, tags)
  loadMeta()
  local out, seen = {}, {}
  for _, t in pairs(tags or {}) do
    t = tostring(t):gsub("^%s+", ""):gsub("%s+$", ""):sub(1, 24)
    if t ~= "" and not seen[t:lower()] then seen[t:lower()] = true; out[#out + 1] = t end
  end
  meta.tags[name] = #out > 0 and out or nil
  metaDirty = true; libDirty = true
end

local function newId() return string.format("lo%x%04x", now(), math.random(0, 0xffff)) end

-- lo = { id?, name, alwaysOn, cover, mods = keys } or fromActive = true to capture the current active set
function M.uiSaveLoadout(lo)
  loadMeta()
  if type(lo) ~= "table" then return end
  local rs = rows()
  local keys = {}
  if lo.fromActive then
    for _, r in ipairs(rs) do if r.active then keys[#keys + 1] = L.keyOf(r) end end
  else
    for _, k in pairs(lo.mods or {}) do keys[#keys + 1] = k end
  end
  local entry
  for _, e in ipairs(meta.loadouts) do if lo.id and e.id == lo.id then entry = e end end
  if not entry then entry = { id = newId() }; meta.loadouts[#meta.loadouts + 1] = entry end
  entry.name = L.clip(lo.name or entry.name or "Mod Pack", L.TITLE_MAX)
  if entry.name == "" then entry.name = "Mod Pack" end
  if lo.desc ~= nil then entry.desc = L.clip(lo.desc, L.DESC_MAX) end
  entry.alwaysOn = lo.alwaysOn == true
  if lo.emoji ~= nil then entry.emoji = lo.emoji ~= "" and L.clip(lo.emoji, 8) or nil end -- no half emoji
  if lo.pinned ~= nil then entry.pinned = lo.pinned == true end
  if lo.cover ~= nil then entry.cover = lo.cover ~= "" and lo.cover or nil end
  if lo.fromActive or lo.mods then entry.mods = keys end
  metaDirty = true; libDirty = true
  saveMeta()
  return entry.id
end

function M.uiDeleteLoadout(id)
  loadMeta()
  for i, e in ipairs(meta.loadouts) do if e.id == id then table.remove(meta.loadouts, i); break end end
  metaDirty = true; libDirty = true; saveMeta()
end

function M.uiApplyLoadout(id)
  loadMeta()
  local plan, err = L.plan(rows(), meta.loadouts, id)
  if not plan then if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = err }) end return end
  queueOps(plan.activate, plan.deactivate)
  if guihooks then
    guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = string.format("Switching mod pack: %d to enable, %d to disable%s",
      #plan.activate, #plan.deactivate, #plan.missing > 0 and (", " .. #plan.missing .. " not installed") or ""), missing = plan.missing })
  end
  libDirty = true
end

function M.uiExportLoadout(id)
  loadMeta()
  for _, lo in ipairs(meta.loadouts) do
    if lo.id == id then
      local data = L.exportLoadout(lo, rows())
      local fname = EXPORT_DIR .. (lo.name:gsub("[^%w%-_ ]", ""):gsub("%s+", "_")) .. ".rfloadout.json"
      local ok = jsonWriteFile and pcall(jsonWriteFile, fname, data, true)
      local text
      pcall(function() text = jsonEncode and jsonEncode(data) end)
      if guihooks then guihooks.trigger("MarketplaceModLoadoutExport", { id = id, path = ok and fname or nil, text = text or "", data = data }) end
      return fname
    end
  end
end

-- src: JSON text (pasted) or a path under settings/marketplaceMod/loadouts/
function M.uiImportLoadout(src)
  loadMeta()
  local data
  if type(src) == "string" and src:match("%.json$") and not src:find("%.%.") and jsonReadFile then
    pcall(function() data = jsonReadFile(src) end)
  elseif type(src) == "string" then
    pcall(function() data = jsonDecode(src) end)
  elseif type(src) == "table" then data = src end
  local lo, missing = L.importLoadout(data, rows())
  if not lo then
    if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = missing or "Import failed" }) end
    return
  end
  lo.id = newId()
  meta.loadouts[#meta.loadouts + 1] = lo
  metaDirty = true; libDirty = true; saveMeta()
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = "Imported \"" .. lo.name .. "\"" ..
    (#missing > 0 and (" — " .. #missing .. " mod(s) not installed") or ""), missing = missing, loadout = lo.id }) end
end

function M.uiListImports()
  local files = {}
  for _, dir in ipairs({ "/" .. EXPORT_DIR, "/" .. L.legacyPath(EXPORT_DIR) }) do
    pcall(function() for _, f in ipairs(FS:findFiles(dir, "*.rfloadout.json", 0, false, false) or {}) do files[#files + 1] = f end end)
  end
  if guihooks then guihooks.trigger("MarketplaceModLoadoutFiles", { files = files }) end
end

-- ---------- mod pack files ----------
local MODS_DIR = "/mods/"
local function userRoot()
  local p
  pcall(function() if FS and FS.getUserPath then p = FS:getUserPath() end end)
  if type(p) ~= "string" or p == "" then pcall(function() p = getUserPath() end) end
  if type(p) ~= "string" or p == "" then return nil end
  if not p:match("[/\\]$") then p = p .. "/" end
  return p
end
local function realPath(vpath)
  local p
  pcall(function() p = FS:getFileRealPath(vpath) end)
  if type(p) == "string" and p ~= "" then return (p:gsub("/", "\\")) end
  local root = userRoot()
  if root then return ((root .. vpath:gsub("^/", "")):gsub("/", "\\")) end
  return vpath
end
local function safeName(t)
  local n = tostring(t or "Mod Pack"):gsub("[^%w%-_ %(%)]", ""):gsub("%s+", " "):gsub("^%s+", ""):gsub("%s+$", "")
  return n ~= "" and n:sub(1, 60) or "Mod Pack"
end
local function sharePathInfo()
  pcall(function() if not FS:directoryExists("/" .. SHARE_DIR) then FS:directoryCreate("/" .. SHARE_DIR, true) end end)
  return "/" .. SHARE_DIR, realPath("/" .. SHARE_DIR)
end

function M.uiExportPack(id)
  loadMeta()
  local lo
  for _, e in ipairs(meta.loadouts) do if e.id == id then lo = e end end
  if not lo then return end
  if L.clip(lo.desc, L.DESC_MAX) == "" then
    if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "Add a short description to this mod pack before sharing it (Edit)." }) end
    return
  end
  local vdir, rdir = sharePathInfo()
  local data = L.exportPack(lo, rows())
  local base, fname = safeName(lo.name), nil
  if base ~= tostring(lo.name or ""):gsub("%s+", " "):gsub("^%s+", ""):gsub("%s+$", "") then base = base .. " " .. tostring(lo.id):sub(-6) end
  fname = vdir .. base .. ".rfpack.json"
  local ok = jsonWriteFile and pcall(jsonWriteFile, fname, data, true)
  if guihooks then guihooks.trigger("MarketplaceModPackExport", { id = id, vpath = ok and fname or nil, ok = ok and true or false, file = base .. ".rfpack.json",
    path = ok and realPath(fname) or nil, folder = rdir, vfolder = vdir, error = not ok and "Could not write the file" or nil }) end
end

local function readPackFile(path)
  if type(path) ~= "string" or path:find("%.%.") or not (path:match("%.rfpack%.json$") or path:match("%.rfloadout%.json$")) then return nil, "not a mod pack file" end
  local size; pcall(function() size = FS:fileSize(path) end)
  if size and size > PACK_FILE_MAX then return nil, "file is too large to be a mod pack" end
  local d; local ok = pcall(function() d = jsonReadFile(path) end)
  if not ok or type(d) ~= "table" then return nil, "file is damaged (not valid JSON)" end
  return L.readPack(d)
end

local function openFolder(vdir)
  local ok = pcall(function() Engine.Platform.exploreFolder(vdir) end)
  if not ok and guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "Couldn't open the folder automatically. It is: " .. tostring(realPath(vdir)) }) end
end
function M.uiOpenShareFolder() openFolder((sharePathInfo())) end
function M.uiOpenModsFolder() openFolder(MODS_DIR) end

function M.uiListPacks()
  local vdir, rdir = sharePathInfo()
  local list, seen = {}, {}
  local function add(dir, pat, depth, where)
    local files = {}
    pcall(function() files = FS:findFiles(dir, pat, depth, false, false) or {} end)
    for _, f in ipairs(files) do
      local key = f:lower()
      if not seen[key] then
        seen[key] = true
        local pack = readPackFile(f)
        list[#list + 1] = { path = f, real = realPath(f), where = where, file = f:match("([^/]+)$"), title = pack and pack.title or nil,
          count = pack and #pack.mods or 0, valid = pack ~= nil, legacy = pat:find("rfloadout") ~= nil }
      end
    end
  end
  for _, pat in ipairs({ "*.rfpack.json", "*.rfloadout.json" }) do
    add(MODS_DIR, pat, -1, "mods"); add(vdir, pat, -1, "shared"); add("/" .. L.OLD_SHARE_DIR, pat, -1, "shared")
  end
  add("/" .. EXPORT_DIR, "*.rfloadout.json", 0, "legacy"); add("/" .. L.legacyPath(EXPORT_DIR), "*.rfloadout.json", 0, "legacy")
  table.sort(list, function(x, y) if x.valid ~= y.valid then return x.valid end return tostring(x.title or x.file):lower() < tostring(y.title or y.file):lower() end)
  if guihooks then guihooks.trigger("MarketplaceModPackFiles", { files = list, folder = rdir, modsFolder = realPath(MODS_DIR), userFolder = userRoot() }) end
end
-- preview before importing: each mod installed / missing / unavailable, total download size
local function previewOf(pack)
  local rs = rows()
  local byId, byName = {}, {}
  for _, r in ipairs(rs) do if r.tagid then byId[r.tagid] = r end; byName[tostring(r.name):lower()] = r end
  local out, total, nMiss, nGone = {}, 0, 0, 0
  for i, m in ipairs(pack.mods) do
    local r = (m.tagid and byId[m.tagid]) or (m.name and byName[m.name:lower()])
    local info; if m.tagid and extensions and extensions.marketplaceMod and extensions.marketplaceMod.catalogItem then pcall(function() info = extensions.marketplaceMod.catalogItem(m.tagid) end) end
    local e = { tagid = m.tagid, name = m.name, title = (r and r.title) or (info and info.title) or m.title or m.name or m.tagid,
      size = (r and r.size) or (info and info.size) or m.size }
    if r then e.status = "installed"
    elseif m.tagid and not (info and info.removed) then e.status = "missing"; nMiss = nMiss + 1; total = total + (tonumber(e.size) or 0)
    else e.status = "unavailable"; nGone = nGone + 1 end
    out[i] = e
  end
  local inPack, reqs, seen, nReq = {}, {}, {}, 0
  for _, m in ipairs(pack.mods) do if m.tagid then inPack[m.tagid] = true end end
  local RF = extensions and extensions.marketplaceMod
  if RF and RF.requirementsFor then
    for _, m in ipairs(pack.mods) do
      if m.tagid then
        local list = {}; pcall(function() list = RF.requirementsFor(m.tagid) or {} end)
        for _, q in ipairs(list) do
          local k = q.tagid or (q.resourceId and ("res:" .. tostring(q.resourceId)))
          if k and not seen[k] and not (q.tagid and inPack[q.tagid]) then
            seen[k] = true
            local r = q.tagid and byId[q.tagid]
            local st = (r or q.installed) and "installed" or (q.tagid and "missing" or "unknown")
            reqs[#reqs + 1] = { tagid = q.tagid, name = r and r.name or nil, title = q.title or (r and r.title) or q.tagid or ("resource " .. tostring(q.resourceId)), size = q.size, status = st,
              forTitle = (byId[m.tagid] and byId[m.tagid].title) or m.title or m.name or m.tagid }
            if st == "missing" then nReq = nReq + 1; total = total + (tonumber(q.size) or 0) end
          end
        end
      end
    end
  end
  return { title = pack.title, description = pack.description, mods = out, totalBytes = total, missing = nMiss, unavailable = nGone,
    requires = reqs, reqMissing = nReq, skipped = pack.skipped }
end

-- file picked in the native file dialog (CEF <input type=file>); the UI sends the text, we keep it until confirm
local picked = nil
function M.uiPreviewPackText(text, fileName)
  local name = tostring(fileName or "file"):match("([^/\\]*)$")
  local function fail(msg) picked = nil; if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "Can't import " .. name .. ": " .. msg }) end end
  if type(text) ~= "string" or text == "" then return fail("the file is empty") end
  if #text > PACK_FILE_MAX then return fail("file is too large to be a mod pack") end
  local d; pcall(function() d = jsonDecode(text) end)
  if type(d) ~= "table" then return fail("file is damaged (not valid JSON)") end
  local pack, err = L.readPack(d)
  if not pack then return fail(tostring(err or "not a mod pack file")) end
  picked = pack
  local p = previewOf(pack); p.path = "@picked"; p.file = name
  if guihooks then guihooks.trigger("MarketplaceModPackPreview", p) end
end
local function packFrom(path)
  if path == "@picked" then if picked then return picked end return nil, "the picked file is no longer loaded, pick it again" end
  return readPackFile(path)
end

function M.uiPreviewPack(path)
  local pack, err = packFrom(path)
  if not pack then
    if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "Can't import " .. tostring(path):match("([^/]*)$") .. ": " .. tostring(err) }) end
    return
  end
  local p = previewOf(pack); p.path = path
  if guihooks then guihooks.trigger("MarketplaceModPackPreview", p) end
end

-- no repository downloads while BeamMP is joining a server (see marketplaceModMP.joining)
local JOIN_BUSY = "BeamMP is joining a server and downloading its mods right now. Wait until the join has finished or was cancelled, then try again."
local function mpJoining()
  local mp = rawget(_G, "marketplaceModMP")
  if type(mp) ~= "table" or type(mp.joining) ~= "function" then return false end
  local ok, b = pcall(mp.joining)
  return ok and b == true
end
M.mpJoining = mpJoining
local function refuseJoin()
  if not mpJoining() then return false end
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = JOIN_BUSY }) end
  return true
end

function M.uiImportPackConfirm(path)
  if refuseJoin() then return end
  local pack, err = packFrom(path)
  if path == "@picked" then picked = nil end
  if not pack then if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = tostring(err) }) end return end
  loadMeta()
  local lo = L.importLoadout({ format = L.PACK_FORMAT, title = pack.title, description = pack.description, alwaysOn = pack.alwaysOn, mods = pack.mods }, rows())
  if not lo then return end
  lo.id = newId(); lo.desc = pack.description
  meta.loadouts[#meta.loadouts + 1] = lo
  metaDirty = true; libDirty = true; saveMeta()
  local p, n, nr = previewOf(pack), 0, 0
  -- every download is announced to the UI with its pack, so a failed one shows up there with Retry
  local announce = {}
  local function sub(id, title)
    local ok = core_repository and core_repository.modSubscribe and pcall(core_repository.modSubscribe, id)
    announce[#announce + 1] = { id = id, state = ok and "queued" or "failed", title = title, pack = lo.id, error = (not ok) and "Couldn't start the download" or nil }
    return ok
  end
  for _, m in ipairs(p.mods) do
    if m.status == "missing" and m.tagid and sub(m.tagid, m.title or m.name) then n = n + 1 end
  end
  -- requirements become part of the pack (so Activate turns them on too) and missing ones are downloaded
  local have, instKey = {}, {}
  for _, k in ipairs(lo.mods) do have[k] = true end
  for _, r in ipairs(rows()) do if r.tagid then instKey[r.tagid] = L.keyOf(r) end end
  for _, q in ipairs(p.requires or {}) do
    if q.tagid then
      local k = instKey[q.tagid] or ("id:" .. q.tagid)
      if not have[k] then have[k] = true; lo.mods[#lo.mods + 1] = k end
      if q.status == "missing" and sub(q.tagid, q.title) then nr = nr + 1 end
    end
  end
  saveMeta()
  if #announce > 0 and guihooks then guihooks.trigger("MarketplaceModDownloads", announce) end
  log("I", "marketplaceModLib", string.format("mod pack imported: %q, %d mods, %d downloading, %d requirements added (%d downloading), %d unavailable",
    lo.name, #pack.mods, n, #(p.requires or {}), nr, p.unavailable))
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = string.format("Added mod pack \"%s\"%s%s%s", lo.name,
    n > 0 and (": downloading " .. n .. " mod(s)") or "", nr > 0 and (" + " .. nr .. " required mod(s)") or "",
    p.unavailable > 0 and (" · " .. p.unavailable .. " no longer available") or "") }) end
end

function M.uiSubscribeMissing(tagids)
  if refuseJoin() then
    local f = {}
    for _, id in pairs(tagids or {}) do f[#f + 1] = { id = id, state = "failed", error = "Not started: BeamMP was joining a server" } end
    if guihooks and #f > 0 then guihooks.trigger("MarketplaceModDownloads", f) end
    return 0
  end
  local n = 0
  for _, id in pairs(tagids or {}) do
    if core_repository and core_repository.modSubscribe then pcall(core_repository.modSubscribe, id); n = n + 1 end
  end
  return n
end

-- activate every installed-but-inactive requirement of `name`
function M.uiActivateRequired(name)
  local rs = rows()
  for _, d in ipairs(L.dependencies(rs)) do
    if d.mod == name then
      local a = {}
      for _, x in ipairs(d.deps) do if x.status == "inactive" and x.name then a[#a + 1] = x.name end end
      queueOps(a, {})
    end
  end
end

-- duplicates: deactivate or move to recycle folder (never deletes)
function M.uiDeactivate(names) M.uiSetActiveMany(names, false) end

local function findRow(name) for _, r in ipairs(rows()) do if r.name == name then return r end end end

function M.uiRecycle(names)
  loadMeta()
  local moved = 0
  for _, name in pairs(names or {}) do
    local r = findRow(name)
    if r and r.path and not r.unpacked and r.path:sub(1, 6) == "/mods/" then
      pcall(function()
        if r.active then core_modmanager.deactivateMod(name, true) end
        if FS:isMounted(r.path) then FS:unmount(r.path) end
        if not FS:directoryExists(RECYCLE_DIR) then FS:directoryCreate(RECYCLE_DIR, true) end
        local dst = RECYCLE_DIR .. now() .. "_" .. (r.file or (name .. ".zip"))
        if FS:renameFile(r.path, dst) == 0 then
          meta.recycle[#meta.recycle + 1] = { name = name, title = r.title, from = r.path, to = dst, t = now(), size = r.size }
          meta.cleanup[#meta.cleanup + 1] = { act = "recycled", title = r.title, size = r.size, t = now() }
          moved = moved + 1
        end
      end)
    end
  end
  metaDirty = true; saveMeta(); libDirty = true
  pcall(function() if core_modmanager.initDB then core_modmanager.initDB() end end)
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = moved > 0 and "info" or "error",
    msg = moved > 0 and (moved .. " mod(s) moved to the recycle folder (" .. RECYCLE_DIR .. ")") or "Nothing moved" }) end
  return moved
end

function M.uiRestore(idx)
  loadMeta()
  local e = meta.recycle[tonumber(idx) or 0]
  if not e then return end
  local ok = false
  pcall(function() if not FS:fileExists(e.from) and FS:renameFile(e.to, e.from) == 0 then ok = true end end)
  if ok then table.remove(meta.recycle, idx); metaDirty = true; saveMeta() end
  pcall(function() if core_modmanager.initDB then core_modmanager.initDB() end end)
  libDirty = true
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = ok and "info" or "error", msg = ok and ("Restored " .. tostring(e.title)) or "Restore failed (file exists or missing)" }) end
end

-- hard delete: only with explicit confirmation flag from the UI's confirm dialog
function M.uiDeleteForever(name, confirm)
  if confirm ~= "DELETE" then return false end
  local ok = false
  pcall(function() ok = core_modmanager.deleteMod(name) and true or false end)
  libDirty = true
  return ok
end

-- updates: the game's own functions
function M.uiCheckUpdates() pcall(function() core_modmanager.checkUpdate() end) end
function M.uiUpdateOne(id) if refuseJoin() then return end pcall(function() core_repository.updateOneMod(id) end) end
function M.uiUpdateAll() if refuseJoin() then return end pcall(function() core_repository.updateAllMods() end) end
function M.uiUpdateMissing() if refuseJoin() then return end pcall(function() core_repository.updateAllMissing() end) end
function M.uiUpdateQueue() pcall(function() core_repository.uiUpdateQueue() end) end

-- ---------- Mod Manager API ----------
-- personal metadata: { title, author, notes, rating (0-5), cover (url / vfs path) }; "" clears
function M.uiSetMeta(name, t)
  loadMeta()
  if type(t) ~= "table" then return end
  local function set(map, v, max) if v ~= nil then v = tostring(v):sub(1, max or 80); map[name] = v ~= "" and v or nil end end
  set(meta.names, t.title); set(meta.authors, t.author); set(meta.notes, t.notes, 2000); set(meta.covers, t.cover, 400)
  if t.rating ~= nil then local n = tonumber(t.rating); meta.urating[name] = (n and n > 0) and math.min(5, math.floor(n)) or nil end
  metaDirty = true; libDirty = true
end

-- 'Not a requirement' (flag true) / re-include (false)
function M.uiNotDep(name, resId, flag)
  loadMeta()
  local k = tostring(resId)
  meta.notDeps[name] = meta.notDeps[name] or {}
  meta.notDeps[name][k] = flag and true or nil
  if next(meta.notDeps[name]) == nil then meta.notDeps[name] = nil end
  metaDirty = true; libDirty = true
end

function M.uiIgnoreUpdate(tagid, flag)
  loadMeta(); meta.ignoreUpd[tagid] = flag and true or nil; metaDirty = true; libDirty = true
end

M.parallelNow = parallelNow
M.setParallel = setParallel
function M.uiSettings(t)
  loadMeta()
  for k, v in pairs(t or {}) do
    if k == "keepVersions" or k == "autoCheck" or k == "accent" or k == "theme" then meta.settings[k] = v
    elseif k == "parallel" then setParallel(v) end
  end
  metaDirty = true; libDirty = true
end

function M.uiReorderLoadouts(ids)
  loadMeta()
  local by, out = {}, {}
  for _, lo in ipairs(meta.loadouts) do by[lo.id] = lo end
  for _, id in pairs(ids or {}) do if by[id] then out[#out + 1] = by[id]; by[id] = nil end end
  for _, lo in ipairs(meta.loadouts) do if by[lo.id] then out[#out + 1] = lo end end
  meta.loadouts = out; metaDirty = true; libDirty = true
end

-- add (or remove) mod keys to a load-out
function M.uiLoadoutMods(id, keys, remove)
  loadMeta()
  for _, lo in ipairs(meta.loadouts) do
    if lo.id == id then
      local have = {}
      for _, k in ipairs(lo.mods) do have[k] = true end
      for _, k in pairs(keys or {}) do
        if remove and have[k] then for i = #lo.mods, 1, -1 do if lo.mods[i] == k then table.remove(lo.mods, i) end end
        elseif not remove and not have[k] then lo.mods[#lo.mods + 1] = k; have[k] = true end
      end
    end
  end
  metaDirty = true; libDirty = true
end

-- pre-launch check for a load-out: plan + requirements that would be missing / left inactive
local function planWithCheck(id)
  local rs = rows()
  local plan, err = L.plan(rs, meta.loadouts, id)
  if not plan then return nil, err end
  local active = {}
  for _, r in ipairs(rs) do active[r.name] = r.active or nil end
  for _, n in ipairs(plan.activate) do active[n] = true end
  for _, n in ipairs(plan.deactivate) do active[n] = nil end
  plan.deps = L.depCheck(rs, active, meta.notDeps)
  return plan
end
function M.uiCheckLoadout(id)
  loadMeta()
  local plan, err = planWithCheck(id)
  if guihooks then guihooks.trigger("MarketplaceModLoadoutCheck", { id = id, plan = plan, error = err }) end
  return plan
end
-- alsoRequired: also enable installed-but-inactive requirements
function M.uiApplyLoadoutChecked(id, alsoRequired)
  loadMeta()
  local plan, err = planWithCheck(id)
  if not plan then if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = err }) end return end
  if alsoRequired then
    local seen = {}
    for _, n in ipairs(plan.activate) do seen[n] = true end
    for _, d in ipairs(plan.deps) do if d.status == "inactive" and d.name and not seen[d.name] then seen[d.name] = true; plan.activate[#plan.activate + 1] = d.name end end
    for i = #plan.deactivate, 1, -1 do if seen[plan.deactivate[i]] then table.remove(plan.deactivate, i) end end
  end
  queueOps(plan.activate, plan.deactivate)
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = string.format("Mod Pack applied: %d enabled, %d disabled", #plan.activate, #plan.deactivate) }) end
  libDirty = true
  return plan
end

-- activate every installed requirement of every active mod
function M.uiActivateAllRequired()
  loadMeta()
  local rs = rows()
  local active = {}
  for _, r in ipairs(rs) do active[r.name] = r.active or nil end
  local a, seen = {}, {}
  for _, d in ipairs(L.depCheck(rs, active, meta.notDeps)) do
    if d.status == "inactive" and d.name and not seen[d.name] then seen[d.name] = true; a[#a + 1] = d.name end
  end
  queueOps(a, {})
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = #a .. " required mod(s) enabled" }) end
  return a
end

-- keep N newest versions of each version stack; older ones go to the recycle folder (UI confirms first)
function M.uiKeepVersions(n, confirm)
  if confirm ~= "RECYCLE" then return 0 end
  loadMeta(); meta.settings.keepVersions = tonumber(n) or 1
  return M.uiRecycle(L.versionPlan(rows(), n))
end
function M.uiVersionPlan(n)
  local names = L.versionPlan(rows(), n)
  if guihooks then guihooks.trigger("MarketplaceModVersionPlan", { keep = n, names = names }) end
  return names
end

-- recycle entries older than `days` can be deleted for good, only with the confirm token
function M.uiPurgeRecycle(days, confirm)
  if confirm ~= "DELETE" then return 0 end
  loadMeta()
  local cutoff, n = now() - (tonumber(days) or 7) * 86400, 0
  for i = #meta.recycle, 1, -1 do
    local e = meta.recycle[i]
    if (e.t or 0) <= cutoff then
      local ok = false
      pcall(function() ok = FS:removeFile(e.to) == 0 or not FS:fileExists(e.to) end)
      if ok then
        meta.cleanup[#meta.cleanup + 1] = { act = "deleted", title = e.title, size = e.size, t = now() }
        table.remove(meta.recycle, i); n = n + 1
      end
    end
  end
  while #meta.cleanup > 200 do table.remove(meta.cleanup, 1) end
  metaDirty = true; libDirty = true
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = n .. " recycled file(s) deleted" }) end
  return n
end

-- update changelog (getMod, queued politely through the Marketplace request queue)
function M.uiChangelog(id)
  if not (extensions and extensions.marketplaceMod and extensions.marketplaceMod.changelog) then return end
  extensions.marketplaceMod.changelog(id, function(d)
    if guihooks then guihooks.trigger("MarketplaceModChangelog", { id = id, data = d }) end
  end)
end

-- backup / restore of Marketplace's own metadata (never touches mod files)
local BACKUP_KEYS = { "tags", "fav", "loadouts", "notes", "urating", "names", "authors", "covers", "ignoreUpd", "notDeps", "settings" }
function M.uiBackup()
  loadMeta()
  local data = { format = "repofinder-backup", version = 1, t = now() }
  local function copy(t) if type(t) ~= "table" then return t end local o = {}; for k, v in pairs(t) do o[k] = copy(v) end; return o end
  for _, k in ipairs(BACKUP_KEYS) do data[k] = copy(meta[k]) end
  local fname = "settings/marketplaceMod/backups/backup_" .. os.date("%Y%m%d_%H%M%S") .. ".json"
  local ok = jsonWriteFile and pcall(jsonWriteFile, fname, data, true)
  local text; pcall(function() text = jsonEncode(data) end)
  if guihooks then guihooks.trigger("MarketplaceModBackup", { path = ok and fname or nil, text = text or "" }) end
  return fname, data
end
function M.uiListBackups()
  local files = {}
  for _, dir in ipairs({ "/" .. L.DATA_DIR .. "backups/", "/" .. L.OLD_DATA_DIR .. "backups/" }) do
    pcall(function() for _, f in ipairs(FS:findFiles(dir, "*.json", 0, false, false) or {}) do files[#files + 1] = f end end)
  end
  if guihooks then guihooks.trigger("MarketplaceModBackupFiles", { files = files }) end
end
function M.uiRestoreBackup(src)
  loadMeta()
  local data
  if type(src) == "table" then data = src
  elseif type(src) == "string" and src:match("%.json$") and not src:find("%.%.") then pcall(function() data = jsonReadFile(src) end)
  elseif type(src) == "string" then pcall(function() data = jsonDecode(src) end) end
  if type(data) ~= "table" or data.format ~= "repofinder-backup" then
    if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "Not a Marketplace backup" }) end
    return false
  end
  for _, k in ipairs(BACKUP_KEYS) do if type(data[k]) == "table" then meta[k] = data[k] end end
  local function arr(t) local o = {}; for _, v in pairs(t or {}) do o[#o + 1] = v end; return o end
  meta.loadouts = arr(meta.loadouts)
  for _, lo in ipairs(meta.loadouts) do lo.mods = arr(lo.mods) end
  metaDirty = true; libDirty = true; saveMeta()
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = "Backup restored" }) end
  return true
end

function M.uiOpenRepo(tagid) pcall(function() core_repository.uiShowMod(tagid) end) end
function M.uiOpenUrl(url)
  if type(url) ~= "string" or not url:match("^https://") then return end
  pcall(function() openWebBrowser(url) end)
end

-- ---------- hooks ----------
function M.onModManagerStateChanged() libDirty = true end
function M.onModActivated(m)
  libDirty = true
  if type(m) == "table" and m.modname then loadMeta(); meta.activeAt[m.modname] = now(); metaDirty = true end
end
function M.onModDeactivated() libDirty = true end

-- fully idle once a level is loaded (driving or paused); work resumes in the main menu
local inLevel, levelCheck = false, 0
local function detectLevel()
  local m
  pcall(function() if getMissionFilename then m = getMissionFilename() end end)
  if type(m) == "string" then return m ~= "" end
  local g = false
  pcall(function() g = scenetree ~= nil and scenetree.MissionGroup ~= nil end)
  return g
end
function M.onClientStartMission() inLevel = true end
function M.onClientEndMission() inLevel = false end
function M.onUpdate(dtReal)
  dtReal = dtReal or 0.016
  levelCheck = levelCheck - dtReal
  if levelCheck <= 0 then levelCheck = 2; inLevel = detectLevel() end
  if inLevel then return end
  if #ops > 0 then stepOps() end
  if scan then stepScan() end
  libTimer = libTimer - dtReal
  if libDirty and uiSeen and libTimer <= 0 and #ops == 0 then libDirty = false; libTimer = 0.5; sendLibrary()
  elseif libDirty and uiSeen and libTimer <= 0 and #ops > 0 then libTimer = 0.5; sendLibrary() end
  if metaDirty then saveMeta() end
end

-- automatic update check at launch (once per session, when the game's mod manager is ready)
local launchChecked = false
function M.onModManagerReady()
  libDirty = true
  if launchChecked then return end
  launchChecked = true
  loadMeta()
  if meta.settings.autoCheck ~= false then
    pcall(function() core_modmanager.checkUpdate() end)
    if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = "info", msg = "Checking your mods for updates (launch check)" }) end
  end
end

function M.onExtensionLoaded() math.randomseed(os.time()); log("I", logTag, "Marketplace Library loaded") end
function M.onExtensionUnloaded() if metaDirty then saveMeta() end end

M._L = L
M._state = function() return { ops = ops, scan = scan, meta = meta, health = lastHealth, fileLists = fileLists } end
return M
