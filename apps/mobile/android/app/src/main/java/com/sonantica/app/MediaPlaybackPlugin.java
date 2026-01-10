package com.sonantica.app;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaPlayback")
public class MediaPlaybackPlugin extends Plugin {

    @PluginMethod
    public void startForegroundService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), MediaPlaybackService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start foreground service", e);
        }
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), MediaPlaybackService.class);
            intent.setAction("STOP_SERVICE");
            getContext().startService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop foreground service", e);
        }
    }
}
