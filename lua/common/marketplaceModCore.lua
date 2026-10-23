-- Marketplace core: catalog search, filters, rankings and recommendations.
-- Plain Lua with no game APIs.

local C = {}

-- major game version release dates (UTC unix time), from beamng.com patch notes
C.releases = {
  {"0.24", 1638403200}, -- 2021-12-02
  {"0.25", 1655251200}, -- 2022-06-15
  {"0.26", 1663545600}, -- 2022-09-19
  {"0.27", 1670889600}, -- 2022-12-13
  {"0.28", 1680566400}, -- 2023-04-04
  {"0.29", 1688428800}, -- 2023-07-04
  {"0.30", 1695168000}, -- 2023-09-20
  {"0.31", 1702512000}, -- 2023-12-14
  {"0.32", 1713225600}, -- 2024-04-16
  {"0.33", 1726617600}, -- 2024-09-18
  {"0.34", 1733788800}, -- 2024-12-10
  {"0.35", 1743552000}, -- 2025-04-02
  {"0.36", 1750118400}, -- 2025-06-17
  {"0.37", 1757980800}, -- 2025-09-16
  {"0.38", 1765324800}, -- 2025-12-10
  {"0.39", 1785283200}, -- 2026-07-29
}

C.categories = { -- ids used by the official repository UI
  {3, "Land"}, {4, "Air"}, {5, "Props"}, {6, "Boats"}, {14, "Configurations"},
  {8, "Scenarios"}, {9, "Terrains/Maps"}, {10, "UI Apps"}, {13, "Sounds"},
  {15, "License Plates"}, {7, "Mods of Mods"}, {12, "Skins"},
  {16, "Automation Exports"},
}
C.AUTOMATION = 16
function C.isAuto(it)
  local v = it._au
  if v == nil then
    v = false
    if type(it.cats) == "table" then for _, c in pairs(it.cats) do if tonumber(c) == 16 then v = true; break end end end
    if not v and (tonumber(it.category) == 16 or it.category_title == "Automation Exports" or it.category_title == "Automation") then v = true end
    it._au = v
  end
  return v
end
-- split once per rebuild (cheap, uses the cached flag)
function C.splitAuto(items)
  local main, auto = {}, {}
  for i = 1, #items do local it = items[i]; if C.isAuto(it) then auto[#auto + 1] = it else main[#main + 1] = it end end
  return main, auto
end

C.catByTitle = { ["Land"] = 3, ["Air"] = 4, ["Props"] = 5, ["Boats"] = 6, ["Configurations"] = 14, ["Scenarios"] = 8,
  ["Terrains, Levels, Maps"] = 9, ["User Interface Apps"] = 10, ["Sounds"] = 13, ["License Plates"] = 15,
  ["Mods of Mods"] = 7, ["Skins"] = 12 }
C.AGELESS_CATS = { [8] = true }
function C.ageless(it)
  if not it then return false end
  if type(it.cats) == "table" then for _, v in pairs(it.cats) do if C.AGELESS_CATS[tonumber(v)] then return true end end end
  local c = tonumber(it.category) or (it.category_title and C.catByTitle[it.category_title])
  return c and C.AGELESS_CATS[c] or false
end
function C.catOf(it)
  if not it then return nil end
  local c = tonumber(it.category)
  if c then return c end
  if type(it.cats) == "table" then for _, v in pairs(it.cats) do if tonumber(v) then return tonumber(v) end end end
  if it.category_title then return C.catByTitle[it.category_title] end
  return nil
end
function C.inCats(it, set)
  if type(it.cats) == "table" then for _, v in pairs(it.cats) do if set[tonumber(v)] then return true end end end
  local c = C.catOf(it)
  return c ~= nil and set[c] == true
