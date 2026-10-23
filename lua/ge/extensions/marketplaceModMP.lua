-- BeamMP server browser and join flow.
-- Joining goes through BeamMP's own client (MPCoreNetwork).

local M = {}
local logTag = "marketplaceModMP"
local B = require("marketplaceModBeamMP")
local LC = require("marketplaceModLibCore")

local PREFS_FILE = "settings/marketplaceMod/beammp.json"
local MIN_REFRESH = 55 -- seconds; the UI asks every ~60 s while the page is open
local servers, byKey, fetchedAt, fetching, lastError = nil, {}, -1e9, false, nil
local prefs = nil
local clock = 0

local function loadPrefs()
  if prefs then return end
  prefs = { fav = {}, recent = {}, keep = {} }
  if jsonReadFile then
    local ok, d = pcall(LC.readData, PREFS_FILE)
    if ok and type(d) == "table" then
      if type(d.fav) == "table" then prefs.fav = d.fav end
      if type(d.keep) == "table" then prefs.keep = d.keep end -- servers whose mods are saved after each join
      if type(d.recent) == "table" then for _, v in pairs(d.recent) do prefs.recent[#prefs.recent + 1] = v end end
    end
  end
end
local function savePrefs() if prefs and jsonWriteFile then pcall(jsonWriteFile, PREFS_FILE, prefs, true) end end

local function installedNames()
  local set = {}
  pcall(function()
    for name, m in pairs(core_modmanager.getMods() or {}) do
      set[tostring(name):lower()] = true
      if type(m) == "table" and m.filename then set[tostring(m.filename):lower():gsub("%.zip$", "")] = true end
    end
  end)
  return set
end

local function send()
  if not guihooks then return end
  loadPrefs()
  local inst = installedNames()
  local list = {}
  for i, s in ipairs(servers or {}) do list[i] = B.slim(s, inst) end
  guihooks.trigger("MarketplaceModServers", { servers = list, fetchedAt = fetchedAt > 0 and fetchedAt or nil, error = lastError,
    loading = fetching, fav = prefs.fav, recent = prefs.recent, keep = prefs.keep,
    launcher = (function() local ok, c = pcall(function() return MPCoreNetwork and MPCoreNetwork.isLauncherConnected and MPCoreNetwork.isLauncherConnected() end)
      if not ok or c == nil then return nil end return c and true or false end)() })
end

local function accept(data)
  if type(data) ~= "table" then return false end
  local list = {}
  for _, s in pairs(data) do if type(s) == "table" and s.ip and s.port then list[#list + 1] = s end end
  if #list == 0 then return false end
  servers, byKey = list, {}
  for _, s in ipairs(list) do byKey[B.key(s)] = s end
  fetchedAt = os.time(); lastError = nil
  return true
end

local FETCH_TIMEOUT = 20
local fetchStarted = -1e9

local joinT = nil
local function joinBusy()
  if joinT and os.time() - joinT < 180 then return true end
  local busy = false
  pcall(function()
    busy = (MPCoreNetwork.isMPSession and MPCoreNetwork.isMPSession() == true) or (MPCoreNetwork.isGoingMPSession and MPCoreNetwork.isGoingMPSession() == true) or false
  end)
  return busy
end

local function askBeamMP()
  local ok, asked = pcall(function()
    if not (MPCoreNetwork and MPCoreNetwork.isLauncherConnected and MPCoreNetwork.isLauncherConnected()) then return false end
    if joinBusy() then
      log("I", logTag, "[Marketplace join] server list refresh skipped: joining / in a BeamMP session (a list request would reset the launcher's server connection)")
      return true
    end
    if MPCoreNetwork.sendBeamMPInfo then MPCoreNetwork.sendBeamMPInfo() end -- cached list, if any
    if MPCoreNetwork.requestServerList then MPCoreNetwork.requestServerList() end -- fresh list from the launcher
    return true
  end)
  return ok and asked
end

local function fetch()
  if fetching and os.time() - fetchStarted < FETCH_TIMEOUT then return end
  fetching = true; fetchStarted = os.time()
  local viaMP = askBeamMP()
  log("I", logTag, "server list requested (BeamMP launcher: " .. tostring(viaMP) .. ")")
  local ok, err = pcall(function()
    if true then error("game HTTP client can't reach BeamMP") end
    local started = core_online.download(B.URL, function(r)
      fetching = false
      local data = r and r.responseData
      if type(data) ~= "table" and r and type(r.responseBuffer) == "string" then
        pcall(function() data = jsonDecode(r.responseBuffer) end)
      end
      if not accept(data) then
        lastError = "BeamMP server list unavailable" .. (r and r.responseCode and (" (HTTP " .. tostring(r.responseCode) .. ")") or "")
        log("W", logTag, lastError .. (r and r.error and (": " .. tostring(r.error)) or ""))
      end
      send()
    end)
    if started == false then error("online features disabled") end
  end)
  if not ok then
    fetching = false
    if viaMP then lastError = nil else lastError = "Game HTTP unavailable (" .. tostring(err) .. ") and the BeamMP launcher is not connected" end
    if viaMP then log("D", logTag, "list comes from BeamMP (onBeamMPServerListReceived); game HTTP fetch skipped")
    else log("W", logTag, "core_online.download failed: " .. tostring(err)) end
    send()
  end
end

function M.uiServers(force)
  if fetching and os.time() - fetchStarted >= FETCH_TIMEOUT then
    fetching = false
    if not servers then lastError = "Timed out waiting for the BeamMP server list" end
  end
  if force or os.time() - fetchedAt > MIN_REFRESH then fetch() end
  send()
end

-- fallback path: the UI fetched the list itself
function M.uiServersData(data)
  if accept(data) then send() end
end

function M.uiServer(key)
  local s = byKey[key]
  if not (s and guihooks) then return end
  loadPrefs()
  guihooks.trigger("MarketplaceModServer", B.detail(s, installedNames()))
end

function M.uiFav(key)
  loadPrefs(); prefs.fav[key] = (not prefs.fav[key]) or nil; savePrefs(); send()
end

-- remember servers the user looked at / copied (recent list, max 15)
function M.uiRecent(key)
  loadPrefs()
  for i = #prefs.recent, 1, -1 do if prefs.recent[i] == key then table.remove(prefs.recent, i) end end
  table.insert(prefs.recent, 1, key)
  while #prefs.recent > 15 do table.remove(prefs.recent) end
  savePrefs()
end

function M.uiCopy(text)
  local ok = false
  pcall(function() if setClipboard then setClipboard(tostring(text)); ok = true end end)
  if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = ok and "info" or "error", msg = ok and ("Copied " .. tostring(text)) or ("Copy failed — address: " .. tostring(text)) }) end
