// 'use client';
import { RefObject } from 'react';

interface Props {
    videoRef: RefObject<HTMLVideoElement | null>;
}

export default function StreamViewer({ videoRef }: Props) {
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
                width: '100%',
                maxWidth: 600,
                border: '1px solid #ccc',
                marginTop: 10,
            }}
        />
    );
}