end
function C.stampCat(it, cat)
  cat = tonumber(cat); if not (it and cat) then return false end
  if cat == 16 then it._au = true end
  if type(it.cats) ~= "table" then it.cats = {} end
  for _, v in pairs(it.cats) do if tonumber(v) == cat then return false end end
  it.cats[#it.cats + 1] = cat
  return true
end
-- `sub` may arrive as true/1/"1"; 0/false/nil mean not subscribed (0 is truthy in Lua!)
function C.isSub(it) local v = it and it.sub; return v == true or v == 1 or v == "1" or v == "true" end

function C.majorOf(versionString)
  if type(versionString) ~= "string" then return nil end
  local a, b = versionString:match("^(%d+)%.(%d+)")
  if not a then return nil end
  return a .. "." .. b
end

-- release time of the given major (or of the newest known major <= it)
local relCache = {}
function C.releaseTime(major)
  if not major then return nil end
  local c = relCache[major]
  if c then return c[1], c[2] end
  local t, n = C._releaseTime(major)
  relCache[major] = { t, n }
  return t, n
end
function C._releaseTime(major)
  local ma, mi = major:match("^(%d+)%.(%d+)$")
  ma, mi = tonumber(ma), tonumber(mi)
  local best
  for _, r in ipairs(C.releases) do
    local ra, ri = r[1]:match("^(%d+)%.(%d+)$")
    ra, ri = tonumber(ra), tonumber(ri)
    if ra < ma or (ra == ma and ri <= mi) then best = r end
  end
  return best and best[2], best and best[1]
end

function C.majorAt(t)
  local cur
  for _, r in ipairs(C.releases) do
    if t >= r[2] then cur = r[1] end
  end
  return cur
end

function C.compat(item, gameMajor)
  -- cached per item until its last_update or the game version changes (refresh clears it automatically)
  if item and item._ct ~= nil and item._ct == item.last_update and item._cm == gameMajor then return item._cl, item._cb end
  local l, b = C._compat(item, gameMajor)
  if item then item._ct, item._cm, item._cl, item._cb = item.last_update, gameMajor, l, b end
  return l, b
end
function C._compat(item, gameMajor)
  local t = tonumber(item and item.last_update)
  if not t or t <= 0 then return "unknown", "Version ?" end
  local relCur = C.releaseTime(gameMajor)
  if not relCur then return "unknown", "Version ?" end
  if t >= relCur then return "current", "Updated for " .. gameMajor end
  -- find previous major release
  local prevRel
  for _, r in ipairs(C.releases) do
    if r[2] < relCur then prevRel = r[2] end
  end
  local m = C.majorAt(t) or "<0.24"
  if prevRel and t >= prevRel then return "previous", "Last updated for " .. m .. " (probably OK)" end
  -- BeamNG has no supported-version field, so don't claim incompatibility: it's just an older mod
  return "outdated", "Older mod · last updated " .. os.date("!%b %Y", t)
end

-- ---------- fuzzy text search ----------
local function lower(s) return (type(s) == "string" and s or ""):lower() end

-- reuses two row buffers (no per-row table allocations; matters with ~29k mods)
local LV_PREV, LV_CUR = {}, {}
local byte, min = string.byte, math.min
local function levenshtein(a, b, maxd)
  local la, lb = #a, #b
  if math.abs(la - lb) > maxd then return maxd + 1 end
  local prev, cur = LV_PREV, LV_CUR
  for j = 0, lb do prev[j] = j end
  for i = 1, la do
    cur[0] = i
    local rowmin = i
    local ca = byte(a, i)
    for j = 1, lb do
      local v = prev[j - 1] + ((ca == byte(b, j)) and 0 or 1)
      local x = prev[j] + 1; if x < v then v = x end
      x = cur[j - 1] + 1; if x < v then v = x end
      cur[j] = v
      if v < rowmin then rowmin = v end
    end
    if rowmin > maxd then return maxd + 1 end
    prev, cur = cur, prev
  end
  return prev[lb]
end
C.levenshtein = levenshtein

function C.tokenize(s)
  local out = {}
  for w in lower(s):gmatch("[%w]+") do out[#out + 1] = w end
  return out
end

-- score one query token against a field's words; 0 = no match
local function tokenScore(tok, text, words, noFuzzy)
  if text:find(tok, 1, true) then
    for _, w in ipairs(words) do
      if w == tok then return 10 end
      if w:sub(1, #tok) == tok then return 7 end
    end
    return 5
  end
  if #tok >= 4 and not noFuzzy then
    local maxd = (#tok >= 7) and 2 or 1
    local t1, t2 = byte(tok, 1), byte(tok, 2)
    for _, w in ipairs(words) do
      -- cheap gate: typos almost never hit both of the first two letters
      local w1, w2 = byte(w, 1), byte(w, 2)
      if (w1 == t1 or w2 == t2 or w1 == t2 or w2 == t1) and #w >= #tok - maxd
        and levenshtein(tok, w:sub(1, #tok + maxd), maxd) <= maxd then return 3 end
    end
  end
  return 0
end

function C.score(item, query, noFuzzy)
  local toks = type(query) == "table" and query or C.tokenize(query)
  if #toks == 0 then return 1 end
  item._idx = item._idx or {
    { lower(item.title), C.tokenize(item.title), 3 },
    { lower(item.tag_line), C.tokenize(item.tag_line), 2 },
    { lower((item.prefix_title or "") .. " " .. (item.username or item.author or "") .. " " .. (item.tags or "")),
      C.tokenize((item.prefix_title or "") .. " " .. (item.username or item.author or "") .. " " .. (item.tags or "")), 1 },
    { lower(item.message), C.tokenize(item.message), 1 },
  }
  local total = 0
  for _, tok in ipairs(toks) do
    local best = 0
    for _, f in ipairs(item._idx) do
      local s = tokenScore(tok, f[1], f[2], noFuzzy) * f[3]
      if s > best then best = s end
    end
    if best == 0 then return 0 end
    total = total + best
  end
  return total
end

-- ---------- filtering & sorting ----------
-- ---------- extra Browse filters ----------
local VT_WORDS = {
  trailer = { "trailer", "caravan", "dolly", "flatbed trailer" },
  bus     = { "bus", "coach", "schoolbus", "minibus" },
  bike    = { "bike", "motorcycle", "motorbike", "scooter", "moped", "dirtbike", "atv", "quad" },
  truck   = { "truck", "semi", "lorry", "pickup", "tractor", "dump", "t-series", "t75", "hauler", "tow" },
}
local VT_ORDER = { "trailer", "bus", "bike", "truck" }
-- vehicle type of a Land mod by keywords in title/tagline; nil for non-Land mods
function C.vehicleType(it)
  if not C.inCats(it, { [3] = true }) then return nil end
  if it._vt then return it._vt end
  local text = " " .. lower(tostring(it.title or "") .. " " .. tostring(it.tag_line or "")):gsub("[^%w%-]", " ") .. " "
  local vt = "car"
  for _, k in ipairs(VT_ORDER) do
    for _, w in ipairs(VT_WORDS[k]) do
      if text:find("[%s]" .. w:gsub("%-", "%%-") .. "s?[%s]") then vt = k; break end
    end
    if vt ~= "car" then break end
  end
  it._vt = vt
  return vt
end

function C.releaseStatus(it)
  local p = lower(tostring(it.prefix_title or "")):gsub("%s", "")
  if p == "alpha" or p == "wip" then return "Alpha" end
  if p == "beta" then return "Beta" end
  if p == "experimental" then return "Experimental" end
  return "Stable"
end

C.withinSeconds = { week = 7 * 86400, month = 30 * 86400, ["3months"] = 91 * 86400, year = 365 * 86400 }

local function anySet(t) return type(t) == "table" and next(t) ~= nil end

function C.passExtra(it, opts, now)
  local w = C.withinSeconds[opts.updatedWithin or ""]
  if w and (now - (tonumber(it.last_update) or 0)) > w then return false end
  local size = tonumber(it.filesize)
  if opts.minSize and (not size or size < opts.minSize) then return false end
  if opts.maxSize and (not size or size > opts.maxSize) then return false end
  if opts.minDownloads and (tonumber(it.download_count) or 0) < opts.minDownloads then return false end
  if opts.author and opts.author ~= "" then
    local a = lower(tostring(it.username or it.author or ""))
    if not a:find(lower(opts.author), 1, true) then return false end
  end
  if opts.hideSubscribed and (C.isSub(it) or (opts.installed and opts.installed[it.tagid])) then return false end
  if anySet(opts.statuses) and not opts.statuses[C.releaseStatus(it)] then return false end
  if anySet(opts.vehicleTypes) then
    local vt = C.vehicleType(it)
    if not vt or not opts.vehicleTypes[vt] then return false end
  end
  if opts.hasPhotos and not (opts.photos and opts.photos[it.tagid]) then return false end
  return true
end

-- authors for autocomplete: prefix matches first, then substring, by mod count
function C.authors(items, prefix, n)
  prefix = lower(prefix or "")
  local count = {}
  for _, it in ipairs(items) do
    local a = it.username or it.author
    if a and a ~= "" then count[a] = (count[a] or 0) + 1 end
  end
  local out = {}
  for a, c in pairs(count) do
    local l = lower(a)
    local pos = prefix == "" and 1 or l:find(prefix, 1, true)
    if pos then out[#out + 1] = { name = a, count = c, pre = pos == 1 } end
  end
  table.sort(out, function(x, y)
    if x.pre ~= y.pre then return x.pre end
    if x.count ~= y.count then return x.count > y.count end
    return lower(x.name) < lower(y.name)
  end)
  local res = {}
  for i = 1, math.min(n or 10, #out) do res[i] = { name = out[i].name, count = out[i].count } end
  return res
end

function C.filterSort(items, opts)
  opts = opts or {}
  local toks = C.tokenize(opts.query or "")
  local anyCat = not opts.categories or next(opts.categories) == nil
  local out
  local function run(noFuzzy)
    out = {}
    local autoOut = opts.hideAuto or (anyCat and #toks == 0 and not opts.includeAuto)
    for _, it in ipairs(items) do
      local ok = anyCat or C.inCats(it, opts.categories)
      if ok and autoOut and C.isAuto(it) then ok = false end
      if ok and opts.hidePrefixes and (opts.hidePrefixes[C.releaseStatus(it)] or opts.hidePrefixes[it.prefix_title]) then ok = false end
      if ok and opts.minRating and (tonumber(it.rating_avg) or 0) < opts.minRating then ok = false end
      local level = C.compat(it, opts.gameMajor)
      it._compat = level
      -- scenarios don't go out of date: never hidden because of age
      if ok and opts.hideOutdated and level == "outdated" and not C.ageless(it) then ok = false end
      if ok and opts.onlyCurrent and level ~= "current" then ok = false end
      if ok and not C.passExtra(it, opts, opts.now or os.time()) then ok = false end
      if ok then
        local s = C.score(it, toks, noFuzzy)
        if s > 0 then it._score = s; out[#out + 1] = it end
      end
    end
  end
  run(#toks > 0 and opts.fuzzy ~= true)
  if #toks > 0 and opts.fuzzy ~= false and #out < (opts.fuzzyBelow or 30) then run(false) end
  local now = opts.now or os.time()
  local sort = opts.sort or (#toks > 0 and "relevance" or "popular")
  local function num(x) return tonumber(x) or 0 end
  local key = {
    relevance = function(i) return i._score * 1e7 + math.log(num(i.download_count) + 1) end,
    downloads = function(i) return num(i.download_count) end,
    rating    = function(i) return num(i.rating_avg) * 1e3 + math.min(999, num(i.rating_count)) end,
    updated   = function(i) return num(i.last_update) end,
    popular   = function(i) return C.popularity(i, now) end,
  }
  local f = key[sort] or key.popular
  for _, it in ipairs(out) do it._key = f(it) end
  table.sort(out, function(a, b)
    if a._key ~= b._key then return a._key > b._key end
    return lower(a.title) < lower(b.title)
  end)
  return out
end

function C.popularity(i, now)
  local dl = tonumber(i.download_count) or 0
  local t = tonumber(i.last_update) or 0
  local ageDays = t > 0 and math.max(0, (now - t) / 86400) or 3650
  local rating = tonumber(i.rating_avg) or 3
  return math.log(dl + 1) * (0.6 + 0.1 * rating) / math.sqrt(1 + ageDays / 30)
end

function C.recommend(items, gameMajor, n, now)
  local list = C.filterSort(items, { onlyCurrent = true, gameMajor = gameMajor, sort = "downloads", now = now })
  local out = {}
  for i = 1, math.min(n or 20, #list) do out[i] = list[i] end
  return out
end

function C.mergeCount(pool, index, items)
  local changed = 0
  for _, it in ipairs(items or {}) do
    local old = index[it.tagid or it.id]
    if old and (tonumber(old.last_update) ~= tonumber(it.last_update) or tonumber(old.download_count) ~= tonumber(it.download_count)) then
      changed = changed + 1
    end
  end
  return C.merge(pool, index, items), changed
end

function C.merge(pool, index, items)
  local added = 0
  for _, it in ipairs(items or {}) do
    local id = it.tagid or it.id
    if id ~= nil then
      local old = index[id]
      if old then
        for k, v in pairs(it) do old[k] = v end
        old._idx = nil; old._au = nil
      else
        if it.seen == nil then it.seen = os.time() end -- first sighting; protects mods found mid-pass from pruning
        index[id] = it
        pool[#pool + 1] = it
        added = added + 1
      end
    end
  end
  return added
end

function C.fmtDate(t)
  t = tonumber(t)
  if not t or t <= 0 then return "?" end
  return os.date("!%Y-%m-%d", t)
end

function C.fmtCount(n)
  n = tonumber(n) or 0
  if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
  if n >= 1e3 then return string.format("%.0fK", n / 1e3) end
  return tostring(n)
end

C.periods = { today = 86400, week = 7 * 86400, month = 30 * 86400, year = 365 * 86400, all = 0 }
C.snapshotEvery = 3600 -- at most one sample per mod per hour
C.snapshotKeep = 60 -- samples kept per mod (thinned, see below)

function C.recordSnapshots(snap, items, now)
  local n = 0
  for _, it in ipairs(items or {}) do
    local id, dl = it.tagid, tonumber(it.download_count)
    if id and dl then
      local list = snap[id]
      if not list then list = {}; snap[id] = list end
      local last = list[#list]
      if not last or now - last[1] >= C.snapshotEvery then
        list[#list + 1] = { now, dl }; n = n + 1
        if #list > C.snapshotKeep then
          -- keep the oldest sample (period coverage) and drop the 2nd oldest
          table.remove(list, 2)
        end
      end
    end
  end
  return n
end

function C.periodDelta(list, period, now)
  if not list or #list < 2 then return nil end
  local need = now - period
  local slack = math.max(3600, period * 0.1)
  if list[1][1] > need + slack then return nil end
  local base = list[1]
  for _, s in ipairs(list) do
    if s[1] <= need + slack then base = s else break end
  end
  return math.max(0, list[#list][2] - base[2])
end

-- returns ranked list, mode ("total" | "snapshots" | "estimated"), info string
function C.topDownloaded(items, snap, periodName, now, minCoverage)
  local nonAuto = {}
  for i = 1, #items do if not C.isAuto(items[i]) then nonAuto[#nonAuto + 1] = items[i] end end
  items = nonAuto
  local period = C.periods[periodName] or 0
  local function num(x) return tonumber(x) or 0 end
  local out = {}
  if period == 0 then
    for _, it in ipairs(items) do out[#out + 1] = it end
    table.sort(out, function(a, b) return num(a.download_count) > num(b.download_count) end)
    return out, "total", "All-time total downloads"
  end
  local covered = 0
  for _, it in ipairs(items) do
    local d = C.periodDelta(snap and snap[it.tagid], period, now)
    it._delta = d
    if d then covered = covered + 1 end
  end
  minCoverage = minCoverage or 20
  if covered >= math.min(minCoverage, #items) and covered > 0 then
    for _, it in ipairs(items) do if it._delta and it._delta > 0 then out[#out + 1] = it end end
    table.sort(out, function(a, b) return a._delta > b._delta end)
    return out, "snapshots", string.format("Downloads gained in this period (measured on this PC, %d mods tracked)", covered)
  end
  for _, it in ipairs(items) do
    local since = tonumber(it.last_update) or tonumber(it.date or it.resource_date)
    local dl = num(it.download_count)
    if since and since > 0 and dl > 0 then
      local days = math.max(1, (now - since) / 86400)
      local est = dl / days * (period / 86400)
      it._delta = math.floor(math.min(dl, est) + 0.5)
      out[#out + 1] = it
    else
      it._delta = nil
    end
  end
  table.sort(out, function(a, b) return a._delta > b._delta end)
  return out, "estimated", "Estimated: no download history recorded yet, so each mod's average downloads per day since its last update is scaled to this period. Real counts replace this once Marketplace has tracked downloads for the whole period."
end

-- ---------- recommendations ----------
C.weights = { momentum = 0.30, rating = 0.20, recency = 0.15, compat = 0.15, personal = 0.20, jitter = 0.08 }
C.rotationSeconds = 4 * 3600

local function hash(s)
  local h = 5381
  s = tostring(s)
  for i = 1, #s do h = (h * 33 + s:byte(i)) % 2147483647 end
  return h
end
C.hash = hash

function C.momentum(it, snap, now)
  local d = C.periodDelta(snap and snap[it.tagid], 7 * 86400, now)
  if d then return d / 7, true end
  local dl = tonumber(it.download_count) or 0
  local since = tonumber(it.last_update) or tonumber(it.date or it.resource_date)
  if not since or since <= 0 then return dl / 3650, false end
  return dl / math.max(1, (now - since) / 86400), false
end

function C.bayesRating(it, mean, m)
  local r = tonumber(it.rating_avg) or 0
  local v = tonumber(it.rating_count) or (r > 0 and 5 or 0)
  m = m or 10
  return (v * r + m * (mean or 3.5)) / (v + m)
end

local compatScore = { current = 1, previous = 0.6, unknown = 0.4, outdated = 0 }

-- profile = { cats = {[id]=w}, authors = {[name]=w}, owned = {[tagid]=true} }
function C.scoreAll(items, opts)
  opts = opts or {}
  local now, profile, snap = opts.now or os.time(), opts.profile or {}, opts.snap or {}
  local cats, authors = profile.cats or {}, profile.authors or {}
  local maxCat = 0
  for _, w in pairs(cats) do if w > maxCat then maxCat = w end end
  local sumR, nR, maxMom = 0, 0, 0
  for _, it in ipairs(items) do
    local r = tonumber(it.rating_avg) or 0
    if r > 0 then sumR = sumR + r; nR = nR + 1 end
    local mom = math.log(1 + C.momentum(it, snap, now))
    it._mom = mom
    if mom > maxMom then maxMom = mom end
  end
  local mean = nR > 0 and sumR / nR or 3.5
  local bucket = math.floor(now / C.rotationSeconds) + (opts.seed or 0)
  local W = C.weights
  for _, it in ipairs(items) do
    local lvl = C.compat(it, opts.gameMajor)
    local t = tonumber(it.last_update) or 0
    local ageDays = t > 0 and math.max(0, (now - t) / 86400) or 3650
    local personal = 0
    local c = C.catOf(it)
    if maxCat > 0 and c and cats[c] then personal = 0.7 * cats[c] / maxCat end
    local a = it.username or it.author
    if a and authors[a] and authors[a] > 0 then personal = personal + 0.3 end
    local jitter = (hash(tostring(it.tagid) .. ":" .. bucket) % 1000) / 1000
    it._rec = W.momentum * (maxMom > 0 and it._mom / maxMom or 0)
      + W.rating * (C.bayesRating(it, mean) / 5)
      + W.recency * math.exp(-ageDays / 120)
      + W.compat * (compatScore[lvl] or 0.4)
      + W.personal * personal
      + W.jitter * jitter
  end
end

-- pick n items with highest _rec, honoring filter, exclusions and an author cap
function C.pick(items, n, filter, exclude, perAuthor)
  local sorted = {}
  for _, it in ipairs(items) do
    if (not filter or filter(it)) and not (exclude and exclude[it.tagid]) then sorted[#sorted + 1] = it end
  end
  table.sort(sorted, function(a, b) return (a._rec or 0) > (b._rec or 0) end)
  local out, perA = {}, {}
  perAuthor = perAuthor or 2
  for _, it in ipairs(sorted) do
    local a = it.username or it.author or ("?" .. tostring(it.tagid))
    if (perA[a] or 0) < perAuthor then
      perA[a] = (perA[a] or 0) + 1
      out[#out + 1] = it
      if #out >= n then break end
    end
  end
  return out
end

local function isTruck(it)
  local s = ((it.title or "") .. " " .. (it.tag_line or "")):lower()
  for _, k in ipairs({ "truck", "semi", "lorry", "bus", "tractor", "dump", "tanker", "pickup", "van", "heavy" }) do
    if s:find(k, 1, true) then return true end
  end
  return false
end
C.isTruck = isTruck

C.shelfDefs = {
  { key = "maps",    title = "Recommended Maps",            filter = function(i) return C.inCats(i, { [9] = true }) end, cat = 9 },
  { key = "cars",    title = "Recommended Cars",            filter = function(i) return C.inCats(i, { [3] = true }) and not isTruck(i) end, cat = 3 },
  { key = "trucks",  title = "Recommended Trucks & Heavy",  filter = function(i) return C.inCats(i, { [3] = true }) and isTruck(i) end, cat = 3 },
  { key = "parts",   title = "Mods of Mods & Parts",        filter = function(i) return C.inCats(i, { [7] = true }) end, cat = 7 },
  { key = "configs", title = "Vehicle Configurations",      filter = function(i) return C.inCats(i, { [14] = true }) end, cat = 14 },
  { key = "scen",    title = "Scenarios",                   filter = function(i) return C.inCats(i, { [8] = true }) end, cat = 8 },
  { key = "props",   title = "Props",                       filter = function(i) return C.inCats(i, { [5] = true }) end, cat = 5 },
  { key = "apps",    title = "UI Apps",                     filter = function(i) return C.inCats(i, { [10] = true }) end, cat = 10 },
  { key = "skins",   title = "Skins",                       filter = function(i) return C.inCats(i, { [12] = true }) end, cat = 12 },
  { key = "sounds",  title = "Sounds",                      filter = function(i) return C.inCats(i, { [13] = true }) end, cat = 13 },
  { key = "air",     title = "Aircraft",                    filter = function(i) return C.inCats(i, { [4] = true }) end, cat = 4 },
  { key = "boats",   title = "Boats",                       filter = function(i) return C.inCats(i, { [6] = true }) end, cat = 6 },
  { key = "plates",  title = "License Plates",              filter = function(i) return C.inCats(i, { [15] = true }) end, cat = 15 },
}

-- build the home page: hero + "For you" + category shelves (ordered by affinity)
function C.buildHome(allItems, opts)
  opts = opts or {}
  local items, autoItems = C.splitAuto(allItems)
  C.scoreAll(items, opts)
  local owned = (opts.profile and opts.profile.owned) or {}
  local used = {}
  for k in pairs(owned) do used[k] = true end
  local function mark(list) for _, it in ipairs(list) do used[it.tagid] = true end return list end
  local good = function(i) return C.ageless(i) or C.compat(i, opts.gameMajor) ~= "outdated" end
  local hero = mark(C.pick(items, opts.heroCount or 6, good, used, 1))
  local forYou = mark(C.pick(items, 16, good, used, 2))
  local cats = (opts.profile and opts.profile.cats) or {}
  local defs = {}
  for i, d in ipairs(C.shelfDefs) do defs[i] = d end
  local order = {}
  for i, d in ipairs(C.shelfDefs) do order[d.key] = i end
  table.sort(defs, function(a, b)
    local wa, wb = cats[a.cat] or 0, cats[b.cat] or 0
    if wa ~= wb then return wa > wb end
    return order[a.key] < order[b.key]
  end)
  local shelves = {}
  for _, d in ipairs(defs) do
    local list = C.pick(items, 16, d.filter, used, 2)
    if #list >= 3 then shelves[#shelves + 1] = { key = d.key, title = d.title, cat = d.cat, items = mark(list) } end
  end
  if not opts.hideAuto and #autoItems >= 3 then
    -- only the top slice by downloads is scored (keeps a 20k category cheap)
    table.sort(autoItems, function(a, b) return (tonumber(a.download_count) or 0) > (tonumber(b.download_count) or 0) end)
    local top = {}
    for i = 1, math.min(#autoItems, 400) do top[i] = autoItems[i] end
    C.scoreAll(top, opts)
    local list = C.pick(top, 16, nil, used, 2)
    if #list >= 3 then
      local sh = { key = "automation", title = "Automation Exports", cat = 16, items = mark(list) }
      local pos = math.min(#shelves + 1, 4)
      if (cats[16] or 0) > 0 then pos = 1 end
      table.insert(shelves, pos, sh)
    end
  end
  return { hero = hero, forYou = forYou, shelves = shelves }
end

-- ---------- personalization profile ----------
function C.newProfile() return { cats = {}, authors = {}, owned = {}, viewed = {}, version = 1 } end

function C.learn(profile, it, kind)
  if not it then return end
  local w = ({ installed = 2, subscribe = 3, view = 0.5 })[kind] or 0.5
  local c = C.catOf(it)
  if c then profile.cats[c] = (profile.cats[c] or 0) + w end
  local a = it.username or it.author
  if a and a ~= "" then profile.authors[a] = (profile.authors[a] or 0) + w end
  if (kind == "installed" or kind == "subscribe") and it.tagid then profile.owned[it.tagid] = true end
  if kind == "view" and it.tagid then profile.viewed[it.tagid] = os.time() end
end

C.ATTACH_BASE = "https://www.beamng.com/attachments/"

local function decodeJson(s)
  if type(s) ~= "string" then return s end
  local ok, v = pcall(function() return (rawget(_G, "jsonDecode") or function() return nil end)(s) end)
  if ok and type(v) == "table" then return v end
  -- minimal fallback: pull ids / urls out of the raw string
  local t = {}
  for id in s:gmatch('"attachment_id"%s*:%s*"?(%d+)') do t[#t + 1] = { attachment_id = id } end
  for id in s:gmatch('"id"%s*:%s*"?(%d+)') do t[#t + 1] = { attachment_id = id } end
  for u in s:gmatch('"(https?:[^"]+)"') do t[#t + 1] = (u:gsub("\\/", "/")) end
  if #t == 0 then for id in s:gmatch("(%d%d%d%d+)") do t[#t + 1] = id end end
  return t
end

function C.extractImages(item, message)
  local out, seen = {}, {}
  local function add(u)
    if type(u) == "string" then
      u = u:gsub("^%s+", ""):gsub("%s+$", ""):gsub("\\/", "/")
      if u:match("^//") then u = "https:" .. u end
      if u:match("^data/attachments/") then u = "https://www.beamng.com/" .. u end
      if u:match("^https?://") and not seen[u] then seen[u] = true; out[#out + 1] = u end
    end
  end
  local function addId(id) id = tonumber(id); if id then add(C.ATTACH_BASE .. string.format("%d", id) .. "/") end end
  local function addAny(v)
    if type(v) == "number" or (type(v) == "string" and v:match("^%d+$")) then addId(v)
    elseif type(v) == "string" then add(v)
    elseif type(v) == "table" then
      local u = v.url or v.full or v.src or v.image or v.link
      if u then add(u) else addId(v.attachment_id or v.data_id or v.id) end
    end
  end
  for _, key in ipairs({ "screenshots", "images", "attachments", "gallery" }) do
    local v = decodeJson(item and item[key])
    if type(v) == "table" then
      if #v == 0 then for _, x in pairs(v) do addAny(x) end else for _, x in ipairs(v) do addAny(x) end end
    end
  end
  message = message or ""
  for id in message:gmatch("%[[Aa][Tt][Tt][Aa][Cc][Hh][^%]]*%]%s*(%d+)%s*%[/[Aa][Tt][Tt][Aa][Cc][Hh]%]") do addId(id) end
  for id in message:gmatch("beamng%.com/attachments/[^%s\"'%]]-%.?(%d+)/") do addId(id) end
  for u in message:gmatch("%[[Ii][Mm][Gg][^%]]*%](.-)%[/[Ii][Mm][Gg]%]") do add((u:gsub("%s", ""))) end
  for u in message:gmatch("<img[^>]-src=[\"']([^\"']+)[\"']") do add(u) end
  -- prefer full-size attachments over their forum thumbnails
  local hasFull = false
  for _, u in ipairs(out) do if u:find(C.ATTACH_BASE, 1, true) then hasFull = true end end
  if hasFull then
    local f = {}
    for _, u in ipairs(out) do if not u:find("/data/attachments/", 1, true) then f[#f + 1] = u end end
    out = f
  end
  return out
end

-- ---------- removal handling ----------
function C.isRemovedResponse(data, request)
  local code = request and tonumber(request.responseCode or request.status or request.code)
  if code == 404 or code == 410 then return true end
  if type(data) ~= "table" then return false end
  if type(data.data) == "table" and next(data.data) ~= nil then return false end
  for _, k in ipairs({ "error", "message", "msg", "reason", "status" }) do
    local v = data[k]
    if type(v) == "string" then
      local l = v:lower()
      if l:find("not found", 1, true) or l:find("not_found", 1, true) or l:find("deleted", 1, true)
        or l:find("removed", 1, true) or l:find("does not exist", 1, true) or l:find("no such", 1, true) then return true end
    end
  end
  return false
end

function C.remove(pool, index, id)
  if not index[id] then return false end
  index[id] = nil
  for i = #pool, 1, -1 do if pool[i].tagid == id then table.remove(pool, i) end end
  return true
end

C.pruneMinCoverage = 0.9 -- must have seen >= 90% of what the server says exists
C.pruneMaxFraction = 0.2 -- never drop more than 20% of the catalog in one go
function C.pruneDecision(pool, pass, serverTotal)
  if not pass or not pass.start then return false, "no pass" end
  if (pass.errors or 0) > 0 then return false, "pass had errors" end
  serverTotal = tonumber(serverTotal) or 0
  local seen = tonumber(pass.seen) or 0
  if serverTotal <= 0 or seen < serverTotal * C.pruneMinCoverage then return false, "server total looks off" end
  local stale = {}
  for _, it in ipairs(pool) do if (tonumber(it.seen) or 0) < pass.start then stale[#stale + 1] = it.tagid end end
  if #stale > #pool * C.pruneMaxFraction then return false, "too many unseen (" .. #stale .. ")" end
  return true, stale
end

function C.prune(pool, index, pass, serverTotal)
  local ok, stale = C.pruneDecision(pool, pass, serverTotal)
  if not ok then return 0, stale end
  for _, id in ipairs(stale) do C.remove(pool, index, id) end
  return #stale, "ok"
end

C.CRAWL_ORDERS = { { "downloads", "desc" }, { "update", "desc" }, { "title", "asc" }, { "downloads", "asc" },
  { "update", "asc" }, { "title", "desc" }, { "size", "desc" }, { "rating", "desc" } }
C.CRAWL_STALE_PAGES = 3
C.CRAWL_MAX_PAGES = 1500 -- hard safety cap per category per pass

function C.newCatCrawl(cat) return { cat = cat, oi = 1, page = 1, n = 0, ids = {}, total = nil, size = nil, stale = 0, pages = 0, done = false } end

function C.crawlAdvance(cs, items, count, orders)
  orders = orders or C.CRAWL_ORDERS
  items = items or {}
  cs.pages = cs.pages + 1
  local c = tonumber(count)
  if c and c >= 0 then cs.total = math.max(cs.total or 0, c) end
  if not cs.size and #items > 0 then cs.size = #items end
  local new = 0
  for _, it in ipairs(items) do
    local id = type(it) == "table" and it.tagid or it
    if id and not cs.ids[id] then cs.ids[id] = true; cs.n = cs.n + 1; new = new + 1 end
  end
  cs.stale = new == 0 and cs.stale + 1 or 0
  local total = cs.total or 0
  if total > 0 and cs.n >= total then cs.done = true; cs.short = false; return cs end
  if total == 0 and cs.oi == 1 and #items == 0 then cs.done = true; cs.short = false; return cs end
  local endOfOrder = #items == 0 or cs.stale >= C.CRAWL_STALE_PAGES
    or (cs.size and total > 0 and cs.page * cs.size >= total and #items < cs.size)
  if cs.pages >= C.CRAWL_MAX_PAGES then endOfOrder = true; cs.oi = #orders end
  if endOfOrder then
    if cs.oi < #orders then cs.oi = cs.oi + 1; cs.page = 1; cs.stale = 0
    else cs.done = true; cs.short = total > 0 and cs.n < total end
  else
    cs.page = cs.page + 1
  end
  return cs
end

function C.crawlOrder(cs, orders) local o = (orders or C.CRAWL_ORDERS)[cs.oi] or C.CRAWL_ORDERS[1]; return o[1], o[2] end

-- polite backoff after failed requests: 2,4,8,..,120 s
function C.crawlBackoff(errorsInRow) local n = tonumber(errorsInRow) or 0; if n <= 0 then return 0 end; return math.min(120, 2 ^ math.min(n, 7)) end

return C
