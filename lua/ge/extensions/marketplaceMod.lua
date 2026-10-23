-- Marketplace data layer. Uses BeamNG's repository API (core_online / core_repository)
-- and feeds the UI through guihooks events.

local M = {}
local logTag = "marketplaceMod"
local C = require("marketplaceModCore")
local LC = require("marketplaceModLibCore")

local SNAP_FILE = "settings/marketplaceMod/snapshots.json"
local PROFILE_FILE = "settings/marketplaceMod/profile.json"
local CACHE_FILE = "settings/marketplaceMod/cache.json"
local REFRESH_EVERY = 3 * 3600 -- background refresh + reshuffle while running
local CATALOG_FILE = "settings/marketplaceMod/catalog.json"
local SEED_FILE = "/marketplaceMod/catalog_seed.json"
local catalogSource = "local"
local CRAWL_GAP = 1.0 -- seconds between background catalog requests
local CRAWL_PAUSE = 6 -- pause crawling this long after user activity
local INCR_EVERY = 3 * 3600 -- incremental refresh ("update" sort) interval
local INCR_MAX_PAGES = 20
local RECRAWL_EVERY = 7 * 24 * 3600 -- full re-crawl (detects removed mods)
local INCR_ORDERS = { "update" }
local PAGE_SIZE = 12
local IMG_FILE = "settings/marketplaceMod/images.json"
local IMG_TTL = 14 * 86400 -- re-check a mod's photos after two weeks
local IMG_MAX = 3000
local ICON_BASE = "https://api.beamng.com/s1/v4/download/mods/"
local requestGap = 0.35

local pool, poolIndex = {}, {}
local pending, inFlight, cooldown = {}, false, 0
local status = ""
local gameMajor
local snap, snapDirty, snapSaveTimer = nil, false, 0
local homeLoaded = false
local lastQuery = nil -- last search opts from UI
local queryPage = 1
local dirty, dirtyTimer = {}, 0
local catPushTimer, lastCatSig = 0, nil
local bgPending, bgTimer = { home = false, query = false }, 0
local function bgDirty(query) bgPending.home = true; if query then bgPending.query = true end end
local detailRequested = {}
local MAX_SEND = 60
local profile, profileDirty = nil, false
local AUTOMATION_CAT = 16
local session -- per-open check state (see startOpenCheck)
local function autoHidden() return profile ~= nil and profile.hideAutomation == true end
local cacheSavedAt = 0
local refreshTimer = 0
local uiSeen = false
local clock = 0
local lastUserAt = -1e9
local crawl = { ci = 1, page = 1, done = false, totals = {}, lastIncr = 0, pages = 0, incr = nil, passStart = nil, errors = 0, seen = 0, lastPrune = nil,
  auto = { page = 0, done = false, total = nil } } -- Automation exports progress
local crawlBusy = false
local catalogDirty, catalogSaveTimer = false, 0
local installedPoll = 0
local serverQuery = { q = nil, page = 0, more = true }
local imgCache, imgDirty = nil, false -- tagid -> { cover=url|false, images={...}, t=time }
local lowQueue, lowQueued = {}, {} -- background getMod lookups for photos

