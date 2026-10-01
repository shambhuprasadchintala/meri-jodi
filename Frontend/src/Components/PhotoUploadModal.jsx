import { useState, useRef, useEffect } from "react"
import { X, Upload, Trash2, Star, Image as ImageIcon, Check, Eye, EyeOff, Lock, Shield } from "lucide-react"
import { uploadPhoto, deletePhoto, setPrimaryPhoto } from "../api/photoApi"
import { updateProfile } from "../api/profileApi"
import ConfirmModal from "./ConfirmModal"

export default function PhotoUploadModal({ isOpen, photos = [], isPhotoHidden = false, onClose, onPhotosUpdated }) {
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState("")
    const [isPrimary, setIsPrimary] = useState(false)
    const [photoHidden, setPhotoHidden] = useState(isPhotoHidden)
    const [privacyLoading, setPrivacyLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [deletePhotoId, setDeletePhotoId] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        setPhotoHidden(Boolean(isPhotoHidden))
    }, [isPhotoHidden, isOpen])

    if (!isOpen) return null

    const handleTogglePrivacy = async () => {
        setPrivacyLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            const nextVal = !photoHidden
            const res = await updateProfile({ isPhotoHidden: nextVal })
            setPhotoHidden(nextVal)
            setSuccessMsg(nextVal ? "Photos hidden from other members" : "Photos visible to other members")
            if (onPhotosUpdated) onPhotosUpdated(res)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update photo privacy.")
        } finally {
            setPrivacyLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file (JPG, PNG, WebP).")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB.")
            return
        }

        setError("")
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            const updatedProfile = await uploadPhoto(selectedFile, { isPrimary })
            setSuccessMsg("Photo uploaded successfully!")
            setSelectedFile(null)
            setPreviewUrl("")
            setIsPrimary(false)
            if (onPhotosUpdated) onPhotosUpdated(updatedProfile)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload photo.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (photoId) => {
        setDeletePhotoId(photoId)
    }

    const performDelete = async () => {
        if (!deletePhotoId) return
        setLoading(true)
        setError("")
        try {
            const updatedProfile = await deletePhoto(deletePhotoId)
            setDeletePhotoId(null)
            if (onPhotosUpdated) onPhotosUpdated(updatedProfile)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete photo.")
        } finally {
            setLoading(false)
        }
    }

    const handleSetPrimary = async (photoId) => {
        setLoading(true)
        setError("")
        try {
            const updatedProfile = await setPrimaryPhoto(photoId)
            if (onPhotosUpdated) onPhotosUpdated(updatedProfile)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to set primary photo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#FFE4E8]">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#842029]">
                            <ImageIcon size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#842029] font-serif">
                                Manage Profile Photos
                            </h2>
                            <p className="text-xs text-gray-500">
                                Upload up to 6 high-quality photos ({photos.length}/6 uploaded)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm flex items-center gap-2">
                            <Check size={16} /> {successMsg}
                        </div>
                    )}

                    {/* Photo Privacy Toggle Card */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${photoHidden ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-[#842029]'}`}>
                                {photoHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Hide Photos from Other Members
                                    </h4>
                                    {photoHidden && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                            Hidden
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {photoHidden
                                        ? "Your photos are currently hidden from other users on MeriJodi."
                                        : "Your photos are visible to prospective matches."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleTogglePrivacy}
                            disabled={privacyLoading}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                photoHidden ? 'bg-[#842029]' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    photoHidden ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Upload Section */}
                    {photos.length < 6 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#842029] transition-colors bg-gray-50/50">
                            {previewUrl ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-xl shadow-md border"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isPrimary}
                                                onChange={(e) => setIsPrimary(e.target.checked)}
                                                className="rounded text-[#842029] focus:ring-[#842029]"
                                            />
                                            Set as primary display photo
                                        </label>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null)
                                                setPreviewUrl("")
                                            }}
                                            className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-full hover:bg-gray-100"
                                        >
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUpload}
                                            disabled={loading}
                                            className="px-6 py-1.5 text-xs font-semibold bg-[#842029] text-white rounded-full hover:bg-[#6b1b27] shadow-sm disabled:opacity-50"
                                        >
                                            {loading ? "Uploading..." : "Confirm & Upload"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#842029]">
                                        <Upload size={22} />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Click to upload a new photo
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        PNG, JPG, WebP up to 5MB
                                    </p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Existing Photos Grid */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">
                            Your Current Photos
                        </h3>
                        {photos.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No photos uploaded yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {photos.map((photo) => {
                                    const photoId = photo._id || photo.id
                                    return (
                                        <div
                                            key={photoId}
                                            className="relative group rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-square bg-gray-100"
                                        >
                                            <img
                                                src={photo.url}
                                                alt="Profile Photo"
                                                className="w-full h-full object-cover"
                                            />
                                            {photo.isPrimary && (
                                                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#842029] text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                                                    <Star size={10} fill="currentColor" /> Primary
                                                </div>
                                            )}
                                            {/* Hover Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                                {!photo.isPrimary && (
                                                    <button
                                                        onClick={() => handleSetPrimary(photoId)}
                                                        disabled={loading}
                                                        title="Set as Primary"
                                                        className="p-2 bg-white text-[#842029] rounded-full hover:bg-gray-100 transition-colors shadow"
                                                    >
                                                        <Star size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(photoId)}
                                                    disabled={loading}
                                                    title="Delete Photo"
                                                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(deletePhotoId)}
                title="Delete Photo"
                message="Are you sure you want to remove this profile photo? This cannot be undone."
                confirmText="Delete"
                cancelText="Keep Photo"
                type="danger"
                loading={loading}
                onConfirm={performDelete}
                onCancel={() => setDeletePhotoId(null)}
            />
        </div>
    )
}
