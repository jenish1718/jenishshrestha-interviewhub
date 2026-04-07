// useConfidenceAnalysis.ts - Visual Confidence Analysis Hook
// This hook uses MediaPipe Face Mesh (a computer vision library) to analyze
// the user's face through their webcam in real-time. It detects:
// - Smile Score: How much the user is smiling (mouth width and corner position)
// - Eye Contact Score: Whether the user is looking at the camera (iris position)
// - Head Nods: Counts up-down head movements (nose Y-position changes)
// - Head Pose Score: How steady and forward-facing the head is
// These metrics are sent to the backend for the final performance report.

import { useState, useRef, useCallback, useEffect } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface ConfidenceMetrics {
    smileScore: number;      // 0-100
    eyeContactScore: number; // 0-100
    nodCount: number;
    headPoseScore: number;   // 0-100
}

interface UseConfidenceAnalysisReturn {
    metrics: ConfidenceMetrics;
    isAnalyzing: boolean;
    isSupported: boolean;
    error: string | null;
    startAnalysis: (videoElement: HTMLVideoElement) => void;
    stopAnalysis: () => void;
    resetMetrics: () => void;
}

// Default metrics
const defaultMetrics: ConfidenceMetrics = {
    smileScore: 0,
    eyeContactScore: 0,
    nodCount: 0,
    headPoseScore: 0,
};

// MediaPipe Face Mesh landmark indices
const FACE_LANDMARKS = {
    // Mouth corners and lips for smile detection
    LEFT_MOUTH_CORNER: 61,
    RIGHT_MOUTH_CORNER: 291,
    UPPER_LIP_TOP: 13,
    LOWER_LIP_BOTTOM: 14,
    LEFT_UPPER_LIP: 39,
    RIGHT_UPPER_LIP: 269,

    // Eyes for eye contact
    LEFT_EYE_INNER: 133,
    LEFT_EYE_OUTER: 33,
    RIGHT_EYE_INNER: 362,
    RIGHT_EYE_OUTER: 263,
    LEFT_IRIS_CENTER: 468, // Iris landmarks (if available)
    RIGHT_IRIS_CENTER: 473,

    // Nose for head pose
    NOSE_TIP: 1,
    NOSE_BRIDGE: 6,

    // Face outline for head pose
    FOREHEAD_CENTER: 10,
    CHIN_CENTER: 152,
    LEFT_CHEEK: 234,
    RIGHT_CHEEK: 454,
};

