# Marketplace for BeamNG.drive

Marketplace is a UI mod for BeamNG.drive that replaces the in-game Repository tab with a faster, easier-to-browse store and adds a more capable Mod Manager on top of the stock one.

It is not a separate mod source. Every mod you see and every download goes through the **official BeamNG repository**, using the same API and the same subscribe/download functions the stock Repository screen uses. Marketplace doesn't host, mirror or modify any mods.

## Features

These are the things Marketplace adds on top of the stock Repository and Mods Manager.

**Finding mods**
- **Recommended for you**: shelves based on the mods you have installed and what you browse.
- **Typo-tolerant search**: "etk k serise" still finds the ETK K-Series.
- **Filters**: category, vehicle type, last updated, size, downloads, rating, author, photos and more.

**Mod Manager extras**
- Detects **conflicts** (mods overwriting the same files) and **duplicates** (the same mod installed more than once, or several versions of it).
- Checks **requirements**: shows which mods a mod needs and which of those are missing or turned off, and can install them with it.
- Lets you add your own **tags**, **favorites**, **notes** and **ratings** to installed mods.

**Mod Packs**
- Group mods into **Mod Packs** and switch between them in one click.
- Share a pack as a small file or as pasted text. Whoever imports it gets a preview, and the missing mods download from the official repository.

**BeamMP**
- **One-click join**: browse public BeamMP servers and join straight from Marketplace.
- **Keep browsing** while BeamMP downloads a server's mods. The join progress stays in a small pill on every tab.
- **Save a server's mods as a pack**, so you can keep them or use them in single-player later.

It also follows the game's own UI style (colours, fonts and icons), with optional accent colours and themes.

## Install

1. Download `Marketplace.zip` from the [latest release](../../releases/latest).
2. Put the zip (don't extract it) in your BeamNG mods folder
3. Start the game. If you want the BeamMP features, start it through the **BeamMP launcher**.
4. Open **Mods → Repository**, or click the Repository button in the main menu, to open Marketplace.

Need the stock screen? Click **Classic repository** in Marketplace's top bar. You can also bind a key to "Toggle Marketplace" in the controls settings.

To uninstall, delete `Marketplace.zip` from the mods folder, or turn it off in the Mods Manager.

## Notes

- Marketplace works in the main menu only. Once a level is loaded it stays idle, so it has no effect on in-game performance.
- It keeps its data (catalog cache, tags, notes, packs and settings) in `settings/marketplaceMod/` inside your BeamNG user folder.
- Deleting mods always asks for confirmation first. Cleanup tools move files to a recycle folder instead of deleting them.

## Building from source

The mod's files are the `lua`, `scripts`, `ui` and `marketplaceMod` folders. Zip those four folders (not the folder that contains them) into `Marketplace.zip`.

## Bug reports

Found a bug or have an idea? Please open an [issue](../../issues). It helps to include:
- your game version
- what you did and what happened
- any `Marketplace` lines from `beamng.log` (in your BeamNG user folder)

## License

MIT. See [LICENSE](LICENSE).

Marketplace is a fan-made mod and is not affiliated with or endorsed by BeamNG GmbH or the BeamMP project.
