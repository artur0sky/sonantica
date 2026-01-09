from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
import datetime
import time
import logging
from ..models.analytics_model import TrackStatistics, ListeningHeatmap, GenreStatistics, ListeningStreak
from ..models.track_model import Track

logger = logging.getLogger("AudioWorker")

class AnalyticsRepository:
    def __init__(self, session_factory):
        self.SessionLocal = session_factory

    def update_event_aggregation(self, event_data: dict):
        with self.SessionLocal() as session:
            try:
                event_type = event_data.get("eventType")
                data = event_data.get("data", {})
                track_id = data.get("trackId")
                timestamp_ms = event_data.get("timestamp", time.time() * 1000)
                dt = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=datetime.timezone.utc)
                date_val = dt.date()
                hour_val = dt.hour

                if not track_id:
                    return

                # 1. Track Statistics Upsert
                self._upsert_track_stats(session, track_id, event_type, data, dt)

                # 2. Heatmap Upsert
                self._upsert_heatmap(session, date_val, hour_val, event_type, data)

                # 3. Genre Statistics Upsert
                self._upsert_genre_stats(session, track_id, event_type, data, dt)

                # 4. Listening Streak Upsert
                user_id = event_data.get("userId") or event_data.get("sessionId") or "anonymous"
                self._upsert_listening_streak(session, user_id, event_type, data, dt)

                session.commit()
                logger.debug(f"📊 Aggregated {event_type} for track {track_id}")

            except Exception as e:
                session.rollback()
                logger.error(f"❌ Failed to aggregate event: {e}")
                raise

    def _upsert_track_stats(self, session: Session, track_id, event_type, data, dt):
        values = {
            "track_id": track_id,
            "play_count": 1 if event_type == "playback.start" else 0,
            "complete_count": 1 if event_type == "playback.complete" else 0,
            "skip_count": 1 if event_type == "playback.skip" else 0,
            "total_play_time": int(data.get("duration", 0)) if event_type == "playback.complete" else (int(data.get("position", 0)) if event_type == "playback.skip" else 0),
            "average_completion": 100.0 if event_type == "playback.complete" else ( (int(data.get("position", 0)) / int(data.get("duration", 1)) * 100.0) if event_type == "playback.skip" and int(data.get("duration", 1)) > 0 else 0.0 ),
            "last_played_at": dt,
            "updated_at": dt
        }
        
        update = {
            "last_played_at": dt,
            "updated_at": dt
        }

        if event_type == "playback.start":
            update["play_count"] = TrackStatistics.play_count + 1
        elif event_type == "playback.complete":
            update["complete_count"] = TrackStatistics.complete_count + 1
            update["total_play_time"] = TrackStatistics.total_play_time + values["total_play_time"]
            update["average_completion"] = 100.0
        elif event_type == "playback.skip":
            update["skip_count"] = TrackStatistics.skip_count + 1
            update["total_play_time"] = TrackStatistics.total_play_time + values["total_play_time"]
            update["average_completion"] = values["average_completion"]

        stmt = insert(TrackStatistics).values(**values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[TrackStatistics.track_id],
            set_=update
        )
        session.execute(stmt)

    def _upsert_heatmap(self, session: Session, date_val, hour_val, event_type, data):
        values = {
            "date": date_val,
            "hour": hour_val,
            "play_count": 1 if event_type == "playback.start" else 0,
            "unique_tracks": 1 if event_type == "playback.start" else 0,
            "total_duration": int(data.get("duration", 0)) if event_type == "playback.complete" else (int(data.get("position", 0)) if event_type == "playback.skip" else 0)
        }
        
        update = {
            "play_count": ListeningHeatmap.play_count + values["play_count"] if event_type == "playback.start" else ListeningHeatmap.play_count,
            "unique_tracks": ListeningHeatmap.unique_tracks + values["unique_tracks"] if event_type == "playback.start" else ListeningHeatmap.unique_tracks,
            "total_duration": ListeningHeatmap.total_duration + values["total_duration"]
        }

        stmt = insert(ListeningHeatmap).values(**values)
        stmt = stmt.on_conflict_do_update(
            constraint='uq_date_hour',
            set_=update
        )
        session.execute(stmt)

    def _upsert_genre_stats(self, session, track_id, event_type, data, dt):
        genre = data.get("genre")
        if not genre:
            t = session.query(Track).filter(Track.id == track_id).first()
            if t: genre = t.genre
        
        if genre and genre != "Unknown":
            duration = int(data.get("duration", 0)) if event_type == "playback.complete" else (int(data.get("position", 0)) if event_type == "playback.skip" else 0)
            values = {
                "genre": genre,
                "play_count": 1 if event_type == "playback.start" else 0,
                "total_play_time": duration,
                "unique_tracks": 1 if event_type == "playback.start" else 0,
                "last_played_at": dt,
                "updated_at": dt
            }
            update = {
                "last_played_at": dt,
                "updated_at": dt,
                "play_count": GenreStatistics.play_count + values["play_count"],
                "total_play_time": GenreStatistics.total_play_time + values["total_play_time"]
            }
            stmt = insert(GenreStatistics).values(**values)
            stmt = stmt.on_conflict_do_update(
                index_elements=[GenreStatistics.genre],
                set_=update
            )
            session.execute(stmt)

    def _upsert_listening_streak(self, session, user_id, event_type, data, dt):
        duration = int(data.get("duration", 0)) if event_type == "playback.complete" else (int(data.get("position", 0)) if event_type == "playback.skip" else 0)
        values = {
            "user_id": user_id,
            "current_streak": 1 if event_type == "playback.start" else 0,
            "max_streak": 1 if event_type == "playback.start" else 0,
            "total_play_time": duration,
            "last_played_at": dt,
            "updated_at": dt
        }
        update = {
            "last_played_at": dt,
            "updated_at": dt,
            "current_streak": ListeningStreak.current_streak + (1 if event_type == "playback.start" else 0),
            "total_play_time": ListeningStreak.total_play_time + duration
        }
        update["max_streak"] = func.greatest(ListeningStreak.max_streak, update["current_streak"])
        
        stmt = insert(ListeningStreak).values(**values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[ListeningStreak.user_id],
            set_=update
        )
        session.execute(stmt)
