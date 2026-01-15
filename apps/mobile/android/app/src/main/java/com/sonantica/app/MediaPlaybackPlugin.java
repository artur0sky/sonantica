package com.sonantica.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaPlayback")
public class MediaPlaybackPlugin extends Plugin {

    private BroadcastReceiver actionReceiver;

    @Override
    public void load() {
        super.load();
        
        // Listen for broadcasts from Service (Play/Pause events)
        actionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                JSObject ret = new JSObject();
                if (MediaPlaybackService.ACTION_PLAY.equals(action)) {
                     notifyListeners("onPlay", ret);
                } else if (MediaPlaybackService.ACTION_PAUSE.equals(action)) {
                     notifyListeners("onPause", ret);
                } else if (MediaPlaybackService.ACTION_NEXT.equals(action)) {
                     notifyListeners("onNext", ret);
                } else if (MediaPlaybackService.ACTION_PREV.equals(action)) {
                     notifyListeners("onPrev", ret);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(MediaPlaybackService.ACTION_PLAY);
        filter.addAction(MediaPlaybackService.ACTION_PAUSE);
        filter.addAction(MediaPlaybackService.ACTION_NEXT);
        filter.addAction(MediaPlaybackService.ACTION_PREV);
        
        getContext().registerReceiver(actionReceiver, filter);
    }

    @PluginMethod
    public void startForegroundService(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaPlaybackService.class);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaPlaybackService.class);
        intent.setAction("STOP_SERVICE");
        getContext().startService(intent);
        call.resolve();
    }
    
    @PluginMethod
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title");
        String artist = call.getString("artist");
        String album = call.getString("album");
        String coverArt = call.getString("coverArt");
        
        Intent intent = new Intent(getContext(), MediaPlaybackService.class);
        intent.setAction("UPDATE_METADATA");
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("album", album);
        intent.putExtra("coverArt", coverArt);
        getContext().startService(intent);
        call.resolve();
    }
    
    @PluginMethod
    public void updatePlaybackState(PluginCall call) {
        String state = call.getString("state");
        
        Intent intent = new Intent(getContext(), MediaPlaybackService.class);
        intent.setAction("UPDATE_STATE");
        intent.putExtra("state", state);
        getContext().startService(intent);
        call.resolve();
    }
    
    @Override
    protected void handleOnDestroy() {
        if (actionReceiver != null) {
            getContext().unregisterReceiver(actionReceiver);
        }
    }
}
