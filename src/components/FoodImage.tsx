import Image from "next/image";
import { cn } from "@/lib/cn";

interface FoodImageProps {
  src: string;
  alt: string;
  position?: string;
  zoom?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  hover?: boolean;
}

/**
 * Renders a food photo with an optional crop (object-position) and zoom so
 * several dishes can be showcased out of one large photograph. Supports
 * data-URLs for owner-uploaded images from the dashboard.
 */
export default function FoodImage({
  src,
  alt,
  position = "50% 50%",
  zoom,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority,
  className,
  hover = true,
}: FoodImageProps) {
  const zoomStyle = zoom
    ? { transform: `scale(${zoom})`, transformOrigin: position }
    : undefined;

  return (
    <div className={cn("relative overflow-hidden bg-cream-200", className)}>
      <div
        className={cn(
          "absolute inset-0",
          hover &&
            "transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
        )}
      >
        <div className="absolute inset-0" style={zoomStyle}>
          {src.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: position }}
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover"
              style={{ objectPosition: position }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