end

-- ---------- join a server through BeamMP ----------
local function mpApi()
  local mp = rawget(_G, "MPCoreNetwork")
  if type(mp) ~= "table" then
    pcall(function() mp = extensions and extensions.MPCoreNetwork end)
  end
  return type(mp) == "table" and mp or nil
end

local function call(mp, fn, ...)
  if not (mp and type(mp[fn]) == "function") then return false, nil end
  local args = { ... }
  local ok, r = pcall(function() return mp[fn](unpack(args)) end)
  return ok, r
end

function M.joinState()
  local mp = mpApi()
  local st = { beammp = mp ~= nil, canConnect = mp ~= nil and type(mp.connectToServer) == "function" }
  if mp then
    local ok, c = call(mp, "isLauncherConnected"); st.launcher = ok and c == true or false
    local ok2, s = call(mp, "isMPSession"); st.inSession = ok2 and s == true or false
    if type(mp.getAuthResult) == "function" then
      local ok3, r = call(mp, "getAuthResult")
      if ok3 and type(r) == "table" then st.loggedIn = r.success == true or tonumber(r.Auth) == 1; st.loginSrc = "getAuthResult" end
    elseif type(mp.isLoggedIn) == "function" then -- BeamMP < 4.14: isLoggedIn() has no side effects there
      local ok3, l = call(mp, "isLoggedIn"); if ok3 then st.loggedIn = l == true; st.loginSrc = "isLoggedIn" end
    end
  end
  local m = ""
  pcall(function() if getMissionFilename then m = getMissionFilename() or "" end end)
  st.inLevel = type(m) == "string" and m ~= ""
  return st
end

local function joinMsg(d) if guihooks then guihooks.trigger("MarketplaceModJoin", d) end end

local function parseKey(key)
  local ip, port = tostring(key or ""):match("^(.+):(%d+)$")
  return ip, tonumber(port)
end

