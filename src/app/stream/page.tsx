'use client';
import StreamViewer from "@/component/StreamViewer";
import getMediaStream from "@/utils/getMediaStream";
import { useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client"



let device: mediasoupClient.types.Device;
let ws: WebSocket

export default function Stream() {

    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        try {
            const stream = await getMediaStream();
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsPublishing(true);
            }
        } catch (err) {
            setError((err as Error).message);
        }
    };


    return (
        <div style={{ padding: 20 }}>
            <button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? 'Publishing...' : 'Publish'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <StreamViewer videoRef={videoRef} />
        </div>
    );
}


