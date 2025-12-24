/**
 * Track Rating Component
 *
 * Displays and manages track ratings (heart + stars)
 * Configurable to show heart only, stars only, or both
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  IconHeart,
  IconHeartFilled,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
import { cn } from "../../utils";

export type RatingDisplayMode = "both" | "heart" | "stars";

interface TrackRatingProps {
  trackId: string;
  mode?: RatingDisplayMode;
  size?: number;
  className?: string;
  compact?: boolean;
}

export function TrackRating({
  trackId,
  mode = "both",
  size = 20,
  className,
  compact = false,
}: TrackRatingProps) {
  // TODO: Connect to actual rating store using trackId
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Placeholder: Will use trackId to load/save ratings
  console.debug(`Rating component for track: ${trackId}`);

  const showHeart = mode === "both" || mode === "heart";
  const showStars = mode === "both" || mode === "stars";

  const handleStarClick = (value: number) => {
    setRating(value === rating ? 0 : value);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Heart (Favorite) */}
      {showHeart && (
        <motion.button
          onClick={() => setIsFavorite(!isFavorite)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "transition-colors",
            isFavorite ? "text-red-500" : "text-text-muted hover:text-red-400"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? (
            <IconHeartFilled size={size} />
          ) : (
            <IconHeart size={size} stroke={1.5} />
          )}
        </motion.button>
      )}

      {/* Stars (Rating) */}
      {showStars && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverRating || rating);
            const StarIcon = isFilled ? IconStarFilled : IconStar;

            return (
              <motion.button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "transition-colors",
                  isFilled
                    ? "text-yellow-500"
                    : "text-text-muted hover:text-yellow-400"
                )}
                aria-label={`Rate ${star} stars`}
              >
                <StarIcon size={compact ? size * 0.8 : size} stroke={1.5} />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
