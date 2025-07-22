import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../iconButton'
import useImagesStore, { UploadedImage } from '@/features/stores/images'

const Images = () => {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  
  const {
    uploadedImages,
    placedImages,
    setUploadedImages,
    addUploadedImage,
    addPlacedImage,
    removePlacedImage,
  } = useImagesStore()

  // Fetch uploaded images on component mount
  const fetchUploadedImages = useCallback(async () => {
    try {
      const response = await fetch('/api/get-image-list')
      if (response.ok) {
        const images: UploadedImage[] = await response.json()
        setUploadedImages(images.map(img => ({
          ...img,
          uploadedAt: new Date(img.uploadedAt)
        })))
      }
    } catch (error) {
      console.error('Failed to fetch uploaded images:', error)
    }
  }, [setUploadedImages])

  useEffect(() => {
    fetchUploadedImages()
  }, [fetchUploadedImages])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert(t('OnlyImageFilesAllowed'))
      return
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert(t('FileSizeTooLarge'))
      return
    }

    setIsUploading(true)
    setUploadProgress(t('Uploading'))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const newImage: UploadedImage = {
          filename: result.filename,
          path: result.path,
          uploadedAt: new Date(),
        }
        addUploadedImage(newImage)
        setUploadProgress(t('UploadComplete'))
        
        // Clear the input
        event.target.value = ''
      } else {
        const error = await response.json()
        alert(t('UploadFailed') + ': ' + error.message)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert(t('UploadFailed'))
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  const handleAddToDisplay = (image: UploadedImage) => {
    if (placedImages.length >= 5) {
      alert(t('MaximumFiveImagesAllowed'))
      return
    }
    
    if (placedImages.some(placed => placed.filename === image.filename)) {
      alert(t('ImageAlreadyPlaced'))
      return
    }

    addPlacedImage(image.filename, image.path)
  }

  const handleRemoveFromDisplay = (id: string) => {
    removePlacedImage(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">{t('ImageSettings')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('ImageSettingsDescription')}
        </p>
      </div>

      {/* Upload Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold">{t('UploadImages')}</h4>
        
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>

        {isUploading && (
          <div className="text-sm text-blue-600">
            {uploadProgress}
          </div>
        )}

        <p className="text-xs text-gray-500">
          {t('SupportedFormats')}: JPG, PNG, GIF, WebP (最大100MB)
        </p>
      </div>

      {/* Uploaded Images Gallery */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-4">
          {t('UploadedImages')} ({uploadedImages.length})
        </h4>
        
        {uploadedImages.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('NoUploadedImages')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image) => {
              const isPlaced = placedImages.some(placed => placed.filename === image.filename)
              
              return (
                <div key={image.filename} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.path}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 truncate" title={image.filename}>
                      {image.filename}
                    </p>
                    
                    <button
                      onClick={() => handleAddToDisplay(image)}
                      disabled={isPlaced || placedImages.length >= 5}
                      className={`mt-1 w-full text-xs py-1 px-2 rounded ${
                        isPlaced 
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : placedImages.length >= 5
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {isPlaced ? t('AlreadyDisplayed') : t('AddToDisplay')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Currently Displayed Images */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-4">
          {t('CurrentlyDisplayedImages')} ({placedImages.length}/5)
        </h4>
        
        {placedImages.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('NoDisplayedImages')}</p>
        ) : (
          <div className="space-y-3">
            {placedImages.map((image) => (
              <div key={image.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={image.path}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{image.filename}</p>
                  <p className="text-xs text-gray-500">
                    {t('Position')}: {Math.round(image.position.x)}, {Math.round(image.position.y)} | 
                    {t('Size')}: {Math.round(image.size.width)}×{Math.round(image.size.height)}
                  </p>
                </div>
                
                <button
                  onClick={() => handleRemoveFromDisplay(image.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  {t('Remove')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">{t('Instructions')}</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t('InstructionUpload')}</li>
          <li>• {t('InstructionSelect')}</li>
          <li>• {t('InstructionDrag')}</li>
          <li>• {t('InstructionResize')}</li>
          <li>• {t('InstructionAutoSave')}</li>
        </ul>
      </div>
    </div>
  )
}

export default Images