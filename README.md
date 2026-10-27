# Volume OSD on Any Change

A GNOME Shell extension that shows the native on-screen volume popup whenever the output
volume or mute state changes, whatever changed it.

## Why

GNOME only shows the volume popup when gnome-settings-daemon handles the change, which in
practice means the keyboard's media keys. A volume change that comes from the audio
device itself goes straight to the PipeWire sink and shows nothing. Swiping the stem
of AirPods, or pressing the volume buttons on most Bluetooth headphones, sends the change
over AVRCP, so the volume moves with no feedback on screen.

I made this for AirPods Pro (2nd generation): swiping the touch control on the stem
changes the volume, and I wanted to see on screen where it ended up.

## How it works

The extension listens to the mixer GNOME Shell already uses, follows the default output
device as it changes, and shows the popup when that device's volume or mute state
changes. It works out the icon and level the same way the Shell's own volume indicator
does, and respects *Over-Amplification* (`allow-volume-above-100-percent`), so the popup
looks the same as the native one.

The popup also appears for changes that did not show one before, such as dragging the
volume slider in Quick Settings or an application setting the output volume.

## Install

From source:

```sh
git clone https://github.com/ValentinoHysa/volume-osd-anychange
cd volume-osd-anychange
gnome-extensions pack --force .
gnome-extensions install --force volume-osd-anychange@valentinohysa.github.io.shell-extension.zip
```

Log out and back in, since GNOME Shell on Wayland loads new extensions only at login,
then enable it:

```sh
gnome-extensions enable volume-osd-anychange@valentinohysa.github.io
```

## Compatibility

Tested on GNOME Shell 50 with AirPods Pro (2nd generation). Other headphones that change
their volume over Bluetooth should work the same way, since the extension watches the
output volume rather than the device.

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