-- every join step goes to beamng.log as "[Marketplace join] ..." so a failed attempt is diagnosable
local function jlog(level, msg) log(level, logTag, "[Marketplace join] " .. tostring(msg)) end
local function stateStr(st)
  return string.format("beammp=%s canConnect=%s launcher=%s loggedIn=%s inSession=%s inLevel=%s",
    tostring(st.beammp), tostring(st.canConnect), tostring(st.launcher), tostring(st.loggedIn), tostring(st.inSession), tostring(st.inLevel))
end

function M.uiJoinState()
  local st = M.joinState(); st.query = true
  jlog("I", "Join clicked, state: " .. stateStr(st))
  joinMsg(st)
end

local NOT_SIGNED_IN = "You aren't signed in to BeamMP, not even as a guest, so every server refuses the connection (\"Invalid Key\"). Sign in as a guest here, or log in to your account in BeamMP's multiplayer menu, then join."

-- key = "ip:port" from the list
function M.uiJoin(key, name)
  local s = byKey[key]
  local ip, port = parseKey(key)
  if s then ip, port = tostring(s.ip), tonumber(s.port) end
  local addr = tostring(ip) .. ":" .. tostring(port)
  local st = M.joinState()
  st.key, st.addr = key, addr
  local sname = s and s.sname or (type(name) == "string" and name ~= "" and name) or addr -- the UI sends the name (its list lives in the UI)
  st.name = B.stripCodes(sname)
  jlog("I", "uiJoin " .. tostring(key) .. " -> " .. addr .. " (" .. (s and "from Lua list" or (name and "name from UI list" or "not in list")) .. "), " .. stateStr(st) .. " loginSrc=" .. tostring(st.loginSrc))
  if not (ip and port) then st.state = "error"; st.msg = "This server has no valid address."; jlog("W", st.msg); joinMsg(st); return end
  if not (st.canConnect and st.launcher) then
    pcall(function() if setClipboard then setClipboard(addr); st.copied = true end end)
    st.state = "unavailable"
    st.msg = (not st.beammp) and "BeamMP isn't loaded in this game session. Start BeamNG through the BeamMP launcher to join from here."
      or (not st.canConnect) and "This BeamMP version can't be asked to join a server."
      or "The BeamMP launcher isn't connected. Start (or restart) the BeamMP launcher, then try again."
    jlog("W", "join " .. addr .. " not possible: " .. st.msg)
    joinMsg(st); return
  end
  if st.loggedIn == false then -- nil = this BeamMP can't tell us; then just try
    st.state = "login"; st.msg = NOT_SIGNED_IN
    jlog("W", "join " .. addr .. " stopped: BeamMP is not signed in; the server would kick with Invalid Key")
    joinMsg(st); return
  end
  M.uiRecent(key)
  jlog("I", string.format("calling MPCoreNetwork.connectToServer(%q, %s, %q, false)", tostring(ip), tostring(port), tostring(sname)))
  local ok, err = call(mpApi(), "connectToServer", ip, port, sname, false)
  if ok then joinT = os.time() end
  st.state = ok and "connecting" or "error"
  if not ok then
    pcall(function() if setClipboard then setClipboard(addr); st.copied = true end end)
    st.msg = "BeamMP couldn't start the connection" .. ((not ok and err) and (": " .. tostring(err)) or ".")
  end
  jlog(ok and "I" or "E", "connectToServer returned ok=" .. tostring(ok) .. ((not ok and err) and (" err=" .. tostring(err)) or ""))
  joinMsg(st)
end

function M.uiJoinGuest()
  local ok, err = call(mpApi(), "login")
  jlog(ok and "I" or "E", "guest sign-in requested via MPCoreNetwork.login(): ok=" .. tostring(ok) .. ((not ok and err) and (" err=" .. tostring(err)) or ""))
  if not ok then joinMsg({ state = "error", msg = "BeamMP couldn't start the guest sign-in" .. ((not ok and err) and (": " .. tostring(err)) or ".") }) end
end

-- the UI reports what BeamMP told it (LoadingInfo text, kicks, sign-in results) so it lands in beamng.log too
function M.uiJoinLog(msg)
  msg = tostring(msg or ""):gsub("[%c]", " ")
  if #msg > 400 then msg = msg:sub(1, 400) .. "..." end
  jlog("I", msg)
end