export const useConfidenceAnalysis = (): UseConfidenceAnalysisReturn => {
    const [metrics, setMetrics] = useState<ConfidenceMetrics>(defaultMetrics);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Nod detection tracking
    const lastHeadYRef = useRef<number | null>(null);
    const nodCountRef = useRef(0);
    const nodDirectionRef = useRef<'up' | 'down' | null>(null);
    const nodCooldownRef = useRef(false);

    // Aggregated scores for smoothing
    const smileScoresRef = useRef<number[]>([]);
    const eyeContactScoresRef = useRef<number[]>([]);
    const headPoseScoresRef = useRef<number[]>([]);

    // Simple check for browser support
    const isSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined';

    // Calculate distance between two landmarks
    const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // Calculate smile score from mouth landmarks
    const calculateSmileScore = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
        if (!landmarks || landmarks.length < 400) return 0;

        // Get mouth landmarks
        const leftCorner = landmarks[FACE_LANDMARKS.LEFT_MOUTH_CORNER];
        const rightCorner = landmarks[FACE_LANDMARKS.RIGHT_MOUTH_CORNER];
        const upperLip = landmarks[FACE_LANDMARKS.UPPER_LIP_TOP];
        const lowerLip = landmarks[FACE_LANDMARKS.LOWER_LIP_BOTTOM];

        // Calculate mouth width (wider = more smile)
        const mouthWidth = distance(leftCorner, rightCorner);

        // Calculate mouth height (open mouth)
        const mouthHeight = distance(upperLip, lowerLip);

        // Calculate smile ratio (wider and slightly open = smile)
        // Normal resting mouth has ratio around 0.2-0.3
        // Smile typically has ratio around 0.3-0.5
        const smileRatio = mouthWidth / (mouthHeight + 0.01);

        // Also check if corners are raised (y position relative to lip center)
        const lipCenterY = (upperLip.y + lowerLip.y) / 2;
        const leftCornerRaise = lipCenterY - leftCorner.y;
        const rightCornerRaise = lipCenterY - rightCorner.y;
        const cornerRaise = (leftCornerRaise + rightCornerRaise) / 2;

        // Combine metrics: high ratio + raised corners = smile
        let smileScore = 0;

        // Score based on width ratio (max ~40 points)
        if (smileRatio > 2.0) smileScore += 40;
        else if (smileRatio > 1.5) smileScore += 30;
        else if (smileRatio > 1.0) smileScore += 20;
        else smileScore += 10;

        // Score based on corner raise (max ~60 points)
        if (cornerRaise > 0.02) smileScore += 60;
        else if (cornerRaise > 0.01) smileScore += 45;
        else if (cornerRaise > 0.005) smileScore += 30;
        else if (cornerRaise > 0) smileScore += 15;

        return Math.min(100, Math.max(0, smileScore));
    }, []);

    // Calculate eye contact score from eye/iris landmarks
    const calculateEyeContactScore = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
        if (!landmarks || landmarks.length < 400) return 0;

        // Get eye landmarks
        const leftEyeInner = landmarks[FACE_LANDMARKS.LEFT_EYE_INNER];
        const leftEyeOuter = landmarks[FACE_LANDMARKS.LEFT_EYE_OUTER];
        const rightEyeInner = landmarks[FACE_LANDMARKS.RIGHT_EYE_INNER];
        const rightEyeOuter = landmarks[FACE_LANDMARKS.RIGHT_EYE_OUTER];

        // Calculate eye centers
        const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
        const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;

        // Check if iris landmarks are available (468+ landmarks)
        let irisDeviationLeft = 0;
        let irisDeviationRight = 0;

        if (landmarks.length > 470) {
            const leftIris = landmarks[FACE_LANDMARKS.LEFT_IRIS_CENTER];
            const rightIris = landmarks[FACE_LANDMARKS.RIGHT_IRIS_CENTER];

            // Calculate how centered the iris is in the eye
            irisDeviationLeft = Math.abs(leftIris.x - leftEyeCenterX);
            irisDeviationRight = Math.abs(rightIris.x - rightEyeCenterX);
        }

        // Also use face orientation for eye contact
        const noseTip = landmarks[FACE_LANDMARKS.NOSE_TIP];
        const faceCenter = 0.5; // Camera center

        // Calculate how centered the face is (looking at camera)
        const faceCenterDeviation = Math.abs(noseTip.x - faceCenter);

        // Combine iris position and face orientation
        const avgIrisDeviation = (irisDeviationLeft + irisDeviationRight) / 2;

        // Score: less deviation = higher score
        let eyeContactScore = 100;

        // Penalize for face not centered (looking away)
        if (faceCenterDeviation > 0.15) eyeContactScore -= 50;
        else if (faceCenterDeviation > 0.1) eyeContactScore -= 30;
        else if (faceCenterDeviation > 0.05) eyeContactScore -= 15;

        // Penalize for eyes not centered (if iris tracking available)
        if (landmarks.length > 470) {
            if (avgIrisDeviation > 0.05) eyeContactScore -= 40;
            else if (avgIrisDeviation > 0.03) eyeContactScore -= 25;
            else if (avgIrisDeviation > 0.02) eyeContactScore -= 10;
        }

        return Math.max(0, eyeContactScore);
    }, []);

    // Calculate head pose score and detect nods
    const calculateHeadPoseAndNods = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
        if (!landmarks || landmarks.length < 400) return { headPoseScore: 0, isNod: false };

        const noseTip = landmarks[FACE_LANDMARKS.NOSE_TIP];
        const forehead = landmarks[FACE_LANDMARKS.FOREHEAD_CENTER];
        const chin = landmarks[FACE_LANDMARKS.CHIN_CENTER];
        const leftCheek = landmarks[FACE_LANDMARKS.LEFT_CHEEK];
        const rightCheek = landmarks[FACE_LANDMARKS.RIGHT_CHEEK];

        // Calculate head tilt (roll) - left/right cheek y difference
        const rollAngle = Math.abs(leftCheek.y - rightCheek.y);

        // Calculate head pitch (up/down) - nose relative to face center
        const faceCenterY = (forehead.y + chin.y) / 2;
        const pitchDeviation = Math.abs(noseTip.y - faceCenterY);

        // Calculate head yaw (left/right turn) - nose x position
        const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
        const yawDeviation = Math.abs(noseTip.x - faceCenterX);

        // Head pose score: less deviation = higher score
        let headPoseScore = 100;

        if (rollAngle > 0.1) headPoseScore -= 30;
        else if (rollAngle > 0.05) headPoseScore -= 15;

        if (pitchDeviation > 0.15) headPoseScore -= 30;
        else if (pitchDeviation > 0.1) headPoseScore -= 15;

        if (yawDeviation > 0.15) headPoseScore -= 30;
        else if (yawDeviation > 0.1) headPoseScore -= 15;

        // Nod detection using nose Y position
        const currentHeadY = noseTip.y;
        let isNod = false;

        if (lastHeadYRef.current !== null && !nodCooldownRef.current) {
            const diff = currentHeadY - lastHeadYRef.current;
            const threshold = 0.015; // Adjust sensitivity

            if (diff > threshold && nodDirectionRef.current !== 'down') {
                nodDirectionRef.current = 'down';
            } else if (diff < -threshold && nodDirectionRef.current === 'down') {
                // Completed a down-up motion = one nod
                nodDirectionRef.current = 'up';
                nodCountRef.current++;
                isNod = true;

                // Cooldown to prevent rapid counting
                nodCooldownRef.current = true;
                setTimeout(() => {
                    nodCooldownRef.current = false;
                }, 500);
            }
        }
        lastHeadYRef.current = currentHeadY;

        return { headPoseScore: Math.max(0, headPoseScore), isNod };
    }, []);

    // Process face mesh results
    const onResults = useCallback((results: Results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // No face detected - set low scores
            setMetrics(prev => ({
                ...prev,
                smileScore: 0,
                eyeContactScore: 0,
                headPoseScore: 0,
            }));
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Calculate all metrics
        const smileScore = calculateSmileScore(landmarks);
        const eyeContactScore = calculateEyeContactScore(landmarks);
        const { headPoseScore } = calculateHeadPoseAndNods(landmarks);

        // Add to smoothing arrays
        smileScoresRef.current.push(smileScore);
        eyeContactScoresRef.current.push(eyeContactScore);
        headPoseScoresRef.current.push(headPoseScore);

        // Keep only last 10 samples for moving average
        if (smileScoresRef.current.length > 10) {
            smileScoresRef.current.shift();
            eyeContactScoresRef.current.shift();
            headPoseScoresRef.current.shift();
        }

        // Calculate moving averages for smooth display
        const avgSmile = smileScoresRef.current.reduce((a, b) => a + b, 0) / smileScoresRef.current.length;
        const avgEyeContact = eyeContactScoresRef.current.reduce((a, b) => a + b, 0) / eyeContactScoresRef.current.length;
        const avgHeadPose = headPoseScoresRef.current.reduce((a, b) => a + b, 0) / headPoseScoresRef.current.length;

        setMetrics({
            smileScore: Math.round(avgSmile),
            eyeContactScore: Math.round(avgEyeContact),
            nodCount: nodCountRef.current,
            headPoseScore: Math.round(avgHeadPose),
        });
    }, [calculateSmileScore, calculateEyeContactScore, calculateHeadPoseAndNods]);

    // Initialize MediaPipe Face Mesh
    const initFaceMesh = useCallback(async () => {
        try {
            const faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true, // Enables iris tracking (468 -> 478 landmarks)
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults(onResults);

            faceMeshRef.current = faceMesh;
            return faceMesh;
        } catch (err) {
            console.error('Failed to initialize FaceMesh:', err);
            setError('Failed to initialize face detection');
            return null;
        }
    }, [onResults]);

    const startAnalysis = useCallback(async (videoElement: HTMLVideoElement) => {
        if (!isSupported) {
            setError('Face analysis is not supported in this browser');
            return;
        }

        videoRef.current = videoElement;
        setIsAnalyzing(true);
        setError(null);

        // Reset metrics and tracking
        nodCountRef.current = 0;
        lastHeadYRef.current = null;
        nodDirectionRef.current = null;
        smileScoresRef.current = [];
        eyeContactScoresRef.current = [];
        headPoseScoresRef.current = [];

        try {
            // Initialize FaceMesh if not already done
            if (!faceMeshRef.current) {
                const faceMesh = await initFaceMesh();
                if (!faceMesh) return;
            }

            // Create camera to send frames to FaceMesh
            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (faceMeshRef.current && videoElement.readyState >= 2) {
                        await faceMeshRef.current.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480,
            });

            cameraRef.current = camera;
            camera.start();
        } catch (err) {
            console.error('Failed to start face analysis:', err);
            setError('Failed to start face analysis');
            setIsAnalyzing(false);
        }
    }, [isSupported, initFaceMesh]);

    const stopAnalysis = useCallback(() => {
        setIsAnalyzing(false);

        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
    }, []);

    const resetMetrics = useCallback(() => {
        setMetrics(defaultMetrics);
        nodCountRef.current = 0;
        lastHeadYRef.current = null;
        nodDirectionRef.current = null;
        smileScoresRef.current = [];
        eyeContactScoresRef.current = [];
        headPoseScoresRef.current = [];
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, []);

    return {
        metrics,
        isAnalyzing,
        isSupported,
        error,
        startAnalysis,
        stopAnalysis,
        resetMetrics,
    };
};
