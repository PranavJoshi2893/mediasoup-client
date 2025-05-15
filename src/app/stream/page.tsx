'use client';
import StreamViewer from "@/component/StreamViewer";
import getMediaStream from "@/utils/getMediaStream";
import { useRef, useState, useEffect } from "react";
import * as mediasoupClient from "mediasoup-client"



let device: mediasoupClient.types.Device;
let ws: WebSocket

export default function Stream() {

    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        ws = new WebSocket("ws://localhost:3001/ws");
        ws.onopen = () => {
            console.log("WebSocket connected");
        };
        ws.onmessage = async (msg) => {
            const { type, data } = JSON.parse(msg.data);

            switch (type) {
                case "routerCapabilities":
                    await loadDevice(data);
                    send({ type: "createProducerTransport" });
                    break;

                case "producerTransportCreated":
                    await createTransportAndProduce(data);
                    break;

                case "producerConnected":
                    console.log("✅ Producer connected");
                    break;

                case "produced":
                    console.log("✅ Media track produced", data);
                    break;

                case "error":
                    setError("❌ " + data.toString());
                    break;
            }
        };
    }, []);

    const send = (data: any) => {
        ws.send(JSON.stringify(data));
    };

    const loadDevice = async (rtpCapabilities: any) => {
        device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
    };

    const createTransportAndProduce = async (params: any) => {
        const transport = device.createSendTransport(params);

        transport.on("connect", ({ dtlsParameters }, callback, errback) => {
            send({ type: "connectProducerTransport", dtlsParameters });
            callback();
        });

        transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
            send({ type: "produce", kind, rtpParameters });
            callback({ id: "track-id" }); // dummy ID
        });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            for (const track of stream.getTracks()) {
                await transport.produce({ track });
            }

            setIsPublishing(true);
        } catch (err) {
            setError((err as Error).message);
        }
    };


    const handlePublish = () => {
        send({ type: "getRouterRtpCapabilities" });
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