function M.uiJoinApprove() local ok = call(mpApi(), "approveModDownload"); jlog("I", "mod download approved (approveModDownload ok=" .. tostring(ok) .. ")") end
function M.uiJoinReject() local ok = call(mpApi(), "rejectModDownload"); jlog("I", "mod download rejected (rejectModDownload ok=" .. tostring(ok) .. ")") end
function M.uiJoinDone(reason) joinT = nil; jlog("I", "join finished: " .. tostring(reason or "-")) end
function M.uiJoinCancel(reason)
  joinT = nil
  local mp = mpApi()
  local ok = call(mp, "leaveServer")
  jlog("I", "join cancelled (" .. tostring(reason or "user pressed Cancel") .. "), leaveServer ok=" .. tostring(ok))
end

-- ---------- join state for the rest of Marketplace ----------
local function joining()
  if joinT and os.time() - joinT < 180 then return true end
  local going = false
  pcall(function() going = MPCoreNetwork.isGoingMPSession and MPCoreNetwork.isGoingMPSession() == true or false end)
  return going
end
local function inSession()
  local s = false
  pcall(function() s = MPCoreNetwork.isMPSession and MPCoreNetwork.isMPSession() == true or false end)
  return s
end
M.joining = joining
M.inSession = inSession

-- ---------- keep a server's mods (saved server mod packs) ----------
local PACKS_FILE = "settings/marketplaceMod/serverpacks.json"
local packs = nil
local saveJob, lastJob = nil, nil
local jobClock = 0
local SAVE_STEP = 0.25

local function loadPacks()
  if packs then return end
  packs = {}
  if not jsonReadFile then return end
  local ok, d = pcall(jsonReadFile, PACKS_FILE)
  if ok and type(d) == "table" and type(d.packs) == "table" then
    for id, p in pairs(d.packs) do if type(p) == "table" and type(p.files) == "table" then p.id = id; packs[id] = p end end
  end
end
local function savePacks() if packs and jsonWriteFile then pcall(jsonWriteFile, PACKS_FILE, { version = 1, packs = packs }, true) end end
local function fsize(path)
  local n
  pcall(function() if FS:fileExists(path) then n = FS:fileSize(path) end end)
  return tonumber(n)
end
local function mkdir(d) pcall(function() if not FS:directoryExists(d) then FS:directoryCreate(d, true) end end) end
local function rm(path) local ok = false; pcall(function() if FS:fileExists(path) then ok = FS:removeFile(path) end end) return ok end
local function modsDB() local db = {}; pcall(function() db = core_modmanager.getMods() or {} end) return type(db) == "table" and db or {} end
local function libMsg(t, msg) if guihooks then guihooks.trigger("MarketplaceModLibMsg", { type = t, msg = msg }) end end
local function fileOf(p, name) for _, f in ipairs(p.files) do if f.name == name then return f end end end
local function jobInfo(j)
  if not j then return nil end
  return { id = j.id, key = j.key, name = j.name, done = j.i, total = #j.names, copied = j.copied, skipped = j.skipped,
    failed = j.failed, missing = j.missing, bytes = j.bytes, state = j.state, cur = j.cur }
end

