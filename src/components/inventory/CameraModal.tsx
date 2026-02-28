"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, ShieldCheck, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
    const t = useTranslations('camera');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');

    // Check permission status
    useEffect(() => {
        if (!isOpen) return;

        const checkPermission = async () => {
            if (!navigator.permissions || !navigator.permissions.query) {
                setPermissionState('prompt');
                return;
            }

            try {
                // Not all browsers support the 'camera' name in permissions.query
                const result = await navigator.permissions.query({ name: 'camera' as unknown as PermissionName });
                setPermissionState(result.state);

                result.onchange = () => {
                    setPermissionState(result.state);
                };
            } catch (error) {
                console.log("Permissions API not supported for camera, falling back to manual prompt", error);
                setPermissionState('prompt');
            }
        };

        checkPermission();
    }, [isOpen]);

    // Reset everything when the modal closes
    const handleClose = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraReady(false);
        setCapturedImage(null);
        setError(null);
        onClose();
    }, [stream, onClose]);

    // Acquisition Logic
    const startCamera = async () => {
        setIsCameraReady(false);
        setError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Your browser does not support camera access.");
            return;
        }

        try {
            const constraints = {
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setPermissionState('granted');
        } catch (err) {
            console.error("Camera Error:", err);
            const errorName = err instanceof Error ? err.name : '';
            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
                setPermissionState('denied');
                setError("Camera access denied. Please enable it in your browser settings to take photos.");
            } else if (errorName === 'NotFoundError') {
                setError("No camera found on this device.");
            } else {
                setError(`Could not start camera: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        }
    };

    // Automatically try to start if permission is already granted or if we should prompt
    useEffect(() => {
        if (isOpen && (permissionState === 'granted' || permissionState === 'prompt') && !stream && !error && !capturedImage) {
            startCamera();
        }
    }, [isOpen, permissionState, stream, error, capturedImage]);

    // Effect to bind stream to video element
    useEffect(() => {
        let mounted = true;

        // Use a timeout to ensure the video element has had a chance to render
        const timer = setTimeout(() => {
            const videoElement = videoRef.current;
            if (stream && videoElement && !capturedImage && mounted) {
                videoElement.srcObject = stream;

                const handleCanPlay = async () => {
                    if (!mounted) return;
                    try {
                        await videoElement.play();
                        setIsCameraReady(true);
                    } catch (e) {
                        console.error("Video play failed:", e);
                    }
                };

                videoElement.addEventListener('canplay', handleCanPlay);
                // If it's already ready
                if (videoElement.readyState >= 2) {
                    handleCanPlay();
                }

                return () => {
                    videoElement.removeEventListener('canplay', handleCanPlay);
                };
            }
        }, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [stream, capturedImage, permissionState]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 640;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
                if (stream) {
                    stream.getTracks().forEach(t => t.stop());
                    setStream(null);
                }
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    handleClose();
                });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md w-full max-w-[95vw] h-auto bg-card border-border text-foreground overflow-hidden shadow-2xl p-0 sm:p-6 rounded-2xl flex flex-col gap-2 sm:gap-4">
                <DialogHeader className="p-3 sm:p-4 sm:pb-4 flex-row items-center justify-between space-y-0 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-xl text-foreground font-bold">
                        <Camera className="size-4 sm:size-6 text-primary" />
                        Capture Photo
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-square w-full overflow-hidden bg-black rounded-xl">
                    {/* Permission Request Landing */}
                    {permissionState === 'prompt' && !stream && !error && (
                        <div className="text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 z-30">
                            <div className="bg-primary/10 p-6 rounded-full inline-block">
                                <ShieldCheck className="size-16 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">Camera Permission</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We need access to your camera to take a photo of the item.
                                </p>
                            </div>
                            <Button
                                onClick={startCamera}
                                className="w-full bg-primary hover:brightness-95 text-primary-foreground font-bold h-12 rounded-xl text-md shadow-lg shadow-primary/20"
                            >
                                Grant Access
                            </Button>
                        </div>
                    )}

                    {/* Denied / Error State */}
                    {(permissionState === 'denied' || error) && (
                        <div className="text-center p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 z-30">
                            <div className="bg-destructive/10 p-6 rounded-full inline-block">
                                <Lock className="size-16 text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-destructive">Access Restricted</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto font-medium">
                                    {error || "Access was denied. Please allow camera access in settings."}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={startCamera}
                                className="w-full border-border text-foreground hover:bg-primary/10 hover:border-primary/30 h-11 transition-all"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Live Camera View or Captured Preview */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover animate-in fade-in scale-105 duration-500" />
                        ) : permissionState === 'granted' && !error && (
                            <>
                                {!isCameraReady && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-muted z-20">
                                        <div className="size-10 border-2 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-xs text-muted-foreground font-bold ">{t('connecting')}</p>
                                    </div>
                                )}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
                                />
                                {isCameraReady && (
                                    <div className="absolute inset-0 pointer-events-none z-10 border-[1px] border-white/5">
                                        <div className="absolute top-1/3 left-0 w-full h-[0.5px] bg-white/10"></div>
                                        <div className="absolute top-2/3 left-0 w-full h-[0.5px] bg-white/10"></div>
                                        <div className="absolute top-0 left-1/3 w-[0.5px] h-full bg-white/10"></div>
                                        <div className="absolute top-0 left-2/3 w-[0.5px] h-full bg-white/10"></div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className={`p-4 sm:p-6 flex-row items-center justify-center gap-3 sm:gap-6 ${permissionState === 'prompt' || permissionState === 'denied' ? 'hidden' : ''}`}>
                    {capturedImage ? (
                        <div className="flex w-full gap-3 sm:gap-4 max-w-sm">
                            <Button
                                variant="outline"
                                onClick={() => { setCapturedImage(null); startCamera(); }}
                                className="flex-1 bg-muted/50 border-border text-foreground h-12 sm:h-14 rounded-xl sm:rounded-2xl hover:bg-muted font-bold transition-all text-xs sm:text-base"
                            >
                                <RefreshCw className="size-4 sm:size-5 mr-1.5 sm:mr-2" /> Retake
                            </Button>
                            <Button
                                onClick={confirmPhoto}
                                className="flex-1 bg-primary hover:brightness-95 text-primary-foreground font-bold h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] text-xs sm:text-base"
                            >
                                <Check className="size-4 sm:size-5 mr-1.5 sm:mr-2" /> Use Photo
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-center">
                            {isCameraReady && (
                                <Button
                                    onClick={capturePhoto}
                                    className="bg-white hover:bg-amber-50 text-slate-950 rounded-full size-16 sm:size-20 p-0 shadow-2xl border-[4px] sm:border-[6px] border-white/20 transform active:scale-90 transition-all flex items-center justify-center"
                                >
                                    <div className="size-10 sm:size-14 rounded-full border-2 border-black/5 flex items-center justify-center">
                                        <div className="size-8 sm:size-12 rounded-full bg-black/5"></div>
                                    </div>
                                </Button>
                            )}
                        </div>
                    )}
                </DialogFooter>
                <canvas ref={canvasRef} className="hidden" />
            </DialogContent>
        </Dialog>
    );
}
