-- Mod Manager logic: library rows, conflicts, duplicates, requirements and mod packs.
-- Plain Lua with no game APIs.
local L = {}

local function lower(s) return (type(s) == "string" and s or ""):lower() end
L.lower = lower

local function joinPath(base, f)
  if type(f) ~= "string" or f == "" then return nil end
  f = f:gsub("\\", "/")
  if f:match("^/") or f:match("^%a[%w+.-]*:") then return f end -- already absolute (vfs path or URL)
  if not base then return nil end
  return (base:gsub("/+$", "")) .. "/" .. (f:gsub("^/+", ""))
end
L.joinPath = joinPath

function L.iconOf(m, md)
  md = md or (type(m.modData) == "table" and m.modData) or {}
  local base = m.modInfoPath
  if type(md.icon) == "string" and md.icon ~= "" then
    local p = md.icon:gsub("\\", "/")
    if base and p:sub(1, #base) == base then return p end
    return joinPath(base, p)
  end
  return base and (base .. "icon.jpg") or nil
end

-- returns { {u = full-size path, fb = thumbnail path}, ... } or nil
function L.localPhotos(m, md)
  md = md or (type(m.modData) == "table" and m.modData) or {}
  local base = m.modInfoPath
  local out, seen = {}, {}
  local function add(u, fb)
    if not u or seen[u] then return end
    seen[u] = true
    out[#out + 1] = { u = u, fb = (fb and fb ~= u) and fb or nil }
  end
  local att = md.attachments
  if type(att) == "table" then
    local list = {}
    if #att > 0 then for _, a in ipairs(att) do list[#list + 1] = a end else for _, a in pairs(att) do list[#list + 1] = a end end
    for _, a in ipairs(list) do
      if type(a) == "table" then
        local th = joinPath(base, a.thumb_filename)
        local full = a.data_filename and joinPath(base, "images/" .. tostring(a.data_filename):gsub("\\", "/"):gsub("^/+", "")) or nil
        if full then add(full, th) elseif th then add(th) end
      end
    end
  end
  if #out == 0 and type(md.imgs) == "table" then
    for _, u in ipairs(md.imgs) do if type(u) == "string" and u ~= "" then add(joinPath(base, u)) end end
  end
  return #out > 0 and out or nil
end

-- ---------- normalized rows ----------
function L.row(name, m)
  local md = type(m.modData) == "table" and m.modData or {}
  local st = type(m.stat) == "table" and m.stat or {}
  local r = {
    name = m.modname or name, file = m.filename, path = m.fullpath, active = m.active ~= false,
    size = tonumber(st.filesize or st.size or m.filesize) or 0,
    modified = tonumber(st.modtime or st.modificationTime) or 0,
    added = tonumber(m.dateAdded) or 0,
    type = m.modType or "unknown", unpacked = m.unpackedPath ~= nil or st.filetype == "dir",
    tagid = md.tagid or m.modID, resourceId = tonumber(md.resource_id),
    title = md.title or m.modname or name, author = md.username or md.user_name,
    version = md.version_string, verId = tonumber(md.resource_version_id or md.current_version_id),
    updated = tonumber(md.last_update), message = md.message,
    icon = L.iconOf(m, md),
    photos = L.localPhotos(m, md),
    repo = md.tagid ~= nil,
  }
  if r.name == "marketplace" and not md.title then r.title = "Marketplace" end -- this mod itself (Marketplace.zip)
  return r
end

function L.rows(mods)
  local out = {}
  if type(mods) ~= "table" then return out end
  for name, m in pairs(mods) do
    if type(m) == "table" and name ~= "translations" and (m.modname or name) ~= "translations" then out[#out + 1] = L.row(name, m) end
  end
  table.sort(out, function(a, b)
    if lower(a.title) ~= lower(b.title) then return lower(a.title) < lower(b.title) end
    return a.name < b.name
  end)
  return out
end

function L.repoFiles(m)
  local md = type(m.modData) == "table" and m.modData or {}
  if type(md.hashes) ~= "table" then return nil end
  local out = {}
  for _, h in pairs(md.hashes) do
    local p = type(h) == "table" and (h[1] or h.file or h.path) or (type(h) == "string" and h) or nil
    if p then out[#out + 1] = p end
  end
  return out
end

-- ---------- conflicts ----------
-- files that legitimately exist in many mods
local IGNORE = { "^mod_info/", "^/?readme", "^/?license", "%.md$", "^/?changelog", "^/?info%.json$", "^/?thumbs%.db$", "/%.ds_store$", "^/?desktop%.ini$" }
function L.normPath(p)
  p = lower(p):gsub("\\", "/"):gsub("//+", "/"):gsub("^/", "")
  return p
end
function L.ignored(p)
  for _, pat in ipairs(IGNORE) do if p:find(pat) then return true end end
  return p == "" or p:sub(-1) == "/"
end

function L.conflicts(rows, fileLists, maxFiles)
  local owners = {}
  for _, r in ipairs(rows) do
    local list = r.active and fileLists[r.name]
    if list then
      local seen = {}
      for _, p in ipairs(list) do
        local n = L.normPath(p)
        if not L.ignored(n) and not seen[n] then
          seen[n] = true
          local o = owners[n]
          if not o then owners[n] = { r.name } else o[#o + 1] = r.name end
        end
      end
    end
  end
  local pairsMap, perMod = {}, {}
  for p, o in pairs(owners) do
    if #o > 1 then
      table.sort(o)
      for i = 1, #o - 1 do for j = i + 1, #o do
        local k = o[i] .. "\0" .. o[j]
        local e = pairsMap[k]
        if not e then e = { a = o[i], b = o[j], count = 0, files = {} }; pairsMap[k] = e end
        e.count = e.count + 1
        if #e.files < (maxFiles or 8) then e.files[#e.files + 1] = p end
      end end
      for _, n in ipairs(o) do perMod[n] = (perMod[n] or 0) + 1 end
    end
  end
  local out = {}
  for _, e in pairs(pairsMap) do table.sort(e.files); out[#out + 1] = e end
  table.sort(out, function(x, y) if x.count ~= y.count then return x.count > y.count end return x.a < y.a end)
  return out, perMod
end

-- ---------- duplicates ----------
-- version-free stem of a filename: "My_Car_v1.2.3 (2).zip" -> "my_car"
function L.stem(file)
  local s = lower(file or ""):gsub("%.zip$", "")
  s = s:gsub("%s*%(%d+%)$", "")
  for _ = 1, 3 do
    s = s:gsub("[%s_%-]+version[%s_%-]*%d[%d%.]*[a-z]?$", "")
    s = s:gsub("[%s_%-]+v?%d[%d%.]*[a-z]?$", "")
    s = s:gsub("[%s_%-]+(final|fixed|fix|update|updated|new|old|copy|beta|alpha)$", "")
  end
  s = s:gsub("[%s_%-%.]+$", "")
  return s
end

local function newest(group)
  local best
  for _, r in ipairs(group) do
    local t = (r.updated or 0) * 10 + (r.modified or 0) / 1e10
    if not best or t > best.t or (t == best.t and (r.verId or 0) > (best.r.verId or 0)) then best = { r = r, t = t } end
  end
  return best and best.r
end

function L.duplicates(rows, hashes)
  hashes = hashes or {}
  local groups, inGroup = {}, {}
  local function add(kind, key, list)
    if #list < 2 then return end
    local names = {}
    for _, r in ipairs(list) do names[#names + 1] = r.name end
    table.sort(names)
    groups[#groups + 1] = { kind = kind, key = key, mods = names, keep = newest(list).name }
    for _, r in ipairs(list) do inGroup[r.name] = true end
  end
  local byId, bySize = {}, {}
  for _, r in ipairs(rows) do
    if r.tagid then byId[r.tagid] = byId[r.tagid] or {}; table.insert(byId[r.tagid], r) end
  end
  for id, list in pairs(byId) do add("id", id, list) end
  for _, r in ipairs(rows) do
    if not inGroup[r.name] and r.size > 0 and not r.unpacked then
      bySize[r.size] = bySize[r.size] or {}; table.insert(bySize[r.size], r)
    end
  end
  local byHash = {}
  for _, list in pairs(bySize) do
    if #list > 1 then
      for _, r in ipairs(list) do
        local h = hashes[r.name]
        if h then byHash[h] = byHash[h] or {}; table.insert(byHash[h], r) end
      end
    end
  end
  for h, list in pairs(byHash) do add("hash", h, list) end
  local byStem = {}
  for _, r in ipairs(rows) do
    if not inGroup[r.name] and r.file then
      local s = L.stem(r.file)
      if #s >= 3 then byStem[s] = byStem[s] or {}; table.insert(byStem[s], r) end
    end
  end
  for s, list in pairs(byStem) do add("versions", s, list) end
  table.sort(groups, function(a, b) if a.kind ~= b.kind then return a.kind < b.kind end return a.key < b.key end)
  return groups
end

-- size groups that need hashing (names), for the lazy hasher
function L.hashCandidates(rows)
  local bySize, out = {}, {}
  for _, r in ipairs(rows) do
    if r.size > 0 and not r.unpacked and r.path then bySize[r.size] = bySize[r.size] or {}; table.insert(bySize[r.size], r) end
  end
  for _, list in pairs(bySize) do
    if #list > 1 then for _, r in ipairs(list) do out[#out + 1] = r end end
  end
  return out
end

-- ---------- dependencies ----------
local REQ_WORDS = { "requires", "required", "require", "needs", "need", "dependency", "dependencies", "depends on", "prerequisite", "you must have", "must install", "must be installed" }
-- returns { {resourceId=, slug=, text=} } found in requirement context of a description
function L.parseDeps(message)
  local out, seen = {}, {}
  if type(message) ~= "string" or message == "" then return out end
  local text = message:gsub("<br%s*/?>", "\n"):gsub("%[/?[Bb]%]", ""):gsub("%[/?[Ii]%]", "")
  -- split into chunks (lines / sentences), keep requirement context for up to 2 following lines
  local lines = {}
  for line in (text .. "\n"):gmatch("([^\n]*)\n") do lines[#lines + 1] = line end
  local ctx = 0
  for _, line in ipairs(lines) do
    local l = lower(line)
    local hasWord = false
    for _, w in ipairs(REQ_WORDS) do
      if l:find("%f[%a]" .. w:gsub(" ", "%%s+") .. "%f[%A]") then hasWord = true; break end
    end
    if hasWord then ctx = 3 end
    if ctx > 0 then
      for slug, id in l:gmatch("beamng%.com/resources/([%w%-_%%]+)%.(%d+)") do
        id = tonumber(id)
        if id and not seen[id] then seen[id] = true; out[#out + 1] = { resourceId = id, slug = slug:gsub("%-", " ") } end
      end
      ctx = ctx - 1
    end
  end
  return out
end

function L.dependencies(rows)
  local byRes = {}
  for _, r in ipairs(rows) do if r.resourceId then byRes[r.resourceId] = r end end
  local out = {}
  for _, r in ipairs(rows) do
    local deps = L.parseDeps(r.message)
    local list = {}
    for _, d in ipairs(deps) do
      if d.resourceId ~= r.resourceId then
        local m = byRes[d.resourceId]
        list[#list + 1] = { resourceId = d.resourceId, slug = d.slug, name = m and m.name or nil, title = m and m.title or nil,
          status = m and (m.active and "active" or "inactive") or "missing" }
      end
    end
    if #list > 0 then out[#out + 1] = { mod = r.name, title = r.title, active = r.active, deps = list } end
  end
  return out
end

-- ---------- disk usage ----------
function L.disk(rows, recycleBytes)
  local d = { total = 0, active = 0, inactive = 0, count = #rows, activeCount = 0, byType = {}, largest = {}, recycle = recycleBytes or 0 }
  for _, r in ipairs(rows) do
    d.total = d.total + r.size
    if r.active then d.active = d.active + r.size; d.activeCount = d.activeCount + 1 else d.inactive = d.inactive + r.size end
    local t = d.byType[r.type] or { type = r.type, size = 0, count = 0 }
    t.size = t.size + r.size; t.count = t.count + 1
    d.byType[r.type] = t
  end
  local types = {}
  for _, t in pairs(d.byType) do types[#types + 1] = t end
  table.sort(types, function(a, b) return a.size > b.size end)
  d.byType = types
  local sorted = {}
  for _, r in ipairs(rows) do sorted[#sorted + 1] = r end
  table.sort(sorted, function(a, b) return a.size > b.size end)
  for i = 1, math.min(10, #sorted) do d.largest[i] = { name = sorted[i].name, title = sorted[i].title, size = sorted[i].size, active = sorted[i].active } end
  return d
end

-- ---------- load-outs ----------
function L.keyOf(r) return r.tagid and ("id:" .. r.tagid) or ("n:" .. r.name) end

-- key -> row; when two installed files share a repo id, prefer the active one, then the newest
local function better(a, b)
  if not a then return true end
  if a.active ~= b.active then return b.active end
  return (b.updated or b.modified or 0) > (a.updated or a.modified or 0)
end
function L.index(rows)
  local byKey = {}
  for _, r in ipairs(rows) do
    local k = L.keyOf(r)
    if better(byKey[k], r) then byKey[k] = r end
    byKey["n:" .. r.name] = r
  end
  return byKey
end

function L.resolve(rows, keys)
  local byKey, found, missing = L.index(rows), {}, {}
  for _, k in ipairs(keys or {}) do
    local r = byKey[k]
    if r then found[#found + 1] = r.name else missing[#missing + 1] = k end
  end
  return found, missing
end

-- plan to switch to load-out `lo` (exclusive), keeping all "Always On" load-outs active
function L.plan(rows, loadouts, loId)
  local want = {}
  local target
  for _, lo in ipairs(loadouts) do
    if lo.id == loId then target = lo end
    if lo.alwaysOn or lo.id == loId then
      local found = L.resolve(rows, lo.mods)
      for _, n in ipairs(found) do want[n] = true end
    end
  end
  if not target then return nil, "unknown mod pack" end
  local act, deact = {}, {}
  for _, r in ipairs(rows) do
    if want[r.name] and not r.active then act[#act + 1] = r.name
    elseif not want[r.name] and r.active then deact[#deact + 1] = r.name end
  end
  local _, missing = L.resolve(rows, target.mods)
  return { activate = act, deactivate = deact, missing = missing }
end

L.DATA_DIR = "settings/marketplaceMod/"
L.OLD_DATA_DIR = "settings/repoFinder/"
L.OLD_SHARE_DIR = "RepoFinder/shared/"
function L.legacyPath(path)
  if type(path) ~= "string" then return nil end
  local lead = path:sub(1, 1) == "/" and "/" or ""
  local rest = path:sub(#lead + 1)
  if rest:sub(1, #L.DATA_DIR) ~= L.DATA_DIR then return nil end
  return lead .. L.OLD_DATA_DIR .. rest:sub(#L.DATA_DIR + 1)
end
function L.readData(path, reader)
  reader = reader or jsonReadFile
  if not reader then return nil end
  local ok, d = pcall(reader, path)
  if ok and type(d) == "table" then return d, path end
  local old = L.legacyPath(path)
  if old then
    local ok2, d2 = pcall(reader, old)
    if ok2 and type(d2) == "table" then return d2, old end
  end
  return nil
end

L.SHARE_FORMAT = "repofinder-loadout"
function L.exportLoadout(lo, rows)
  local byKey = L.index(rows)
  local mods = {}
  for _, k in ipairs(lo.mods or {}) do
    local r = byKey[k]
    mods[#mods + 1] = { key = k, tagid = r and r.tagid or (k:match("^id:(.+)$")), name = r and r.name or (k:match("^n:(.+)$")), title = r and r.title or nil }
  end
  return { format = L.SHARE_FORMAT, version = 1, name = lo.name, alwaysOn = lo.alwaysOn or false, mods = mods }
end

L.PACK_FORMAT = "repofinder-pack"
L.TITLE_MAX, L.DESC_MAX, L.PACK_MAX_MODS = 60, 300, 500
local UTF8_CHAR = "[%z\1-\127\194-\244][\128-\191]*"
local function clip(s, n)
  s = tostring(s or ""):gsub("[%c]", " "):gsub("^%s+", ""):gsub("%s+$", "")
  local out, k = {}, 0
  for ch in s:gmatch(UTF8_CHAR) do
    k = k + 1; if k > n then break end
    out[k] = ch
  end
  return (table.concat(out):gsub("%s+$", ""))
end
L.clip = clip
function L.exportPack(lo, rows)
  local byKey = L.index(rows)
  local mods = {}
  for _, k in ipairs(lo.mods or {}) do
    local r = byKey[k]
    mods[#mods + 1] = { tagid = r and r.tagid or (k:match("^id:(.+)$")), name = r and r.name or (k:match("^n:(.+)$")),
      title = r and r.title or nil, size = r and tonumber(r.size) or nil, file = r and r.file or nil, version = r and r.version or nil }
  end
  return { format = L.PACK_FORMAT, version = 2, title = clip(lo.name, L.TITLE_MAX), description = clip(lo.desc, L.DESC_MAX),
    alwaysOn = lo.alwaysOn or false, created = os.time(), mods = mods }
end
-- validate + normalise either format into { title, description, alwaysOn, mods = {{tagid,name,title,size}} }
function L.readPack(data)
  if type(data) ~= "table" or type(data.mods) ~= "table" then return nil, "not a Marketplace mod pack file" end
  if data.format ~= L.PACK_FORMAT and data.format ~= L.SHARE_FORMAT then return nil, "not a Marketplace mod pack file" end
  local mods, seen, total = {}, {}, 0
  local list = data.mods
  if #list == 0 and next(list) ~= nil then list = {}; for _, m in pairs(data.mods) do list[#list + 1] = m end end
  for _, m in ipairs(list) do
    if type(m) == "string" then -- bare keys ("id:<tagid>" / "n:<modname>") in hand-made files
      local t, n = m:match("^id:(.+)$"), m:match("^n:(.+)$")
      m = (t or n) and { tagid = t, name = n } or { tagid = m }
    end
    if type(m) == "table" then total = total + 1 end
    if type(m) == "table" and #mods < L.PACK_MAX_MODS then
      local tagid = type(m.tagid) == "string" and m.tagid:match("^[%w]+$") and m.tagid or nil
      local name = type(m.name) == "string" and m.name ~= "" and clip(m.name, 120) or nil
      local id = tagid or name
      if id and not seen[id] then seen[id] = true
        mods[#mods + 1] = { tagid = tagid, name = name, title = m.title and clip(m.title, 120) or nil, size = tonumber(m.size) }
      end
    end
  end
  if #mods == 0 then return nil, "this mod pack file has no mods in it" end
  local title = clip(data.title or data.name, L.TITLE_MAX)
  return { title = title ~= "" and title or "Imported mod pack", description = clip(data.description, L.DESC_MAX), alwaysOn = data.alwaysOn == true, mods = mods,
    skipped = total > L.PACK_MAX_MODS and (total - L.PACK_MAX_MODS) or nil }
end

function L.importLoadout(data, rows)
  local pack, perr = L.readPack(data)
  if not pack then return nil, perr end
  data = { name = pack.title, alwaysOn = pack.alwaysOn, mods = pack.mods }
  local byId, byName = {}, {}
  for _, r in ipairs(rows) do if r.tagid and better(byId[r.tagid], r) then byId[r.tagid] = r end; byName[lower(r.name)] = r end
  local keys, missing = {}, {}
  for _, m in pairs(data.mods) do
    if type(m) == "table" then
      local r = (m.tagid and byId[m.tagid]) or (m.name and byName[lower(m.name)])
      if r then keys[#keys + 1] = L.keyOf(r)
      else
        keys[#keys + 1] = m.tagid and ("id:" .. m.tagid) or ("n:" .. tostring(m.name))
        missing[#missing + 1] = { tagid = m.tagid, name = m.name, title = m.title }
      end
    end
  end
  return { name = tostring(data.name or "Imported mod pack"), desc = pack.description, alwaysOn = data.alwaysOn == true, mods = keys }, missing
end

function L.filter(rows, opts, meta)
  opts = opts or {}; meta = meta or {}
  local q = lower(opts.query or "")
  local out = {}
  for _, r in ipairs(rows) do
    local ok = true
    if opts.state == "active" and not r.active then ok = false end
    if opts.state == "inactive" and r.active then ok = false end
    if ok and opts.source == "repo" and not r.repo then ok = false end
    if ok and opts.source == "manual" and r.repo then ok = false end
    if ok and opts.types and next(opts.types) and not opts.types[r.type] then ok = false end
    local tags = (meta.tags or {})[r.name] or {}
    if ok and opts.favorites and not (meta.fav or {})[r.name] then ok = false end
    if ok and opts.tags and next(opts.tags) then
      local has = false
      for _, t in ipairs(tags) do if opts.tags[t] then has = true end end
      ok = has
    end
    if ok and opts.issues and not ((meta.issues or {})[r.name]) then ok = false end
    if ok and q ~= "" then
      local hay = lower(r.title .. " " .. r.name .. " " .. (r.author or "") .. " " .. table.concat(tags, " "))
      for w in q:gmatch("%S+") do if not hay:find(w, 1, true) then ok = false; break end end
    end
    if ok then out[#out + 1] = r end
  end
  local s = opts.sort or "name"
  local key = {
    name = function(a, b) return lower(a.title) < lower(b.title) end,
    size = function(a, b) return a.size > b.size end,
    added = function(a, b) return a.added > b.added end,
    updated = function(a, b) return (a.updated or a.modified) > (b.updated or b.modified) end,
    active = function(a, b) if a.active ~= b.active then return a.active end return lower(a.title) < lower(b.title) end,
  }
  table.sort(out, key[s] or key.name)
  return out
end

-- ---------- Mod Manager additions ----------
-- creator-support links in descriptions
local SUPPORT = { { "patreon", "patreon%.com/[%w%-_/%.]+" }, { "ko-fi", "ko%-fi%.com/[%w%-_/%.]+" },
  { "buymeacoffee", "buymeacoffee%.com/[%w%-_/%.]+" }, { "gumroad", "[%w%-]*%.?gumroad%.com/?[%w%-_/%.]*" },
  { "boosty", "boosty%.to/[%w%-_/%.]+" } }
function L.supportLinks(message)
  local out, seen = {}, {}
  if type(message) ~= "string" then return out end
  local l = lower(message)
  for _, s in ipairs(SUPPORT) do
    for m in l:gmatch(s[2]) do
      m = m:gsub("[%./]+$", "")
      if not seen[m] then seen[m] = true; out[#out + 1] = { kind = s[1], url = "https://" .. m } end
    end
  end
  return out
end

-- every repo link in a description, split into required (requirement wording nearby) and mentioned
function L.parseDepsAll(message)
  local req = L.parseDeps(message)
  local reqIds, mentioned = {}, {}
  for _, d in ipairs(req) do reqIds[d.resourceId] = true end
  if type(message) == "string" then
    for slug, id in lower(message):gmatch("beamng%.com/resources/([%w%-_%%]+)%.(%d+)") do
      id = tonumber(id)
      if id and not reqIds[id] then reqIds[id] = true; mentioned[#mentioned + 1] = { resourceId = id, slug = slug:gsub("%-", " ") } end
    end
  end
  return req, mentioned
end

-- version stacks: same repo id, else same version-free file stem
function L.stackKey(r)
  if r.tagid then return "id:" .. r.tagid end
  local s = L.stem(r.file or r.name)
  return #s >= 3 and ("st:" .. s) or ("n:" .. r.name)
end
local function newer(a, b)
  local ta, tb = (a.updated or 0), (b.updated or 0)
  if ta ~= tb then return ta > tb end
  if (a.verId or 0) ~= (b.verId or 0) then return (a.verId or 0) > (b.verId or 0) end
  return (a.modified or 0) > (b.modified or 0)
end
function L.stacks(rows)
  local by, order = {}, {}
  for _, r in ipairs(rows) do
    local k = L.stackKey(r)
    if not by[k] then by[k] = {}; order[#order + 1] = k end
    table.insert(by[k], r)
  end
  local out = {}
  for _, k in ipairs(order) do
    local list = by[k]
    table.sort(list, newer)
    if #list > 1 then out[#out + 1] = { key = k, mods = list } end
  end
  return out
end

-- keep the `keep` newest versions of every stack (an active version is always kept); returns names to recycle
function L.versionPlan(rows, keep)
  keep = math.max(1, tonumber(keep) or 1)
  local drop = {}
  for _, st in ipairs(L.stacks(rows)) do
    local kept = 0
    for _, r in ipairs(st.mods) do
      if kept < keep or r.active then kept = kept + 1 else drop[#drop + 1] = r.name end
    end
  end
  return drop
end

-- why we suggest keeping one mod of a duplicate group
function L.keepReasons(group)
  local best
  for _, r in ipairs(group) do if not best or newer(r, best) then best = r end end
  local reasons = {}
  for _, r in ipairs(group) do
    if r ~= best then
      if (best.updated or 0) > (r.updated or 0) then reasons[#reasons + 1] = "newest repository update" break end
    end
  end
  if best.active then reasons[#reasons + 1] = "currently active" end
  if best.repo then reasons[#reasons + 1] = "from the repository (gets updates)" end
  if #reasons == 0 then reasons[1] = "most recently modified file" end
  return best.name, reasons
end

-- pre-launch check: with `active` (set of names) what required mods would be missing/inactive?
function L.depCheck(rows, active, notDeps)
  notDeps = notDeps or {}
  local byRes = {}
  for _, r in ipairs(rows) do if r.resourceId then byRes[r.resourceId] = r end end
  local out = {}
  for _, r in ipairs(rows) do
    if active[r.name] then
      for _, d in ipairs(L.parseDeps(r.message)) do
        local skip = notDeps[r.name] and (notDeps[r.name][d.resourceId] or notDeps[r.name][tostring(d.resourceId)])
        if not skip and d.resourceId ~= r.resourceId then
          local m = byRes[d.resourceId]
          if not m then out[#out + 1] = { mod = r.name, resourceId = d.resourceId, slug = d.slug, status = "missing" }
          elseif not active[m.name] then out[#out + 1] = { mod = r.name, resourceId = d.resourceId, slug = d.slug, name = m.name, status = "inactive" } end
        end
      end
    end
  end
  return out
end

-- updates the user wants: game queue entries in state "waiting", not ignored, never a downgrade
function L.updatable(entries, rows, ignored)
  ignored = ignored or {}
  local byId = {}
  for _, r in ipairs(rows) do if r.tagid and (not byId[r.tagid] or (r.verId or 0) > (byId[r.tagid].verId or 0)) then byId[r.tagid] = r end end
  local out = {}
  for _, e in ipairs(entries or {}) do
    local r = e.id and byId[e.id]
    local newVer = tonumber(e.ver)
    local downgrade = r and r.verId and newVer and newVer <= r.verId
    if e.id and not ignored[e.id] and not downgrade then out[#out + 1] = e end
  end
  return out
end

return L
