import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface WebcamFeedProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isActive: boolean;
    isLoading: boolean;
    error: string | null;
    hasPermission: boolean | null;
    onToggle: () => void;
    showPrivacyToggle?: boolean;
    className?: string;
}

const WebcamFeed: React.FC<WebcamFeedProps> = ({
    videoRef,
    isActive,
    isLoading,
    error,
    hasPermission,
    onToggle,
    showPrivacyToggle = true,
    className = '',
}) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 ${className}`}>
            {/* Video Feed */}
            <div className="aspect-video relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                />

                {/* Overlay when camera is off */}
                <AnimatePresence>
                    {!isActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-3" />
                                    <p className="text-gray-400 text-sm">Starting camera...</p>
                                </>
                            ) : error ? (
                                <>
                                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                                    <p className="text-red-400 text-sm text-center px-4">{error}</p>
                                    <button
                                        onClick={onToggle}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </>
                            ) : (
                                <>
                                    <CameraOff className="w-12 h-12 text-gray-500 mb-3" />
                                    <p className="text-gray-400 text-sm">Camera is off</p>
                                    <button
                                        onClick={onToggle}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Enable Camera
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recording indicator */}
                {isActive && (
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-3 h-3 bg-red-500 rounded-full"
                        />
                        <span className="text-white text-xs font-medium">LIVE</span>
                    </div>
                )}

                {/* Privacy toggle */}
                {showPrivacyToggle && isActive && (
                    <button
                        onClick={onToggle}
                        className="absolute top-3 right-3 p-2 bg-gray-900/70 hover:bg-gray-800/90 rounded-lg transition-colors group"
                        title="Turn off camera"
                    >
                        <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                )}
            </div>

            {/* Camera Status Bar */}
            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isActive ? (
                        <>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-green-400 text-xs">Camera Active</span>
                        </>
                    ) : hasPermission === false ? (
                        <>
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-red-400 text-xs">Permission Denied</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                            <span className="text-gray-400 text-xs">Camera Off</span>
                        </>
                    )}
                </div>

                {isActive && (
                    <span className="text-gray-500 text-xs">
                        Click 👁️ to hide
                    </span>
                )}
            </div>
        </div>
    );
};

export default WebcamFeed;
