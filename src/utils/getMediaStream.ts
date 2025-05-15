export default async function getMediaStream(): Promise<MediaStream> {
  if (typeof window === "undefined") {
    throw new Error("Not running in the browser");
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Media devices not supported in this browser");
  }

  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
}
