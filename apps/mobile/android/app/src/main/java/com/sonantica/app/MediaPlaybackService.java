package com.sonantica.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MediaPlaybackService extends Service {
    private static final String CHANNEL_ID = "sonantica_playback_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    // Actions for Plugin/Broadcast
    public static final String ACTION_PLAY = "com.sonantica.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.sonantica.app.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.sonantica.app.ACTION_NEXT";
    public static final String ACTION_PREV = "com.sonantica.app.ACTION_PREV";
    
    // Internal Service Actions
    private static final String SVC_PAUSE = "SVC_PAUSE";
    private static final String SVC_PLAY = "SVC_PLAY";
    private static final String SVC_NEXT = "SVC_NEXT";
    private static final String SVC_PREV = "SVC_PREV";

    private MediaSessionCompat mediaSession;
    private String currentTitle = "Sonántica";
    private String currentArtist = "Reproduciendo";
    private String currentAlbum = "";
    private Bitmap currentArt = null;
    private boolean isPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        // Initialize MediaSession
        mediaSession = new MediaSessionCompat(this, "SonánticaMediaSession");
        
        // Set initial state
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS 
            | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
            
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                super.onPlay();
                broadcastAction(ACTION_PLAY);
                isPlaying = true; // Optimistic update
                updateMediaSessionState();
                updateNotification();
            }

            @Override
            public void onPause() {
                super.onPause();
                broadcastAction(ACTION_PAUSE);
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
            }

            @Override
            public void onSkipToNext() {
                super.onSkipToNext();
                broadcastAction(ACTION_NEXT);
            }

            @Override
            public void onSkipToPrevious() {
                super.onSkipToPrevious();
                broadcastAction(ACTION_PREV);
            }
        });

        mediaSession.setActive(true);
    }
    
    private void broadcastAction(String action) {
        Intent intent = new Intent(action);
        // We use the application context's package to ensure security
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        
        if ("STOP_SERVICE".equals(action)) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        } else if ("UPDATE_METADATA".equals(action)) {
            currentTitle = intent.getStringExtra("title");
            currentArtist = intent.getStringExtra("artist");
            currentAlbum = intent.getStringExtra("album");
            String artUrl = intent.getStringExtra("coverArt");
            
            if (artUrl != null && !artUrl.isEmpty()) {
                 new LoadArtTask().execute(artUrl);
            } else {
                 currentArt = null;
                 updateNotification();
            }
            updateMediaSessionMetadata();
        } else if ("UPDATE_STATE".equals(action)) {
            String state = intent.getStringExtra("state");
            boolean newIsPlaying = "playing".equals(state);
            if (isPlaying != newIsPlaying) {
                isPlaying = newIsPlaying;
                updateNotification();
                updateMediaSessionState();
            }
        } 
        // Handle Notification Actions
        else if (SVC_PAUSE.equals(action)) {
            mediaSession.getController().getTransportControls().pause();
        } else if (SVC_PLAY.equals(action)) {
            mediaSession.getController().getTransportControls().play();
        } else if (SVC_NEXT.equals(action)) {
            mediaSession.getController().getTransportControls().skipToNext();
        } else if (SVC_PREV.equals(action)) {
            mediaSession.getController().getTransportControls().skipToPrevious();
        }
        else {
            // Default start
            startForegroundService();
        }
        
        return START_STICKY;
    }

    private void startForegroundService() {
        updateNotification();
    }

    private void updateMediaSessionState() {
        if (mediaSession == null) return;
        
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        long actions = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE 
                     | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS;

        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f);
        
        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void updateMediaSessionMetadata() {
        if (mediaSession == null) return;

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum);
        
        if (currentArt != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentArt);
        }
        
        mediaSession.setMetadata(metaBuilder.build());
    }

    private void updateNotification() {
        if (currentTitle == null) currentTitle = "Sonántica";
        
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        // Create Media Style
        MediaStyle mediaStyle = new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2); // prev, play/pause, next

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setStyle(mediaStyle)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSubText(currentAlbum)
                .setSmallIcon(android.R.drawable.ic_media_play) 
                .setContentIntent(pendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW) // Keeps it alive but not intrusive
                .setOngoing(true); // Must be true for foreground service

        // Actions
        builder.addAction(new NotificationCompat.Action(
                android.R.drawable.ic_media_previous, "Previous", 
                getServiceIntent(SVC_PREV)));

        if (isPlaying) {
             builder.addAction(new NotificationCompat.Action(
                android.R.drawable.ic_media_pause, "Pause", 
                getServiceIntent(SVC_PAUSE)));
        } else {
             builder.addAction(new NotificationCompat.Action(
                android.R.drawable.ic_media_play, "Play", 
                getServiceIntent(SVC_PLAY)));
        }

        builder.addAction(new NotificationCompat.Action(
                android.R.drawable.ic_media_next, "Next", 
                getServiceIntent(SVC_NEXT)));

        if (currentArt != null) {
            builder.setLargeIcon(currentArt);
        }

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }
    
    private PendingIntent getServiceIntent(String action) {
        Intent intent = new Intent(this, MediaPlaybackService.class);
        intent.setAction(action);
        return PendingIntent.getService(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Sonántica Reproducción",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Mantiene la reproducción de audio activa en segundo plano");
            serviceChannel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mediaSession != null) {
            mediaSession.release();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private class LoadArtTask extends AsyncTask<String, Void, Bitmap> {
        @Override
        protected Bitmap doInBackground(String... strings) {
            try {
                URL url = new URL(strings[0]);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();
                return BitmapFactory.decodeStream(input);
            } catch (Exception e) {
                return null;
            }
        }

        @Override
        protected void onPostExecute(Bitmap bitmap) {
            if (bitmap != null) {
                currentArt = bitmap;
                updateNotification();
                updateMediaSessionMetadata();
            }
        }
    }
}