local function sendPacks()
  if not guihooks then return end
  loadPacks(); loadPrefs()
  local db = modsDB()
  local function isActive(n) local m = db[n]; if type(m) ~= "table" then return nil end return m.active == true end
  local list = {}
  for _, p in pairs(packs) do
    for _, f in ipairs(p.files) do f.gone = (fsize(f.path) == nil) or nil end -- deleted outside Marketplace
    list[#list + 1] = B.packSummary(p, isActive)
  end
  table.sort(list, function(a, b) return (a.savedAt or 0) > (b.savedAt or 0) end)
  guihooks.trigger("MarketplaceModServerPacks", { packs = list, keep = prefs.keep, job = jobInfo(saveJob), last = jobInfo(lastJob),
    inSession = inSession(), joining = joining() })
end
M.sendPacks = sendPacks
function M.uiServerPacks() sendPacks() end

-- remember "save this server's mods every time I join it" (default off)
function M.uiServerKeep(key, on)
  if type(key) ~= "string" or key == "" then return end
  loadPrefs(); prefs.keep[key] = (on == true or on == "true") and true or nil; savePrefs(); sendPacks()
end

-- copy the mods of the server you are on (or have just joined) out of /mods/multiplayer
function M.uiServerSave(key, name)
  loadPrefs(); loadPacks()
  local mp = mpApi()
  local cur
  pcall(function() cur = mp and mp.getCurrentServer and mp.getCurrentServer() end)
  if type(cur) == "table" and cur.ip and cur.port then
    local ck = tostring(cur.ip) .. ":" .. tostring(cur.port)
    if key and key ~= ck then jlog("W", "save server mods: asked for " .. tostring(key) .. " but BeamMP is on " .. ck .. "; saving " .. ck); name = nil end
    key = ck; name = name or cur.name
  end
  if type(key) ~= "string" or key == "" or not inSession() then
    libMsg("error", "Server mods can only be saved while you are on (or joining) that server: BeamMP deletes them when you leave."); return false
  end
  if saveJob then
    if saveJob.key ~= key then libMsg("error", "Still saving the mods of " .. tostring(saveJob.name) .. ".") end
    return false
  end
  local list = {}
  pcall(function() local mm = rawget(_G, "MPModManager") or (extensions and extensions.MPModManager); list = mm.getServerMods() or {} end)
  local names, seen = {}, {}
  for _, n in ipairs(type(list) == "table" and list or {}) do
    local sn = B.safeModName(n)
    if sn and not seen[sn:lower()] then seen[sn:lower()] = true; names[#names + 1] = sn
    elseif not sn then jlog("W", "save server mods: skipped unsafe mod name " .. tostring(n)) end
  end
  if #names == 0 then libMsg("info", "This server has no mods to save."); return false end
  local id = B.packId(key)
  local p = packs[id] or { id = id, key = key, files = {} }
  p.key = key; p.name = B.stripCodes(name or p.name or key); p.total = #names
  packs[id] = p
  saveJob = { id = id, key = key, name = p.name, names = names, i = 0, copied = 0, skipped = 0, failed = 0, missing = 0, bytes = 0, next = jobClock, state = "saving" }
  jlog("I", string.format("saving %d server mods of %s to %s%s/", #names, key, B.SAVE_ROOT, id))
  sendPacks()
  return true
end

local function finishSave()
  local j = saveJob; saveJob = nil
  local p = packs[j.id]
  j.state = "done"; lastJob = j
  if p then p.partial = (j.missing + j.failed) > 0 or nil; if not p.savedAt then p.savedAt = os.time() end end
  savePacks()
  jlog("I", string.format("server mods of %s saved: %d copied (%d bytes), %d already saved, %d failed, %d gone", j.key, j.copied, j.bytes, j.skipped, j.failed, j.missing))
  local msg = string.format("Saved the mods of %s: %d copied, %d already saved", tostring(j.name), j.copied, j.skipped)
  if j.missing > 0 then msg = msg .. string.format(", %d no longer there (you left the server: they are saved next time you join)", j.missing) end
  if j.failed > 0 then msg = msg .. string.format(", %d couldn't be copied (disk full?)", j.failed) end
  libMsg((j.failed > 0 or j.missing > 0) and "error" or "info", msg .. ".")
  sendPacks()
end

local function stepSave()
  local j = saveJob
  local p = packs[j.id]
  j.i = j.i + 1
  local n = j.names[j.i]
  if not n or not p then finishSave(); return end
  j.cur = n
  local src = "/mods/multiplayer/" .. n .. ".zip"
  local size = fsize(src)
  local f = fileOf(p, n)
  if not size then
    j.missing = j.missing + 1
  elseif f and ((f.pending and f.pendingSize == size and fsize(f.pending) == size) or (not f.pending and f.size == size and fsize(f.path) == size)) then
    j.skipped = j.skipped + 1
  else
    local dir = B.SAVE_ROOT .. j.id .. "/"
    mkdir(dir)
    local dst = dir .. n .. ".zip"
    rm(dst)
    pcall(function() FS:copyFile(src, dst) end)
    local got = fsize(dst)
    if got == size then
      j.copied = j.copied + 1; j.bytes = j.bytes + size
      if f and f.where == "installed" then f.pending, f.pendingSize = dst, size -- newer version; moved in by "Use in single-player"
      elseif f then f.size, f.path, f.where = size, dst, "staged"
      else p.files[#p.files + 1] = { name = n, size = size, path = dst, where = "staged" } end
      p.savedAt = os.time()
    else
      j.failed = j.failed + 1
      rm(dst)
      jlog("W", "couldn't copy " .. src .. " -> " .. dst .. " (size " .. tostring(got) .. " of " .. tostring(size) .. ")")
    end
  end
  savePacks()
  sendPacks()
end
M._stepSave = stepSave

function M.onUpdate(dtReal)
  if not saveJob then return end
  jobClock = jobClock + (tonumber(dtReal) or 0)
  if jobClock < saveJob.next then return end
  stepSave()
  if saveJob then saveJob.next = jobClock + SAVE_STEP end
end

local function installedPath(id, f) return B.INSTALL_ROOT .. id .. "/" .. f.name .. ".zip" end
local function setActive(names, on)
  if #names == 0 then return end
  local lib = rawget(_G, "marketplaceModLib")
  if type(lib) == "table" and lib.uiSetActiveMany then lib.uiSetActiveMany(names, on); return end
  for _, n in ipairs(names) do pcall(function() if on then core_modmanager.activateMod(n) else core_modmanager.deactivateMod(n) end end) end
end

-- on = true: use the saved mods as normal mods (single-player only); false: switch them off (files stay)
function M.uiServerPackUse(id, on)
  loadPacks()
  local p = packs[id]; if not p then return false end
  on = on == true or on == "true"
  if on and (joining() or inSession()) then
    libMsg("error", "Leave the BeamMP server first: in a server session BeamMP turns off every mod that isn't that server's, so this pack is for single-player.")
    return false
  end
  if saveJob and saveJob.id == id then libMsg("error", "Still saving this server's mods. Try again when it's done."); return false end
  local db, names, moved, bad = modsDB(), {}, 0, 0
  for _, f in ipairs(p.files) do
    local target = installedPath(id, f)
    local mname = B.modNameFromPath(target)
    if on then
      local from = f.pending or (f.where ~= "installed" and f.path) or nil
      if from then
        mkdir(B.INSTALL_ROOT .. id .. "/")
        if db[mname] then pcall(function() core_modmanager.deleteMod(mname) end) end -- older version of this file
        rm(target)
        pcall(function() FS:renameFile(from, target) end)
        if fsize(target) then
          f.path, f.where = target, "installed"
          if f.pending then f.size = f.pendingSize or f.size end
          f.pending, f.pendingSize = nil, nil
          moved = moved + 1
          pcall(function() core_modmanager.workOffChangedMod(target, "added") end) -- registers + activates (new mods are active)
        else bad = bad + 1; jlog("W", "couldn't move " .. tostring(from) .. " -> " .. target) end
      elseif f.where == "installed" then names[#names + 1] = mname end
    elseif f.where == "installed" then names[#names + 1] = mname end
  end
  setActive(names, on)
  savePacks()
  jlog("I", string.format("server pack %s %s (%d moved into /mods, %d toggled, %d failed)", id, on and "activated" or "deactivated", moved, #names, bad))
  libMsg(bad > 0 and "error" or "info", (on and "Turned on " or "Turned off ") .. "the mods of " .. tostring(p.name) .. (bad > 0 and string.format(" (%d files couldn't be moved)", bad) or "") .. ".")
  sendPacks()
  return true
end

function M.uiServerPackDelete(id, confirm)
  if confirm ~= "DELETE" then return false end
  loadPacks(); loadPrefs()
  local p = packs[id]; if not p then return false end
  if saveJob and saveJob.id == id then libMsg("error", "Still saving this server's mods. Try again when it's done."); return false end
  if joining() then libMsg("error", "BeamMP is joining a server right now. Delete the pack after the join."); return false end
  local db = modsDB()
  for _, f in ipairs(p.files) do
    local mname = B.modNameFromPath(installedPath(id, f))
    if f.where == "installed" and db[mname] then pcall(function() core_modmanager.deleteMod(mname) end) end
    if f.path then rm(f.path) end
    if f.pending then rm(f.pending) end
  end
  for _, d in ipairs({ B.SAVE_ROOT .. id, B.INSTALL_ROOT .. id }) do pcall(function() if FS.directoryRemove and FS:directoryExists(d) then FS:directoryRemove(d) end end) end
  packs[id] = nil
  if p.key then prefs.keep[p.key] = nil; savePrefs() end
  savePacks()
  jlog("I", "server pack " .. id .. " deleted")
  libMsg("info", "Deleted the saved mods of " .. tostring(p.name) .. ".")
  sendPacks()
  return true
end

function M.uiServerPackOpen(id)
  loadPacks()
  local p = packs[id]; if not p then return end
  local dir = B.SAVE_ROOT .. id
  for _, f in ipairs(p.files) do if f.where == "installed" then dir = B.INSTALL_ROOT .. id end end
  mkdir(dir)
  pcall(function() Engine.Platform.exploreFolder(dir) end)
end

M._B = B
M._packs = function() loadPacks(); return packs end
M._job = function() return saveJob, lastJob end
M._state = function() return { servers = servers, prefs = prefs, fetching = fetching, lastError = lastError } end
return M
