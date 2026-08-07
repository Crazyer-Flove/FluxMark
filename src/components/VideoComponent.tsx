import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Play, Pause, FastForward, Scissors, Settings2, Trash2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMediaBlobUrl } from '../utils/mediaRegistry';

export const VideoComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const { src, playbackSpeed, startPos, endPos } = node.attrs;
  const resolvedSrc = getMediaBlobUrl(src) || src;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      // Handle "Trimming" - loop back to start if we exceed endPos
      if (endPos !== null && current >= endPos) {
        videoRef.current.currentTime = startPos;
      }
      if (current < startPos) {
        videoRef.current.currentTime = startPos;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (endPos === null) {
        queueMicrotask(() => {
          updateAttributes({ endPos: dur });
        });
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <NodeViewWrapper 
      className="video-node-view my-8 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm transition-all hover:shadow-md mx-auto"
      style={{ width: node.attrs.width || '100%', maxWidth: '100%' }}
    >
      <div className="relative group">
        <video
          ref={videoRef}
          src={resolvedSrc}
          className="w-full block bg-black"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
        />
        
        {/* Simple Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              title={isPlaying ? "暂停" : "播放"}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-90"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <span className="text-white text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              title="视频选项"
              className={`p-2 rounded-lg backdrop-blur-md transition-all ${showSettings ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              <Settings2 size={16} />
            </button>
            <button 
              onClick={() => deleteNode()}
              title="删除视频"
              className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 backdrop-blur-md transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 bg-white p-4 space-y-4"
          >
            {/* Playback Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 size={12} />
                  视频宽度 ({node.attrs.width || '100%'})
                </label>
              </div>
              <div className="flex gap-2">
                {['25%', '50%', '75%', '100%'].map(w => (
                  <button
                    key={w}
                    onClick={() => updateAttributes({ width: w })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      node.attrs.width === w 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <input 
                type="range"
                min={10}
                max={100}
                step={5}
                value={parseInt(node.attrs.width) || 100}
                onChange={(e) => updateAttributes({ width: `${e.target.value}%` })}
                className="w-full accent-blue-600 mt-1"
              />
            </div>

            {/* Playback Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FastForward size={12} />
                  播放速度 ({playbackSpeed}x)
                </label>
              </div>
              <div className="flex gap-2">
                {[0.5, 1, 1.5, 2, 3].map(speed => (
                  <button
                    key={speed}
                    onClick={() => updateAttributes({ playbackSpeed: speed })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      playbackSpeed === speed 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Trimming (Start/End) */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors size={12} />
                视频裁剪 (视觉预览)
              </label>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>起点: {formatTime(startPos)}</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={startPos}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateAttributes({ startPos: val });
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>终点: {formatTime(endPos || duration)}</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={endPos || duration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateAttributes({ endPos: val });
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 text-[10px] text-slate-400 italic">
              * 裁剪功能仅限应用内播放时限制起终点，不会修改原始文件。
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NodeViewWrapper>
  );
};
