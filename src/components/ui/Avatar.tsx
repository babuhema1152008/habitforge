interface AvatarProps {
  emoji: string;
  color: string;
  size?: number;
}

export function Avatar({ emoji, color, size = 40 }: AvatarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: `${color}22`, fontSize: size * 0.5 }}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
