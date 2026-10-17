import { useState, useRef, useEffect } from 'react';
import { User, Camera, Loader2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onUploadSuccess?: (newImageUrl: string) => void;
  apiEndpoint?: string;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onUploadSuccess,
  apiEndpoint = 'http://127.0.0.1:8004/api/v1/admin/staff-users/profile-picture',
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clean up object URL on unmount or when preview changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Trigger hidden file input click
  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  // Handle file selection and generate real-time preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setError(null);
    setSuccess(null);

    // Validate image format
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Optional size limit check (e.g., 5MB)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image size must be less than ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Revoke previous blob preview if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Real-time preview with URL.createObjectURL()
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  // Upload image to backend
  const handleImageUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) {
      setError('No image selected to upload.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      // 'file' is the standard parameter name for MultipartFile in Spring Boot
      formData.append('file', file);

      // NOTE: Do NOT set 'Content-Type': 'multipart/form-data'. 
      // The browser automatically sets it with the proper boundary parameter.
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to upload profile picture.');
      }

      setSuccess('Profile picture updated successfully!');
      setSelectedFile(null);

      // Notify parent component if callback provided
      if (onUploadSuccess && (data?.imageUrl || data?.url || data?.path)) {
        onUploadSuccess(data.imageUrl || data.url || data.path);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel selected preview and reset
  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-center sm:items-start space-y-4">
      {/* Clickable Avatar Container */}
      <div className="relative group">
        <div
          onClick={handleAvatarClick}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          title="Click to change profile picture"
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt="Staff Profile"
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback to placeholder if image URL fails to load
                setPreviewUrl(null);
              }}
            />
          ) : (
            /* Generic Placeholder Icon from lucide-react */
            <div className="flex flex-col items-center justify-center text-slate-400">
              <User className="w-16 h-16 sm:w-18 sm:h-18 stroke-[1.5]" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium">
            <Camera className="w-6 h-6 mb-1 drop-shadow" />
            <span>Change</span>
          </div>

          {/* Uploading Spinner Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-xs">
              <Loader2 className="w-7 h-7 animate-spin mb-1 text-blue-400" />
              <span>Uploading...</span>
            </div>
          )}
        </div>

        {/* Small Camera Badge Icon at bottom right */}
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploading}
          className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors focus:outline-none"
          title="Upload new picture"
          aria-label="Upload new picture"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Action Buttons when a new image is selected */}
      {selectedFile && !isUploading && (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleImageUpload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Save Photo
          </button>
          <button
            type="button"
            onClick={handleCancelPreview}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg max-w-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
