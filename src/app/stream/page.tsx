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


    const [stream, setStream] = useState<MediaStream | null>(null);
    const [producerTransport, setProducerTransport] = useState<any>(null);
    const [producers, setProducers] = useState<any[]>([]);

    useEffect(() => {
        ws = new WebSocket("ws://localhost:3001/ws");

        ws.onopen = () => {
            console.log("✅ WebSocket connected");
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
                    console.log("✅ Media track produced:", data);
                    break;

                case "error":
                    setError("❌ " + data.toString());
                    break;
            }
        };

        return () => {
            ws?.close();
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
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            const newProducers: any[] = [];

            for (const track of mediaStream.getTracks()) {
                const producer = await transport.produce({ track });
                newProducers.push(producer);
            }

            setProducerTransport(transport);
            setProducers(newProducers);
            setStream(mediaStream);
            setIsPublishing(true);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handlePublish = () => {
        send({ type: "getRouterRtpCapabilities" });
    };

    const handleStop = () => {
        // Stop media tracks
        stream?.getTracks().forEach((track) => track.stop());

        // Close producers
        producers.forEach((producer) => {
            try {
                producer.close();
            } catch (err) {
                console.error("Error closing producer", err);
            }
        });

        // Close transport
        try {
            producerTransport?.close();
        } catch (err) {
            console.error("Error closing transport", err);
        }

        setStream(null);
        setProducers([]);
        setProducerTransport(null);
        setIsPublishing(false);
    };


    return (
        <div style={{ padding: 20 }}>
            <h1>Mediasoup Publisher</h1>
            <button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Publish"}
            </button>
            {isPublishing && (
                <button onClick={handleStop} style={{ marginLeft: 10 }}>
                    Stop Publishing
                </button>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <StreamViewer videoRef={videoRef} />
        </div>
    );
}


