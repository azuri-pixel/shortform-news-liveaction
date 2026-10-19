import { execFileSync } from "node:child_process";
import { copyFileSync } from "node:fs";

// 원본은 보존하고 trim/crop/정지 프레임을 한 번의 ffmpeg 실행으로 만든다.
export const syncMedia = (media, src, dest) => {
  const still = media.frame_at_sec !== undefined;
  if (!media.trim && !media.crop && !still) return copyFileSync(src, dest);
  const args = ["-v", "error", "-y", "-i", src];
  if (still) {
    if (!Number.isFinite(media.frame_at_sec) || media.frame_at_sec < 0 || !/\.png$/i.test(dest)) throw new Error("frame_at_sec은 0 이상의 초이며 file은 .png여야 한다");
    args.push("-ss", String(media.frame_at_sec), "-frames:v", "1");
  } else if (media.trim) args.push("-ss", String(media.trim.from_sec), "-t", String(media.trim.duration_sec));
  if (media.crop) {
    const { x, y, width, height } = media.crop;
    if (![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width <= 0 || height <= 0) throw new Error("crop은 원본 픽셀 기준의 0 이상 x/y와 양수 width/height 정수여야 한다");
    const filter = `crop=${width}:${height}:${x}:${y}` + (width * 16 === height * 9 ? ",scale=1080:1920" : "");
    args.push("-vf", filter);
  }
  args.push("-an");
  if (still) args.push("-c:v", "png");
  else args.push("-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart");
  execFileSync("ffmpeg", [...args, dest], { stdio: "inherit" });
};
