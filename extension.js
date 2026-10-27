// SPDX-License-Identifier: GPL-2.0-or-later
// Volume OSD on Any Change
//
// GNOME only shows the volume popup (OSD) when you press the keyboard media
// keys, because gnome-settings-daemon drives that path. Volume changes that
// come straight from the audio device — e.g. AirPods over Bluetooth AVRCP —
// change the PipeWire sink directly and never trigger the OSD.
//
// This extension listens to the same mixer the shell uses and pops the OSD on
// any output volume/mute change, reusing the shell's exact icon and level
// computation (see ui/status/volume.js) so it looks identical to the native
// popup.

import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const ALLOW_AMPLIFIED_VOLUME_KEY = 'allow-volume-above-100-percent';

// Mirrors OutputStreamSlider._icons in ui/status/volume.js.
const ICONS = [
    'audio-volume-muted-symbolic',
    'audio-volume-low-symbolic',
    'audio-volume-medium-symbolic',
    'audio-volume-high-symbolic',
    'audio-volume-overamplified-symbolic',
];

export default class VolumeOsdAnyChange extends Extension {
    enable() {
        this._soundSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.sound'});

        // Reuse the shell's singleton mixer control (don't open our own).
        this._control = Volume.getMixerControl();

        this._stream = null;
        this._streamSignalIds = [];

        this._defaultSinkChangedId = this._control.connect(
            'default-sink-changed', () => this._bindStream(this._control.get_default_sink()));

        // Bind to the current sink now, without popping the OSD at startup.
        this._bindStream(this._control.get_default_sink());
    }

    disable() {
        this._unbindStream();

        if (this._control && this._defaultSinkChangedId)
            this._control.disconnect(this._defaultSinkChangedId);
        this._defaultSinkChangedId = 0;
        this._control = null;
        this._soundSettings = null;
    }

    _unbindStream() {
        if (this._stream) {
            for (const id of this._streamSignalIds)
                this._stream.disconnect(id);
        }
        this._streamSignalIds = [];
        this._stream = null;
    }

    _bindStream(stream) {
        this._unbindStream();
        if (!stream)
            return;

        this._stream = stream;
        // Fire on both volume and mute changes. Connecting does NOT invoke the
        // handler, so switching the default sink won't spuriously show an OSD.
        this._streamSignalIds.push(
            stream.connect('notify::volume', () => this._showOsd()),
            stream.connect('notify::is-muted', () => this._showOsd()));
    }

    _showOsd() {
        const stream = this._stream;
        if (!stream || !this._control)
            return;

        const maxNorm = this._control.get_vol_max_norm();
        const volume = stream.volume;

        // Icon selection — identical to ui/status/volume.js getIcon().
        let n;
        if (stream.is_muted || volume <= 0) {
            n = 0;
        } else {
            n = Math.ceil(3 * volume / maxNorm);
            n = Math.clamp(n, 1, ICONS.length - 1);
        }
        const gicon = new Gio.ThemedIcon({name: ICONS[n]});

        // Level and max — identical to getLevel()/getMaxLevel().
        const level = volume / maxNorm;
        const allowAmplified = this._soundSettings.get_boolean(ALLOW_AMPLIFIED_VOLUME_KEY);
        const maxLevel = allowAmplified
            ? this._control.get_vol_max_amplified() / maxNorm
            : 1;

        Main.osdWindowManager.showAll(gicon, null, level, maxLevel);
    }
}
