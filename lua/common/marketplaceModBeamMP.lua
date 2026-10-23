-- BeamMP server list and saved server mod helpers (no game APIs).
local B = {}
B.URL = "https://backend.beammp.com/servers-info"

local function lower(s) return (type(s) == "string" and s or ""):lower() end

-- BeamMP names use ^0-^f / ^l ^o ^r ^n ^m ^p formatting codes
function B.stripCodes(s) return (tostring(s or ""):gsub("%^[0-9a-fA-FlLoOrRnNmMpP]", "")) end

function B.mapName(m)
  m = tostring(m or "")
  return m:match("/levels/([^/]+)/") or m:match("levels/([^/]+)") or (m ~= "" and m or "unknown")
end

function B.split(s, sep)
  local out = {}
  for part in tostring(s or ""):gmatch("[^" .. sep .. "]+") do
    part = part:gsub("^%s+", ""):gsub("%s+$", "")
    if part ~= "" then out[#out + 1] = part end
  end
  return out
end

-- modlist entries: "/name" (no .zip) -> "name"
function B.modNames(modlist)
  local out = {}
  for _, p in ipairs(B.split(modlist, ";")) do
    local n = p:gsub("\\", "/"):match("([^/]+)$") or p
    n = n:gsub("%.zip$", "")
    out[#out + 1] = n
  end
  return out
end

function B.key(s) return tostring(s.ip) .. ":" .. tostring(s.port) end

-- installed: set of lowercase mod names (modname and file stem)
function B.matchMods(names, installed)
  local have = 0
  local list = {}
  for i, n in ipairs(names) do
    local ok = installed and installed[lower(n)] or false
    if ok then have = have + 1 end
    list[i] = { name = n, have = ok and true or false }
  end
  return have, list
end

function B.slim(s, installed)
  local names = B.modNames(s.modlist)
  local have = B.matchMods(names, installed)
  return {
    key = B.key(s), name = B.stripCodes(s.sname), map = B.mapName(s.map), tags = B.split(s.tags, ","),
    players = tonumber(s.players) or 0, max = tonumber(s.maxplayers) or 0, loc = tostring(s.location or ""),
    version = s.version, mods = tonumber(s.modstotal) or #names, modsSize = tonumber(s.modstotalsize) or 0,
    have = have, password = s.password == true, official = s.official == true, featured = s.featured == true,
    partner = s.partner == true, guests = s.guests ~= false, owner = s.owner,
  }
end

function B.detail(s, installed)
  local d = B.slim(s, installed)
  d.desc = B.stripCodes(s.sdesc)
  d.playerList = B.split(s.playerslist, ";")
  local _, mods = B.matchMods(B.modNames(s.modlist), installed)
  d.modList = mods
  d.ip, d.port, d.cversion = s.ip, s.port, s.cversion
  return d
end

-- ---------- saved server mod packs (pure helpers) ----------
B.SAVE_ROOT = "/marketplace_servers/" -- saved copies; outside /mods, so the game never loads them
B.INSTALL_ROOT = "/mods/marketplace_servers/"

-- folder / pack id for a server address ("ip:port"); always ends with the port digits
function B.packId(key)
  local s = tostring(key or ""):lower():gsub("[^%w]+", "_"):gsub("^_+", ""):gsub("_+$", "")
  if s == "" then s = "server" end
  return "s_" .. s:sub(-60)
end

-- a server mod name as BeamMP gives it (file name without .zip); nil if it could escape the folder
function B.safeModName(n)
  n = tostring(n or ""):gsub("%.zip$", "")
  if n == "" or #n > 180 or n:find("[/\\]") or n:find("%.%.") or n:find("[%c:%*%?\"<>|]") or n:match("^%s") or n:match("[%s%.]$") then return nil end
  return n
end

function B.modNameFromPath(path)
  local m = string.lower(tostring(path or ""))
  m = m:gsub('dir:/', ''); m = m:gsub('/mods/', ''); m = m:gsub('repo/', ''); m = m:gsub('unpacked/', '')
  m = m:gsub('/', ''); m = m:gsub('.zip$', '')
  return m
end

function B.packSummary(p, isActive)
  local out = { id = p.id, key = p.key, name = p.name, savedAt = p.savedAt, count = 0, bytes = 0, staged = 0, installed = 0, active = 0,
    missing = 0, partial = p.partial == true, total = p.total }
  for _, f in ipairs(p.files or {}) do
    out.count = out.count + 1
    if f.gone then out.missing = out.missing + 1 else out.bytes = out.bytes + (tonumber(f.size) or 0) end
    if f.pending then out.bytes = out.bytes + (tonumber(f.pendingSize) or 0) end
    if f.where == "installed" then
      out.installed = out.installed + 1
      if isActive and isActive(B.modNameFromPath(f.path)) == true then out.active = out.active + 1 end
    else out.staged = out.staged + 1 end
    if f.pending then out.updates = (out.updates or 0) + 1 end
  end
  out.state = out.count == 0 and "empty" or out.active == out.count and "active" or out.active > 0 and "partly" or out.installed > 0 and "inactive" or "saved"
  return out
end

return B
