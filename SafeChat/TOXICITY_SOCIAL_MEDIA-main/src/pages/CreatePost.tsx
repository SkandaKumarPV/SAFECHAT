import { ImagePlus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { avatarPlaceholder } from '../lib/placeholders';
import { postPlaceholder } from '../lib/placeholders';

export default function CreatePost() {
  const { user, token } = useAuth();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleShare = async () => {
    if (!token) {
      setError('Please log in to create a post.');
      return;
    }
    if (!caption.trim()) {
      setError('Caption cannot be empty.');
      return;
    }
    try {
      setError(null);
      await api.createPost({ content: caption.trim(), image_url: image }, token);
      setCaption('');
      setImage(null);
      setSuccess('Post shared successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share post');
    }
  };

  const username = user?.username || 'guest';
  const avatar = user?.avatar_url || avatarPlaceholder(username);

  return (
    <div className="max-w-[600px] mx-auto pt-8 px-4 flex min-h-screen items-center justify-center">
      <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-lg">
        <header className="h-11 border-b border-outline-variant flex items-center justify-center bg-surface-container-lowest">
          <h1 className="font-bold text-sm">Create new post</h1>
        </header>

        <div className="p-12 space-y-8">
          <div 
            className="w-full aspect-square border-2 border-dashed border-outline-variant bg-surface-container-low rounded-xl flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-surface-container transition-colors"
            onClick={() => setImage(postPlaceholder('new-post'))}
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover rounded-lg" alt="Upload" />
            ) : (
              <>
                <ImagePlus className="w-16 h-16 text-outline mb-4" />
                <p className="text-xl font-display mb-6">Drag photos and videos here</p>
                <button className="h-11 px-8 bg-primary-container text-white font-bold rounded-lg">
                  Select from computer
                </button>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={avatar} className="w-8 h-8 rounded-full border border-outline-variant" alt="Avatar" />
              <span className="font-bold text-sm">{username}</span>
            </div>
            
            <div className="relative">
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[120px] p-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary-container resize-none" 
                placeholder="Write a caption..."
              />
              
              {/* Live Toxicity Check Simulation */}
              {caption.length > 5 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-200"
                >
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Caption Safe</span>
                </motion.div>
              )}
            </div>

            {error && (
              <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs text-green-700 bg-green-100 border border-green-200 rounded-lg px-3 py-2">
                {success}
              </div>
            )}
            <button
              onClick={handleShare}
              className="w-full h-11 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