-- ---------- helpers ----------
local function getGameMajor()
  local v = rawget(_G, "beamng_versionb") or rawget(_G, "beamng_version") or rawget(_G, "beamng_versiond")
  return C.majorOf(v) or C.releases[#C.releases][1]
end

local function online()
  if not core_online or not core_online.apiCall then return false, "Online API not available" end
  if settings and settings.getValue and settings.getValue("onlineFeatures") ~= "enable" then
    return false, "Online features are disabled (Options > Other > Online features)"
  end
  if Engine and Engine.Online and Engine.Online.isAuthenticated and not Engine.Online.isAuthenticated() then
    return false, "Not logged in to BeamNG online services yet - try again in a moment"
  end
  return true
end

local function now() return os.time() end

local function loadSnap()
  if snap then return end
  snap = {}
  if jsonReadFile then
    local ok, d = pcall(LC.readData, SNAP_FILE)
    if ok and type(d) == "table" and type(d.mods) == "table" then snap = d.mods end
  end
end

local function saveSnap()
  if not snapDirty or not jsonWriteFile then return end
  local ok, e = pcall(jsonWriteFile, SNAP_FILE, { version = 1, mods = snap }, false)
  if ok then snapDirty = false else log("W", logTag, "snapshot save failed: " .. tostring(e)) end
end

local function loadProfile()
  if profile then return end
  profile = C.newProfile()
  if jsonReadFile then
    local ok, d = pcall(LC.readData, PROFILE_FILE)
    if ok and type(d) == "table" then
      for _, k in ipairs({ "cats", "authors", "owned", "viewed" }) do
        if type(d[k]) == "table" then profile[k] = d[k] end
      end
      -- JSON turns numeric keys into strings
      local cats = {}
      for k, v in pairs(profile.cats) do cats[tonumber(k) or k] = v end
      profile.cats = cats
    end
  end
  -- learn from mods already installed (best effort; API differs between versions)
  local ok, list = pcall(function() return core_modmanager and core_modmanager.getModList and core_modmanager.getModList() end)
  if ok and type(list) == "table" then
    for _, m in pairs(list) do
      local md = type(m) == "table" and m.modData
      if type(md) == "table" and md.tagid and not profile.owned[md.tagid] then
        C.learn(profile, md, "installed"); profileDirty = true
      end
    end
  end
end

local function saveProfile()
  if not profileDirty or not jsonWriteFile or not profile then return end
  if pcall(jsonWriteFile, PROFILE_FILE, profile, false) then profileDirty = false end
end

local CATALOG_FIELDS = { "tagid", "title", "prefix_title", "tag_line", "category", "download_count", "rating_avg",
  "rating_count", "filesize", "last_update", "path", "filename", "username", "author", "date", "resource_date", "sub", "seen", "cats", "category_title",
  "requires", "requires_tagid", "resource_id", "req_local" }
local CATALOG_VERSION = 3

local function loadCatalog()
  loadProfile()
  if not jsonReadFile then return end
  local ok, d = pcall(LC.readData, CATALOG_FILE)
  if not (ok and type(d) == "table") then ok, d = pcall(LC.readData, CACHE_FILE) end
  if ok and type(d) == "table" and type(d.items) == "table" then
    local items = {}
    for _, it in pairs(d.items) do if type(it) == "table" then it.seen = tonumber(it.seen) or 0; items[#items + 1] = it end end
    for _, it in ipairs(items) do -- JSON may hand back cats as an object
      if type(it.cats) == "table" then local l = {}; for _, v in pairs(it.cats) do l[#l + 1] = tonumber(v) end; it.cats = l end
    end
    C.merge(pool, poolIndex, items)
    cacheSavedAt = tonumber(d.savedAt) or 0
    local migrate = (tonumber(d.version) or 0) < CATALOG_VERSION
    if migrate then
      -- keep every item; run a fresh full pass so each one gets its category
      crawl.done = false; crawl.ci = 1; crawl.page = 1; crawl.passStart = nil; crawl.backfill = true
      catalogDirty = true
    end
    if type(d.cursor) == "table" and not migrate then
      crawl.ci = tonumber(d.cursor.ci) or 1
      crawl.page = tonumber(d.cursor.page) or 1
      crawl.done = d.cursor.done == true
      crawl.lastIncr = tonumber(d.cursor.lastIncr) or 0
      crawl.passStart = tonumber(d.cursor.passStart)
      crawl.errors = tonumber(d.cursor.errors) or 0
      crawl.seen = tonumber(d.cursor.seen) or 0
      crawl.backfill = d.cursor.backfill == true
      if type(d.cursor.catStats) == "table" then crawl.catStats = d.cursor.catStats end
      if type(d.cursor.extraCats) == "table" then crawl.extraCats = d.cursor.extraCats end
      if type(d.cursor.auto) == "table" then
        crawl.auto = { page = tonumber(d.cursor.auto.page) or 0, done = d.cursor.auto.done == true, total = tonumber(d.cursor.auto.total) }
      end
      if tonumber(d.cursor.v) ~= 119 and crawl.done then crawl.done = false; crawl.ci = 1; crawl.page = 1; crawl.passStart = nil end
      if type(d.cursor.totals) == "table" then
        for k, v in pairs(d.cursor.totals) do crawl.totals[tonumber(k) or k] = tonumber(v) end
      end
    end
  end
end

local function loadSeed()
  if not (jsonReadFile and FS and FS.fileExists and FS:fileExists(SEED_FILE)) then return end
  local ok, d = pcall(jsonReadFile, SEED_FILE)
  if not (ok and type(d) == "table" and type(d.items) == "table") then return end
  local seedAt = tonumber(d.savedAt) or 0
  local onlyMissing = #pool > 0 and seedAt <= cacheSavedAt
  local fresh = {}
  for _, it in pairs(d.items) do
    if type(it) == "table" and it.tagid then
      local old = poolIndex[it.tagid]
      if not old or (not onlyMissing and (tonumber(it.last_update) or 0) >= (tonumber(old.last_update) or 0)) then
        if type(it.cats) == "table" then local l = {}; for _, v in pairs(it.cats) do l[#l + 1] = tonumber(v) end; it.cats = l end
        it.seen = seedAt; fresh[#fresh + 1] = it
      end
    end
  end
  local hadLocal = #pool > 0
  C.merge(pool, poolIndex, fresh)
  if not hadLocal and type(d.cursor) == "table" then
    crawl.done = d.cursor.done == true
    crawl.lastIncr = tonumber(d.cursor.lastIncr) or seedAt
    crawl.passStart = tonumber(d.cursor.passStart)
    if type(d.cursor.totals) == "table" then for k, v in pairs(d.cursor.totals) do crawl.totals[tonumber(k) or k] = tonumber(v) end end
  end
  cacheSavedAt = math.max(cacheSavedAt, seedAt)
  catalogSource = "snapshot"; catalogDirty = true
  log("I", logTag, string.format("catalog snapshot merged: %d mods (snapshot %s)", #fresh, os.date("!%Y-%m-%d", seedAt)))
end

local function saveCatalog()
  if not jsonWriteFile then return end
  local items = {}
  for i = 1, #pool do
    local src, it = pool[i], {}
    for _, k in ipairs(CATALOG_FIELDS) do it[k] = src[k] end
    items[i] = it
  end
  cacheSavedAt = os.time()
  local totals = {}
  for k, v in pairs(crawl.totals) do totals[tostring(k)] = v end
  if pcall(jsonWriteFile, CATALOG_FILE, { version = CATALOG_VERSION, savedAt = cacheSavedAt, items = items,
      cursor = { auto = crawl.auto, ci = crawl.ci, page = crawl.page, done = crawl.done, lastIncr = crawl.lastIncr, totals = totals,
        passStart = crawl.passStart, errors = crawl.errors, seen = crawl.seen, backfill = crawl.backfill,
        catStats = crawl.catStats, extraCats = crawl.extraCats, v = 119 } }, false) then
    catalogDirty = false
  end
end
local saveCache = saveCatalog
local loadCache = loadCatalog

local function catalogTotal()
  local t = 0
  for k, v in pairs(crawl.totals) do
    if tonumber(k) ~= AUTOMATION_CAT then t = t + (tonumber(v) or 0) end
  end
  t = t + (crawl.auto.total or tonumber(crawl.totals[AUTOMATION_CAT]) or tonumber(crawl.totals["16"]) or 0)
  return math.max(t, #pool)
end

local function sortedCount()
  local n = 0
  for i = 1, #pool do if C.catOf(pool[i]) then n = n + 1 end end
  return n
end

local allCategoryIds
-- the pool scans (8-10k items) run at most every 5 s instead of on every status push
local scanCache = { at = -1e9, n = -1 }
local function poolScan()
  if clock - scanCache.at < 5 and scanCache.n == #pool then return scanCache end
  local sorted, have = 0, {}
  for i = 1, #pool do
    local it = pool[i]
    if C.catOf(it) then sorted = sorted + 1 end
    local cs = it.cats
    if cs then for _, c in ipairs(cs) do c = tonumber(c); if c then have[c] = (have[c] or 0) + 1 end end end
  end
  scanCache = { at = clock, n = #pool, sorted = sorted, have = have }
  return scanCache
end
local function catalogStatus()
  local scan = poolScan()
  local sorted = scan.sorted
  return { loaded = #pool, sorted = sorted, sorting = (crawl.backfill or sorted < #pool) and not crawl.done,
    sortPct = #pool > 0 and math.floor(sorted * 100 / #pool) or 0, total = catalogTotal(), done = crawl.done, lastPrune = crawl.lastPrune, crawling = not crawl.done or crawl.incr ~= nil,
    paused = (clock - lastUserAt) < CRAWL_PAUSE, source = catalogSource, perCat = (function()
      local out, names = {}, {}
      for _, c in ipairs(C.categories) do names[c[1]] = c[2] end
      local have = scan.have
      for _, id in ipairs(allCategoryIds()) do
        local st = crawl.catStats and crawl.catStats[tostring(id)] or {}
        local total = tonumber(crawl.totals[id]) or tonumber(st.total) or 0
        local cur = crawl.cs and crawl.cs.cat == id or false
        if id == AUTOMATION_CAT then
          total = crawl.auto.total or tonumber(crawl.totals[id]) or tonumber(crawl.totals["16"]) or total
          cur = session ~= nil and not session.done and session.phase == "auto"
        end
        out[#out + 1] = { id = id, name = names[id] or ("Category " .. id), have = have[id] or 0, total = total,
          short = st.short or false, current = cur, t = st.t, done = id == AUTOMATION_CAT and crawl.auto.done or nil }
      end
      return out end)() }
end

local function loadImgCache()
  if imgCache then return end
  imgCache = {}
  if jsonReadFile then
    local ok, d = pcall(LC.readData, IMG_FILE)
    if ok and type(d) == "table" and type(d.mods) == "table" then imgCache = d.mods end
  end
end

local function saveImgCache()
  if not imgDirty or not jsonWriteFile or not imgCache then return end
  local n, keep = 0, {}
  for k, v in pairs(imgCache) do n = n + 1; if n <= IMG_MAX then keep[k] = v end end
  if pcall(jsonWriteFile, IMG_FILE, { version = 1, mods = keep }, false) then imgDirty = false end
end

local function rememberImages(it, id)
  id = id or (it and it.tagid)
  if not it or not id then return end
  loadImgCache()
  local imgs = C.extractImages(it, it.message)
  imgCache[id] = { cover = imgs[1] or false, images = imgs, t = os.time() }
  imgDirty = true
end

local function enqueue(endpoint, payload, cb)
  pending[#pending + 1] = { endpoint, payload, cb }
end

local nextCrawlJob

local function pump(dt)
  if inFlight then return end
  cooldown = cooldown - dt
  if cooldown > 0 then return end
  if #pending == 0 then
    if #lowQueue > 0 then
      pending[1] = table.remove(lowQueue, 1)
    else
      local job = nextCrawlJob and nextCrawlJob()
      if not job then return end
      pending[1] = job
    end
  end
  local job = table.remove(pending, 1)
  if job[1] == "__save_cache" then saveCache(); saveSnap(); saveImgCache(); return end
  inFlight = true
  local ok, err = pcall(core_online.apiCall, job[1], function(request)
    inFlight = false
    cooldown = requestGap
    local okcb, e = pcall(job[3], request and request.responseData, request)
    if not okcb then log("E", logTag, "callback error: " .. tostring(e)); status = "Error: " .. tostring(e) end
  end, job[2])
  if not ok then inFlight = false; crawlBusy = false; status = "API call failed: " .. tostring(err); log("E", logTag, status) end
end

allCategoryIds = function()
  local ids, have = {}, {}
  for _, c in ipairs(C.categories) do ids[#ids + 1] = c[1]; have[c[1]] = true end
  -- categories the server reports mods for that the official list doesn't name
  for k in pairs(crawl.extraCats or {}) do k = tonumber(k); if k == AUTOMATION_CAT then k = nil end
    if k and not have[k] then ids[#ids + 1] = k; have[k] = true end end
  return ids
end

-- the main crawl skips Automation (16); it has its own bounded per-open phase
local function crawlCategoryIds()
  local out = {}
  for _, id in ipairs(allCategoryIds()) do if id ~= AUTOMATION_CAT then out[#out + 1] = id end end
  return out
end
local catName = {}
for _, c in ipairs(C.categories) do catName[c[1]] = c[2] end

-- compact, UI-ready copy of an item
local instCache, instAt = nil, -1
local function installedKeys()
  if instCache and os.clock() - instAt < 5 then return instCache end
  local set = { tag = {}, res = {} }
  pcall(function()
    for _, m in pairs(core_modmanager.getMods() or {}) do
      local md = type(m) == "table" and type(m.modData) == "table" and m.modData or {}
      if md.tagid then set.tag[md.tagid] = true end
      if md.resource_id then set.res[tonumber(md.resource_id) or -1] = true end
    end
  end)
  instCache, instAt = set, os.clock()
  return set
end
local resIndex, resIndexN = {}, -1
local function byResource(id)
  if resIndexN ~= #pool then
    resIndex = {}
    for _, x in ipairs(pool) do if x.resource_id then resIndex[tonumber(x.resource_id) or -1] = x end end
    resIndexN = #pool
  end
  return resIndex[id]
end
local function arrOf(v) local o = {}; if type(v) == "table" then for _, x in pairs(v) do o[#o + 1] = x end end; return o end
-- list of { resourceId, tagid, title, size, installed }
function M.requirementsOf(it)
  local out, seenTag, seenRes = {}, {}, {}
  if type(it) ~= "table" then return out end
  local inst = installedKeys()
  local function add(tagid, resId)
    local x = tagid and poolIndex[tagid] or (resId and byResource(resId)) or nil
    tagid = tagid or (x and x.tagid)
    resId = resId or (x and tonumber(x.resource_id))
    if (tagid and seenTag[tagid]) or (resId and seenRes[resId]) or tagid == it.tagid then return end
    if tagid then seenTag[tagid] = true end
    if resId then seenRes[resId] = true end
    out[#out + 1] = { resourceId = resId, tagid = tagid, title = x and x.title or nil, size = x and tonumber(x.filesize) or nil,
      installed = (tagid and inst.tag[tagid]) or (resId and inst.res[resId]) or false }
  end
  for _, t in ipairs(arrOf(it.requires_tagid)) do add(t, nil) end
  for _, r in ipairs(arrOf(it.requires)) do add(nil, tonumber(r)) end
  for _, r in ipairs(arrOf(it.req_local)) do add(nil, tonumber(r)) end
  return out
end
local function reqCount(it)
  local n = #arrOf(it.requires_tagid) + #arrOf(it.requires) + #arrOf(it.req_local)
  return n > 0 and #M.requirementsOf(it) or 0
end

local function slim(it, withDelta)
  local level, label = C.compat(it, gameMajor)
  return {
    id = it.tagid, title = it.title, prefix = it.prefix_title, tagline = it.tag_line,
    author = it.username or it.author or it.user_name, category = catName[C.catOf(it) or 0] or "",
    downloads = tonumber(it.download_count) or 0, rating = tonumber(it.rating_avg) or 0,
    ratingCount = tonumber(it.rating_count), size = tonumber(it.filesize),
    updated = tonumber(it.last_update), updatedStr = C.fmtDate(it.last_update),
    compat = level, compatLabel = label, sub = C.isSub(it),
    icon = it.path and (ICON_BASE .. it.path .. "icon.jpg") or nil,
    cover = (function() loadImgCache(); local c = imgCache[it.tagid]; return c and c.cover or nil end)(),
    delta = withDelta and it._delta or nil, version = it.version_string or it.ver, file = it.filename,
    requires = reqCount(it),
  }
end

local function slimList(list, n, withDelta)
  local out = {}
  for i = 1, math.min(n or MAX_SEND, #list) do out[i] = slim(list[i], withDelta) end
  return out
end

local function addItems(items)
  local n = C.merge(pool, poolIndex, items)
  loadSnap()
  if C.recordSnapshots(snap, items, now()) > 0 then snapDirty = true end
  return n
end

local uiVisible = false
local levelLoaded = false
local function detectLevel()
  local m
  pcall(function() if getMissionFilename then m = getMissionFilename() end end)
  if type(m) == "string" then return m ~= "" end
  local g = false
  pcall(function() g = scenetree ~= nil and scenetree.MissionGroup ~= nil end)
  return g
end
local function crawlAllowed() return not levelLoaded end
function M.onClientPreStartMission() levelLoaded = true end
function M.onClientStartMission() levelLoaded = true end
function M.onClientEndMission() levelLoaded = false end
function M.uiClose() uiVisible = false; if catalogDirty then catalogSaveTimer = 0; saveCatalog(); catalogDirty = false end end

local QUICK_MAX_PAGES = 8
local fullPassJob
local GAP_PAGES_PER_OPEN = 6
local AUTO_PAGES_PER_OPEN = 10
session = nil
local function finishSession()
  if not session or session.done then return end
  session.done = true
  dirty.home = true; dirty.query = true -- one rebuild with everything merged
  session.pushStatus = true
  log("I", logTag, string.format("open check done: %d new, %d updated, %d gap pages", session.added, session.changed, session.gap))
end
function M.startOpenCheck()
  if session and not session.done then return end
  session = { phase = "quick", page = 1, gap = 0, auto = 0, added = 0, changed = 0, done = false }
end
nextCrawlJob = function()
  if not session or session.done or crawlBusy or levelLoaded then return nil end
  if not online() then finishSession(); return nil end
  if session.phase == "quick" then
    local page = session.page
    crawlBusy = true
    return { "s1/v4/getMods", { query = "", order_by = "update", order = "desc", page = page - 1, categories = crawlCategoryIds() }, function(data)
      crawlBusy = false
      cooldown = math.max(cooldown, CRAWL_GAP)
      local items = {}
      if data and type(data.data) == "table" then for _, it in pairs(data.data) do if type(it) == "table" then items[#items + 1] = it end end end
      local added, changed = C.mergeCount(pool, poolIndex, items)
      loadSnap(); if C.recordSnapshots(snap, items, now()) > 0 then snapDirty = true end
      session.added = session.added + added; session.changed = session.changed + changed
      if added + changed > 0 then catalogDirty = true end
      if #items == 0 or added + changed == 0 or page >= QUICK_MAX_PAGES then session.phase = "gap"
      else session.page = page + 1 end
    end }
  end
  -- bounded gap filling (resumes the per-category pass where the last open stopped)
  if session.phase == "gap" then
    if crawl.done or session.gap >= GAP_PAGES_PER_OPEN then session.phase = "auto"
    else
      local job = fullPassJob()
      if job then session.gap = session.gap + 1; return job end
      if (clock - lastUserAt) < CRAWL_PAUSE then return nil end -- user busy: wait, still bounded
      session.phase = "auto"
    end
  end
  if session.phase == "auto" then
    if autoHidden() or session.auto >= AUTO_PAGES_PER_OPEN then finishSession(); return nil end
    local A = crawl.auto
    if A.done and session.auto >= 2 then finishSession(); return nil end
    local orderBy = A.done and "update" or "downloads" -- once complete: just a short "what's new" look
    local page = A.done and session.auto or A.page
    crawlBusy = true
    session.auto = session.auto + 1
    return { "s1/v4/getMods", { query = "", order_by = orderBy, order = "desc", page = page, categories = { AUTOMATION_CAT } }, function(data)
      crawlBusy = false; cooldown = math.max(cooldown, CRAWL_GAP)
      local items = {}
      if data and type(data.data) == "table" then for _, it in pairs(data.data) do if type(it) == "table" then items[#items + 1] = it end end end
      for _, it in ipairs(items) do C.stampCat(it, AUTOMATION_CAT) end
      local added, changed = C.mergeCount(pool, poolIndex, items)
      for _, it in ipairs(items) do local p = poolIndex[it.tagid]; if p then C.stampCat(p, AUTOMATION_CAT) end end
      session.added = session.added + added; session.changed = session.changed + changed
      if added + changed > 0 then catalogDirty = true end
      local total = tonumber(data and data.count); if total then A.total = total end
      if not A.done then
        A.page = A.page + 1
        if #items == 0 or (A.total and A.page * math.max(1, #items) >= A.total) then A.done = true end
      elseif added + changed == 0 then
        session.auto = AUTO_PAGES_PER_OPEN -- nothing new: stop early
      end
    end }
  end
  finishSession()
  return nil
end

fullPassJob = function()
  if not uiSeen or crawlBusy or not online() then return nil end
  if not crawlAllowed() then return nil end
  if (clock - lastUserAt) < CRAWL_PAUSE then return nil end
  local cats = crawlCategoryIds()
  if crawl.errRow and crawl.errRow > 0 and clock < (crawl.retryAt or 0) then return nil end
  if not crawl.done then
    if not crawl.passStart then crawl.passStart = os.time(); crawl.errors = 0; crawl.seen = 0; crawl.totals = {}; crawl.cs = nil; crawl.probeI = nil end
    if crawl.ci > #cats then
      -- discover category ids the official list misses (one cheap request each, once per pass)
      crawl.probeI = crawl.probeI or 1
      local known = {}; for _, id in ipairs(cats) do known[id] = true end
      while crawl.probeI <= 20 and (known[crawl.probeI] or crawl.probeI == AUTOMATION_CAT) do crawl.probeI = crawl.probeI + 1 end
      if crawl.probeI <= 20 then
        local pid = crawl.probeI
        crawlBusy = true
        return { "s1/v4/getMods", { query = "", order_by = "downloads", order = "desc", page = 0, categories = { pid } }, function(data)
          crawlBusy = false; cooldown = math.max(cooldown, CRAWL_GAP)
          crawl.probeI = pid + 1
          local n = data and tonumber(data.count) or 0
          local items = data and type(data.data) == "table" and data.data or {}
          if n > 0 and next(items) ~= nil then
            crawl.extraCats = crawl.extraCats or {}; crawl.extraCats[tostring(pid)] = true
            log("I", logTag, "found extra repository category id " .. pid .. " with " .. n .. " mods")
            crawl.ci = #crawlCategoryIds()
          end
        end }
      end
      crawl.done = true; crawl.ci = 1; crawl.page = 1; crawl.backfill = false; crawl.cs = nil
      bgDirty(true)
      local total = 0; for _, v in pairs(crawl.totals) do total = total + (tonumber(v) or 0) end
      local n, why = C.prune(pool, poolIndex, { start = crawl.passStart, errors = crawl.errors, seen = crawl.seen }, total)
      crawl.lastPrune = { t = os.time(), removed = n, reason = why }
      log("I", logTag, string.format("full pass done: seen %d / server %d, removed %d (%s)", crawl.seen, total, n, tostring(why)))
      if n > 0 then bgDirty(true) end
      catalogDirty = true; saveCatalog(); return nil
    end
    local cat = cats[crawl.ci]
    if not crawl.cs or crawl.cs.cat ~= cat then crawl.cs = C.newCatCrawl(cat) end
    local cs = crawl.cs
    local ob, od = C.crawlOrder(cs)
    crawlBusy = true
    return { "s1/v4/getMods", { query = "", order_by = ob, order = od, page = cs.page - 1, categories = { cat } }, function(data)
      crawlBusy = false
      cooldown = math.max(cooldown, CRAWL_GAP)
      if not (data and type(data.data) == "table") then
        crawl.errors = crawl.errors + 1; crawl.errRow = (crawl.errRow or 0) + 1
        crawl.retryAt = clock + C.crawlBackoff(crawl.errRow); return -- retry same page later; pass won't prune
      end
      crawl.errRow = 0
      local items = {}
      for _, it in pairs(data.data) do if type(it) == "table" then items[#items + 1] = it end end
      addItems(items)
      for _, it in ipairs(items) do
        local p = it.tagid and poolIndex[it.tagid]
        if p then if (tonumber(p.seen) or 0) < crawl.passStart then crawl.seen = crawl.seen + 1 end; p.seen = crawl.passStart; C.stampCat(p, cat) end
      end
      C.crawlAdvance(cs, items, data.count)
      if cs.total then crawl.totals[cat] = cs.total end
      crawl.catStats = crawl.catStats or {}
      crawl.catStats[tostring(cat)] = { n = cs.n, total = cs.total or 0, short = cs.short or false, done = cs.done, t = os.time() }
      crawl.pages = crawl.pages + 1
      if cs.done then
        if cs.short then log("W", logTag, string.format("category %s: got %d of %d after all orderings", tostring(cat), cs.n, cs.total or 0)) end
        crawl.ci = crawl.ci + 1; crawl.page = 1; crawl.cs = nil
      end
      catalogDirty = true
    end }
  end
  return nil
end

local function dropRemoved(id)
  if C.remove(pool, poolIndex, id) then
    loadImgCache(); imgCache[id] = nil; imgDirty = true
    catalogDirty = true; bgDirty(true)
    log("I", logTag, "mod removed from repository: " .. tostring(id))
  end
end

local function fetchPages(query, orderBy, cats, fromPage, count, onPage)
  for p = fromPage, fromPage + count - 1 do
    enqueue("s1/v4/getMods", { query = query or "", order_by = orderBy, order = "desc", page = p - 1, categories = cats }, function(data)
      if data and type(data.data) == "table" then
        addItems(data.data)
        -- getMods items have no category field: stamp it from a single-category request
        if type(cats) == "table" and #cats == 1 then
          for _, it in pairs(data.data) do local p = type(it) == "table" and poolIndex[it.tagid]; if p then C.stampCat(p, cats[1]) end end
        end
        status = string.format("%d mods loaded", #pool)
      else
        status = "Repository server did not answer"
      end
      if onPage then onPage(data) end
    end)
  end
end

-- queue background getMod calls (lowest priority) for mods whose photos we don't know yet
local function wantPhotos(list, n)
  loadImgCache()
  local t = os.time()
  for i = 1, math.min(n, #list) do
    local it = list[i]
    local id = it and it.tagid
    local c = id and imgCache[id]
    if id and not lowQueued[id] and (not c or t - (tonumber(c.t) or 0) > IMG_TTL) then
      lowQueued[id] = true
      lowQueue[#lowQueue + 1] = { "s1/v4/getMod/" .. tostring(id), nil, function(data, req)
        lowQueued[id] = nil
        if C.isRemovedResponse(data, req) then dropRemoved(id)
        elseif data and type(data.data) == "table" then
          C.merge(pool, poolIndex, { data.data })
          rememberImages(poolIndex[id] or data.data, id)
          bgDirty(true)
        else
          imgCache[id] = { cover = false, images = {}, t = os.time() - IMG_TTL + 3600 }
        end
      end }
    end
  end
end

local function fetchDetailsFor(list, n)
  for i = 1, math.min(n, #list) do
    local it = list[i]
    if it.tagid and it.last_update == nil and not detailRequested[it.tagid] then
      detailRequested[it.tagid] = true
      enqueue("s1/v4/getMod/" .. tostring(it.tagid), nil, function(data, req)
        if C.isRemovedResponse(data, req) then dropRemoved(it.tagid)
        elseif data and data.data then
          C.merge(pool, poolIndex, { data.data })
          rememberImages(poolIndex[it.tagid] or data.data, it.tagid)
          bgDirty(true)
        end
      end)
    end
  end
end

-- ---------- sections ----------
local function homeSections()
  local t = now()
  loadSnap(); loadProfile()
  local home = C.buildHome(pool, { gameMajor = gameMajor, now = t, profile = profile, snap = snap, hideAuto = autoHidden() })
  if online() then
    wantPhotos(home.hero, 6); wantPhotos(home.forYou, 10)
    for _, sh in ipairs(home.shelves) do wantPhotos(sh.items, 5) end
  end
  local shelves = {}
  for _, sh in ipairs(home.shelves) do
    shelves[#shelves + 1] = { key = sh.key, title = sh.title, cat = sh.cat, items = slimList(sh.items, 16) }
  end
  local recent = C.filterSort(pool, { sort = "updated", gameMajor = gameMajor, now = t })
  return {
    gameMajor = gameMajor, status = status, total = #pool, busy = (#pending > 0 or inFlight),
    hero = slimList(home.hero, 6), forYou = slimList(home.forYou, 16),
    personalized = next(profile.cats) ~= nil, catalog = catalogStatus(),
    recent = slimList(recent, 16), shelves = shelves,
    nextRotation = (math.floor(t / C.rotationSeconds) + 1) * C.rotationSeconds,
  }
end

local function refreshListings(force)
  local ok = online()
  if not ok then return end
  if not force and #pool > 0 then return end -- catalog crawler keeps things fresh
  local ids = crawlCategoryIds()
  local cb = function() bgDirty(false) end
  fetchPages("", "update", ids, 1, 4, cb)
  fetchPages("", "downloads", ids, 1, 4, cb)
  for _, id in ipairs(ids) do -- fill every category shelf
    fetchPages("", "downloads", { id }, 1, 1, cb)
    fetchPages("", "update", { id }, 1, 1, cb)
  end
  enqueue("__save_cache", nil, nil)
end

local function sendHome()
  if guihooks then guihooks.trigger("MarketplaceModHome", homeSections()) end
end

-- installed mods: core_modmanager first, then mods/db.json, then counting zips in /mods
local installedCache, installedAt, installedSig = nil, -1e9, nil
local installedDirty = true
local function installedInfo(force)
  if installedCache and not force and not installedDirty and clock - installedAt < 10 then return installedCache end
  local info = { total = 0, active = 0, ids = {}, set = {}, source = "none" }
  local function addMod(m, name)
    if type(m) ~= "table" then return end
    info.total = info.total + 1
    if m.active ~= false then info.active = info.active + 1 end
    local id = (type(m.modData) == "table" and (m.modData.tagid or m.modData.tag_id)) or m.tagid or m.modID
    if id and not info.set[id] then info.set[id] = true; info.ids[#info.ids + 1] = id end
  end
  local ok = pcall(function()
    local mm = core_modmanager
    if not mm then return end
    local list = (mm.getMods and mm.getMods()) or (mm.getModList and mm.getModList()) or (mm.getModDB and mm.getModDB())
    if type(list) == "table" and type(list.mods) == "table" then list = list.mods end
    if type(list) == "table" and next(list) ~= nil then
      for name, m in pairs(list) do addMod(m, name) end
      info.source = "modmanager"
    end
  end)
  if info.source == "none" and jsonReadFile then
    pcall(function()
      local db = jsonReadFile("mods/db.json")
      if type(db) == "table" and type(db.mods) == "table" then
        for name, m in pairs(db.mods) do addMod(m, name) end
        info.source = "db.json"
      end
    end)
  end
  if info.source == "none" and FS and FS.findFiles then
    pcall(function()
      local files = FS:findFiles("/mods/", "*.zip", -1, false, false) or {}
      for _ in pairs(files) do info.total = info.total + 1 end
      info.active = info.total
      info.source = "files"
    end)
  end
  installedCache, installedAt, installedDirty = info, clock, false
  return info
end
local function installedSet() return installedInfo().set end

local function sendInstalled(force)
  if not guihooks then return end
  local info = installedInfo(force)
  local sig = info.total .. "/" .. info.active .. "/" .. #info.ids
  if not force and sig == installedSig then return end
  installedSig = sig
  guihooks.trigger("MarketplaceModInstalled", { total = info.total, active = info.active, ids = info.ids, source = info.source })
end

local function photoSet()
  loadImgCache()
  local set = {}
  for id, c in pairs(imgCache) do if c.cover then set[id] = true end end
  return set
end

local function setOf(t)
  if type(t) ~= "table" then return nil end
  local s = {}
  for _, v in pairs(t) do s[v] = true end
  return next(s) and s or nil
end

local function runQuery()
  if not lastQuery then return end
  local q = lastQuery
  local cats = {}
  for _, id in pairs(q.categories or {}) do cats[tonumber(id)] = true end
  local list = C.filterSort(pool, {
    query = q.query or "", categories = cats, hideOutdated = q.hideOutdated, onlyCurrent = q.onlyCurrent,
    hidePrefixes = q.hideUnstable and { Alpha = true, Beta = true, Experimental = true, WIP = true } or nil,
    minRating = tonumber(q.minRating), gameMajor = gameMajor, now = now(), hideAuto = autoHidden(),
    updatedWithin = q.updatedWithin, minSize = tonumber(q.minSize), maxSize = tonumber(q.maxSize),
    minDownloads = tonumber(q.minDownloads), author = q.author,
    hideSubscribed = q.hideSubscribed, installed = q.hideSubscribed and installedSet() or nil,
    statuses = setOf(q.statuses), vehicleTypes = setOf(q.vehicleTypes),
    hasPhotos = q.hasPhotos, photos = q.hasPhotos and photoSet() or nil,
    sort = (q.sort == "relevance" and (q.query or "") == "") and "popular" or q.sort,
  })
  local limit = math.max(24, math.min(tonumber(q.limit) or 60, 3000))
  fetchDetailsFor(list, 24)
  wantPhotos(list, math.min(limit, 24))
  if guihooks then
    guihooks.trigger("MarketplaceModResults", { reqId = q.reqId, items = slimList(list, limit), total = #list,
      loaded = #pool, status = status, busy = (#pending > 0 or inFlight),
      serverMore = (q.query or "") ~= "" and serverQuery.more, catalog = catalogStatus() })
  end
end

local function sendTop(periodName)
  loadSnap()
  local list, mode, info = C.topDownloaded(pool, snap, periodName or "all", now())
  if guihooks then
    guihooks.trigger("MarketplaceModTop", { period = periodName, mode = mode, info = info, items = slimList(list, 24, mode ~= "total") })
  end
end

local function oldRepoFinderActive()
  local found = false
  pcall(function()
    for name, m in pairs(core_modmanager.getMods() or {}) do
      if type(m) == "table" and tostring(m.modname or name):lower() == "repofinder" and m.active ~= false then found = true end
    end
  end)
  return found
end
M.oldRepoFinderActive = oldRepoFinderActive

-- ---------- UI entry points (called from the Marketplace UI) ----------
function M.uiOpen()
  gameMajor = gameMajor or getGameMajor()
  local ok, why = online()
  if guihooks then
    guihooks.trigger("MarketplaceModHello", { gameMajor = gameMajor, online = ok, reason = why, oldRepoFinder = oldRepoFinderActive(),
      categories = (function() local o = {} for _, c in ipairs(C.categories) do o[#o + 1] = { id = c[1], name = c[2] } end return o end)() })
  end
  uiSeen = true; uiVisible = true
  M.startOpenCheck()
  if #pool == 0 then loadCatalog(); pcall(loadSeed) end
  installedDirty = true; sendInstalled(true)
  if #pool > 0 then sendHome() end -- instant from cache, reshuffled per rotation window
  if not ok then return end
  refreshListings(not homeLoaded and #pool == 0)
  homeLoaded = true
end

function M.uiQuery(opts)
  opts = type(opts) == "table" and opts or {}
  lastUserAt = clock
  local ok, why = online()
  lastQuery = opts
  runQuery() -- instant results from the local catalog
  local kind = opts.kind or "new"
  if kind == "local" or not ok then if not ok then status = why end; return end
  local q = opts.query or ""
  local ids = {}
  for _, id in pairs(opts.categories or {}) do ids[#ids + 1] = tonumber(id) end
  if #ids == 0 then ids = allCategoryIds() end
  if q == "" then return end -- browsing: the catalog crawler covers everything
  if kind == "new" or serverQuery.q ~= q then serverQuery = { q = q, page = 0, more = true } end
  if not serverQuery.more then return end
  local cb = function(data)
    lastUserAt = clock
    local n = 0
    if data and type(data.data) == "table" then for _ in pairs(data.data) do n = n + 1 end end
    if n < PAGE_SIZE then serverQuery.more = false end
    dirty.query = true
  end
  -- the server's own search, page after page as the user scrolls
  fetchPages(q, "downloads", ids, serverQuery.page + 1, 2, cb)
  if serverQuery.page == 0 then
    for _, tok in ipairs(C.tokenize(q)) do
      if #tok >= 3 and tok ~= q:lower() then fetchPages(tok, "downloads", ids, 1, 1, function() dirty.query = true end) end
    end
  end
  serverQuery.page = serverQuery.page + 2
end

function M.uiAuthors(prefix)
  if guihooks then guihooks.trigger("MarketplaceModAuthors", { prefix = prefix or "", items = C.authors(pool, prefix, 12) }) end
end

function M.uiInstalled() sendInstalled(true) end

-- thumbnail for an installed repo mod (used by the Library): cached photo, else repo icon
function M.thumbFor(tagid)
  local it = poolIndex[tagid]
  loadImgCache()
  local c = imgCache[tagid]
  if c and c.cover then return c.cover end
  if it and it.path then return ICON_BASE .. it.path .. "icon.jpg" end
  return nil
end

-- catalog facts for the Mod Manager (category / downloads / rating / dates / photos); nil if unknown
function M.infoFor(tagid)
  local it = poolIndex[tagid]
  loadImgCache()
  local c = imgCache[tagid]
  if not it and not c then return nil end
  local cat = it and C.catOf(it)
  local catName
  for _, e in ipairs(C.categories) do if e[1] == cat then catName = e[2] end end
  local req = {}
  for _, r in ipairs(it and M.requirementsOf(it) or {}) do if r.resourceId then req[#req + 1] = r.resourceId end end
  return { requires = req, category = catName, downloads = it and tonumber(it.download_count), rating = it and tonumber(it.rating_avg),
    ratings = it and tonumber(it.rating_count), published = it and tonumber(it.resource_date), updated = it and tonumber(it.last_update),
    images = c and c.images or nil }
end

-- catalog lookup for mod pack previews (nil = unknown; removed = dropped from the repository)
function M.catalogItem(tagid)
  local it = poolIndex[tagid]
  if it then return { title = it.title, size = tonumber(it.filesize) } end
  if crawl.done and #pool > 1000 then return { removed = true } end
  return nil
end

-- requirements of a repository mod (for mod pack imports); {} when the catalog doesn't know it
function M.requirementsFor(tagid) return M.requirementsOf(poolIndex[tagid]) end

-- changelog / latest text for an update (getMod; field names beyond `message` are assumed)
function M.changelog(id, cb)
  enqueue("s1/v4/getMod/" .. tostring(id), nil, function(data)
    local d = data and data.data
    if type(d) ~= "table" then return cb(nil) end
    rememberImages(d, id)
    cb({ text = d.update_message or d.changelog or d.latest_update or d.message, version = d.version_string, updated = d.last_update,
      images = C.extractImages(d, d.message) })
  end)
end

-- no repository downloads while BeamMP joins a server (marketplaceModMP.joining)
local function mpJoining()
  local mp = rawget(_G, "marketplaceModMP")
  if type(mp) ~= "table" or type(mp.joining) ~= "function" then return false end
  local ok, b = pcall(mp.joining)
  return ok and b == true
end
M.mpJoining = mpJoining
local JOIN_BUSY = "Not started: BeamMP was joining a server"
local function refusedByJoin(ids)
  if not mpJoining() then return false end
  local f = {}
  for _, id in ipairs(ids) do f[#f + 1] = { id = id, state = "failed", error = JOIN_BUSY } end
  if guihooks then
    guihooks.trigger("MarketplaceModDownloads", f)
    guihooks.trigger("MarketplaceModLibMsg", { type = "error", msg = "BeamMP is joining a server and downloading its mods right now. Downloads from the repository wait until the join has finished or was cancelled (use Retry then)." })
  end
  return true
end

function M.uiRetry(id)
  if refusedByJoin({ id }) then return end
  local ok1, ok2 = false, false
  if core_repository then
    if core_repository.updateOneMod then ok1 = pcall(core_repository.updateOneMod, id) end
    if core_repository.modSubscribe then ok2 = pcall(core_repository.modSubscribe, id) end
  end
  local done = ok1 or ok2
  if guihooks then guihooks.trigger("MarketplaceModDownloads", { { id = id, state = done and "queued" or "failed",
    error = (not done) and "retry not available" or nil } }) end
end

-- the UI asks for the game's queue to find subscriptions that never made it in (repoError)
function M.uiQueueCheck() pcall(function() core_repository.uiUpdateQueue() end) end

function M.uiOpenModsManager()
  if guihooks then guihooks.trigger("ChangeState", { state = "menu.mods.local" }) end
end

-- the game broadcasts these extension hooks when mods change
function M.onModManagerStateChanged() installedDirty = true; sendInstalled() end
function M.onModActivated() installedDirty = true; sendInstalled() end
function M.onModDeactivated() installedDirty = true; sendInstalled() end
function M.onModManagerReady() installedDirty = true; sendInstalled() end

function M.uiCatalog() if guihooks then guihooks.trigger("MarketplaceModCatalog", catalogStatus()) end end

function M.uiTop(periodName) sendTop(periodName) end

function M.uiDetail(id)
  local it = poolIndex[id]
  loadProfile()
  if it then C.learn(profile, it, "view"); profileDirty = true end
  if it and guihooks then guihooks.trigger("MarketplaceModDetail", { item = slim(it), message = it.message, partial = true, requirements = M.requirementsOf(it),
    images = (function() loadImgCache(); local c = imgCache[it.tagid]; return c and c.images or C.extractImages(it, it.message) end)() }) end
  if not online() then return end
  enqueue("s1/v4/getMod/" .. tostring(id), nil, function(data, req)
    if C.isRemovedResponse(data, req) then
      local old = poolIndex[id]
      dropRemoved(id)
      if guihooks then guihooks.trigger("MarketplaceModDetail", { id = id, removed = true, item = old and slim(old) or { id = id, title = tostring(id) },
        images = {} }) end
    elseif data and data.data then
      C.merge(pool, poolIndex, { data.data })
      local full = poolIndex[data.data.tagid or id] or data.data
      local ids = {}
      for _, d in ipairs(LC.parseDeps(full.message)) do ids[#ids + 1] = d.resourceId end
      full.req_local = #ids > 0 and ids or nil
      rememberImages(full)
      if guihooks then guihooks.trigger("MarketplaceModDetail", { item = slim(full), message = full.message, requirements = M.requirementsOf(full),
        images = C.extractImages(full, full.message) }) end
    end
  end)
end

function M.uiSubscribe(id)
  if refusedByJoin({ id }) then return end
  if core_repository and core_repository.modSubscribe then
    core_repository.modSubscribe(id)
    if guihooks then guihooks.trigger("MarketplaceModDownloads", { { id = id, state = "queued" } }) end
    if poolIndex[id] then poolIndex[id].sub = true end
    loadProfile(); C.learn(profile, poolIndex[id] or { tagid = id }, "subscribe"); profileDirty = true; saveProfile()
    if guihooks then guihooks.trigger("MarketplaceModSubscribed", { id = id, ok = true }) end
  elseif guihooks then
    guihooks.trigger("MarketplaceModSubscribed", { id = id, ok = false, reason = "core_repository.modSubscribe missing" })
  end
end

-- install flow with requirements: the UI asks first (Install all / Just this mod / Cancel)
function M.uiInstallPlan(id)
  local it = poolIndex[id]
  local missing = {}
  for _, r in ipairs(M.requirementsOf(it)) do if not r.installed then missing[#missing + 1] = r end end
  if guihooks then guihooks.trigger("MarketplaceModInstallPlan", { id = id, title = it and it.title or tostring(id), size = it and tonumber(it.filesize), missing = missing }) end
  return missing
end
-- only called after the user chose "Install all": subscribes to the mod and its not-installed requirements
function M.uiSubscribeMany(ids)
  local list = {}
  for _, id in pairs(ids or {}) do if type(id) == "string" and id ~= "" then list[#list + 1] = id end end
  if refusedByJoin(list) then return 0 end
  local n = 0
  for _, id in pairs(ids or {}) do if type(id) == "string" and id ~= "" then M.uiSubscribe(id); n = n + 1 end end
  instCache = nil
  return n
end

function M.uiOpenOfficial(id)
  if core_repository and core_repository.uiShowMod then core_repository.uiShowMod(id) end
end

function M.toggle() if guihooks then guihooks.trigger("MarketplaceModToggle", {}) end end
M.open = M.toggle

-- ---------- game hooks ----------
local levelCheck = 0
function M.onUpdate(dtReal)
  dtReal = dtReal or 0.016
  levelCheck = levelCheck - dtReal
  if levelCheck <= 0 then levelCheck = 2; levelLoaded = detectLevel() end
  if levelLoaded then return end -- in a level (driving or paused): do nothing at all
  clock = clock + dtReal
  if core_online then pump(dtReal) end
  dirtyTimer = dirtyTimer - dtReal
  bgTimer = bgTimer - dtReal
  if bgTimer <= 0 and (bgPending.home or bgPending.query) then
    bgTimer = 3
    if bgPending.home then dirty.home = true end
    if bgPending.query then dirty.query = true end
    bgPending.home, bgPending.query = false, false
  end
  if dirtyTimer <= 0 and (dirty.home or dirty.query) and uiVisible then -- no rebuilds while the UI is closed
    dirtyTimer = 0.4
    if dirty.home then dirty.home = false; sendHome() end
    if dirty.query then dirty.query = false; runQuery() end
  end
  catPushTimer = catPushTimer - dtReal
  if session and session.pushStatus then session.pushStatus = false; dirty.catalog = true; catPushTimer = 0 end
  if dirty.catalog and catPushTimer <= 0 and uiVisible then
    dirty.catalog = false; catPushTimer = 1.0
    local stt = catalogStatus()
    local sig = table.concat({ stt.loaded, stt.sorted, stt.total, tostring(stt.done), tostring(stt.crawling), tostring(stt.paused), tostring(stt.crawlDriving),
      crawl.cs and crawl.cs.cat or 0, crawl.cs and crawl.cs.n or 0 }, "|")
    if sig ~= lastCatSig and guihooks then lastCatSig = sig; guihooks.trigger("MarketplaceModCatalog", stt) end
  end
  installedPoll = (installedPoll or 0) + dtReal
  -- no installed-mods polling; refreshed on open and by the mod manager's own change hooks
  catalogSaveTimer = catalogSaveTimer + dtReal
  -- writing the catalog JSON is a big one-frame job: every 10 min, and never while driving
  if catalogDirty and catalogSaveTimer > 600 and crawlAllowed() then catalogSaveTimer = 0; saveCatalog() end
  snapSaveTimer = snapSaveTimer + dtReal
  if snapSaveTimer > 300 then snapSaveTimer = 0; saveSnap(); saveProfile(); saveImgCache() end
  if uiSeen then
    refreshTimer = refreshTimer + dtReal
    -- no timed reshuffle; Discover is rebuilt when the UI opens
  end
end

function M.onExtensionLoaded()
  gameMajor = getGameMajor()
  log("I", logTag, "Marketplace loaded, game major " .. tostring(gameMajor))
end

function M.onExtensionUnloaded() saveSnap(); saveProfile(); saveImgCache(); if #pool > 0 then saveCatalog() end end
M.onExit = M.onExtensionUnloaded

M._core = C
-- Automation exports are on by default; this only hides them from views (data is kept)
function M.uiSetAutomationHidden(hide)
  loadProfile(); if not profile then return end
  profile.hideAutomation = hide == true; profileDirty = true; saveProfile()
  dirty.home = true; dirty.query = true; dirty.catalog = true
end
M.uiSetAutomation = function(on) M.uiSetAutomationHidden(on == false) end
M._state = function() return { pool = pool, pending = pending, snap = snap, profile = profile, crawl = crawl, lowQueue = lowQueue } end
return M
