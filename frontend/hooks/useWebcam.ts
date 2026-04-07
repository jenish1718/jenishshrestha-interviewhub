import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebcamReturn {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isActive: boolean;
    isLoading: boolean;
    error: string | null;
    hasPermission: boolean | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    toggleCamera: () => Promise<void>;
}

export const useWebcam = (): UseWebcamReturn => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Check if webcam is supported
    const isSupported = typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function';

    const startCamera = useCallback(async () => {
        if (!isSupported) {
            setError('Webcam is not supported in this browser');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 15, max: 30 },
                },
                audio: false,
            });

            streamRef.current = stream;
            setHasPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsActive(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';

            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access.');
                    setHasPermission(false);
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found on this device.');
                } else if (err.name === 'NotReadableError') {
                    setError('Camera is already in use by another application.');
                } else {
                    setError(errorMessage);
                }
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsActive(false);
    }, []);

    const toggleCamera = useCallback(async () => {
        if (isActive) {
            stopCamera();
        } else {
            await startCamera();
        }
    }, [isActive, startCamera, stopCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        videoRef,
        canvasRef,
        isActive,
        isLoading,
        error,
        hasPermission,
        startCamera,
        stopCamera,
        toggleCamera,
    };
};
