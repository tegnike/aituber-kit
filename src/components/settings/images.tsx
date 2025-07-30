import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import useImagesStore, { UploadedImage } from '@/features/stores/images'
import { TextButton } from '../textButton'
import menuStore from '@/features/stores/menu'
import toastStore from '@/features/stores/toast'
import { IMAGE_CONSTANTS } from '@/constants/images'
import { compressImageFile } from '@/utils/imageCompression'

const Images = () => {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const {
    uploadedImages,
    placedImages,
    setUploadedImages,
    addUploadedImage,
    removeUploadedImage,
    addPlacedImage,
    removePlacedImage,
    updateImageLayerPosition,
    reorderPlacedImages,
    reorderAllLayers,
    getAllLayerItems,
  } = useImagesStore()

  const { addToast } = toastStore()

  // Fetch uploaded images on component mount
  const fetchUploadedImages = useCallback(async () => {
    try {
      const response = await fetch('/api/get-image-list')
      if (response.ok) {
        const images: UploadedImage[] = await response.json()
        setUploadedImages(
          images.map((img) => ({
            ...img,
            uploadedAt: new Date(img.uploadedAt),
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch uploaded images:', error)
    }
  }, [setUploadedImages])

  useEffect(() => {
    fetchUploadedImages()
  }, [fetchUploadedImages])

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Check file type
    if (!file.type.startsWith('image/')) {
      addToast({
        message: t('OnlyImageFilesAllowed'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.SHORT,
      })
      return
    }

    // Check file size
    if (file.size > IMAGE_CONSTANTS.MAX_FILE_SIZE) {
      addToast({
        message: t('FileSizeTooLarge'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.SHORT,
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(t('Uploading'))

    try {
      // Compress image if needed
      let fileToUpload = file
      if (file.size > IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD) {
        setUploadProgress(t('Compressing'))
        try {
          fileToUpload = await compressImageFile(file)
        } catch (compressionError) {
          console.warn(
            'Image compression failed, uploading original:',
            compressionError
          )
        }
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

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
        addToast({
          message: t('UploadFailed') + ': ' + error.message,
          type: 'error',
          duration: IMAGE_CONSTANTS.TOAST_DURATION.LONG,
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      addToast({
        message: t('UploadFailed'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.LONG,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  const handleAddToDisplay = (image: UploadedImage) => {
    if (placedImages.length >= IMAGE_CONSTANTS.MAX_PLACED_IMAGES) {
      addToast({
        message: t('MaximumFiveImagesAllowed'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.SHORT,
      })
      return
    }

    if (placedImages.some((placed) => placed.filename === image.filename)) {
      addToast({
        message: t('ImageAlreadyPlaced'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.SHORT,
      })
      return
    }

    addPlacedImage(image.filename, image.path)
  }

  const handleRemoveFromDisplay = (id: string) => {
    removePlacedImage(id)
  }

  const handleDeleteUploadedImage = async (filename: string) => {
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      })

      if (response.ok) {
        // Remove from state
        removeUploadedImage(filename)

        // Also remove from display if it's currently placed
        const placedImage = placedImages.find(
          (img) => img.filename === filename
        )
        if (placedImage) {
          removePlacedImage(placedImage.id)
        }
      } else {
        const error = await response.json()
        addToast({
          message: t('DeleteFailed') + ': ' + error.message,
          type: 'error',
          duration: IMAGE_CONSTANTS.TOAST_DURATION.LONG,
        })
      }
    } catch (error) {
      console.error('Delete failed:', error)
      addToast({
        message: t('DeleteFailed'),
        type: 'error',
        duration: IMAGE_CONSTANTS.TOAST_DURATION.LONG,
      })
    }
  }

  const handleToggleLayerPosition = (
    id: string,
    currentBehindCharacter: boolean
  ) => {
    updateImageLayerPosition(id, !currentBehindCharacter)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const startIndex = result.source.index
    const endIndex = result.destination.index

    if (startIndex !== endIndex) {
      reorderAllLayers(startIndex, endIndex)
    }
  }

  const layerItems = getAllLayerItems()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">{t('ImageSettings')}</h3>
        <p className="text-sm mb-4">{t('ImageSettingsDescription')}</p>
      </div>

      {/* Upload Section */}
      <div className="rounded-lg my-4 space-y-4">
        <div className="my-4">
          <TextButton
            onClick={() => {
              const { fileInput } = menuStore.getState()
              if (fileInput) {
                fileInput.accept = 'image/*'
                fileInput.onchange = (e) => {
                  const syntheticEvent = {
                    ...e,
                    target: e.target as HTMLInputElement,
                    currentTarget: e.target as HTMLInputElement,
                    nativeEvent: e,
                    bubbles: e.bubbles,
                    cancelable: e.cancelable,
                    defaultPrevented: e.defaultPrevented,
                    eventPhase: e.eventPhase,
                    isTrusted: e.isTrusted,
                    timeStamp: e.timeStamp,
                    type: e.type,
                    isDefaultPrevented: () => e.defaultPrevented,
                    isPropagationStopped: () => false,
                    persist: () => {},
                    preventDefault: e.preventDefault.bind(e),
                    stopPropagation: e.stopPropagation.bind(e),
                  } as React.ChangeEvent<HTMLInputElement>
                  handleFileUpload(syntheticEvent)
                }
                fileInput.click()
              }
            }}
            disabled={isUploading}
          >
            {t('UploadImages')}
          </TextButton>
        </div>

        {isUploading && (
          <div className="text-sm text-primary">{uploadProgress}</div>
        )}

        <p className="text-xs opacity-60">
          {t('SupportedFormats')}: JPG, PNG, GIF, WebP (最大100MB)
        </p>
      </div>

      {/* Uploaded Images Gallery */}
      <div className="border border-white rounded-lg my-4 p-4">
        <h4 className="font-semibold mb-4">
          {t('UploadedImages')} ({uploadedImages.length})
        </h4>

        {uploadedImages.length === 0 ? (
          <p className="opacity-60 text-sm">{t('NoUploadedImages')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image) => {
              const isPlaced = placedImages.some(
                (placed) => placed.filename === image.filename
              )

              return (
                <div key={image.filename} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-white">
                    <img
                      src={image.path}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="mt-2">
                    <p
                      className="text-xs opacity-60 truncate"
                      title={image.filename}
                    >
                      {image.filename}
                    </p>

                    <div className="space-y-1">
                      <button
                        onClick={() => handleAddToDisplay(image)}
                        disabled={
                          isPlaced ||
                          placedImages.length >=
                            IMAGE_CONSTANTS.MAX_PLACED_IMAGES
                        }
                        className={`w-full text-xs py-1 px-2 rounded text-theme ${
                          isPlaced
                            ? 'bg-secondary bg-opacity-20 cursor-not-allowed'
                            : placedImages.length >=
                                IMAGE_CONSTANTS.MAX_PLACED_IMAGES
                              ? 'bg-white bg-opacity-50 opacity-70 cursor-not-allowed'
                              : 'bg-primary bg-opacity-20 hover:bg-primary hover:bg-opacity-30'
                        }`}
                      >
                        {isPlaced ? t('AlreadyDisplayed') : t('AddToDisplay')}
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteUploadedImage(image.filename)
                        }
                        className="w-full text-xs py-1 px-2 rounded text-theme bg-secondary bg-opacity-20 hover:bg-secondary hover:bg-opacity-30"
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Layer Order Management */}
      <div className="border border-white rounded-lg p-4">
        <h4 className="font-semibold mb-4">{t('LayerOrder')}</h4>
        <p className="text-s mb-4">{t('LayerOrderDescription')}</p>

        {layerItems.length === 1 ? (
          <div className="space-y-3">
            {/* Character only */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="flex-shrink-0 p-1 text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z" />
                </svg>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-theme"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {t('CharacterLayer')}
                </p>
                <p className="text-xs text-gray-600">z-index: 5 (固定)</p>
              </div>
              <span className="text-xs opacity-70 flex-shrink-0">#1</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Top Label */}
            <div className="text-xs opacity-70 text-center mb-2 py-1 border-b border-dashed">
              {t('BottomLayer')}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="all-layers">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {layerItems.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={false}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                              snapshot.isDragging
                                ? 'shadow-lg bg-primary bg-opacity-10'
                                : item.type === 'character'
                                  ? 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
                                  : 'bg-white bg-opacity-50 hover:bg-white hover:bg-opacity-70'
                            }`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex-shrink-0 p-1 transition-opacity cursor-grab active:cursor-grabbing text-opacity-60 hover:text-opacity-100"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                {item.type === 'character' ? (
                                  <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z" />
                                ) : (
                                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                                )}
                              </svg>
                            </div>

                            {/* Thumbnail */}
                            <div
                              className={`w-12 h-12 rounded flex-shrink-0 flex items-center justify-center ${
                                item.type === 'character'
                                  ? 'bg-primary'
                                  : 'bg-white overflow-hidden'
                              }`}
                            >
                              {item.type === 'character' ? (
                                <svg
                                  className="w-6 h-6 text-theme"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                              ) : (
                                <img
                                  src={item.path}
                                  alt={item.filename}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    item.type === 'character'
                                      ? 'text-gray-700'
                                      : ''
                                  }`}
                                >
                                  {item.type === 'character'
                                    ? t('CharacterLayer')
                                    : item.filename}
                                </p>
                                <span className="text-xs opacity-70 flex-shrink-0">
                                  #{index + 1}
                                </span>
                              </div>
                              {item.type === 'character' ? (
                                <p className="text-xs text-gray-600">
                                  z-index: 5 (固定)
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs opacity-60">
                                    {t('Position')}:{' '}
                                    {Math.round(item.position?.x || 0)},{' '}
                                    {Math.round(item.position?.y || 0)} |{' '}
                                    {t('Size')}:{' '}
                                    {Math.round(item.size?.width || 0)}×
                                    {Math.round(item.size?.height || 0)}
                                  </p>
                                  <p className="text-xs opacity-60">
                                    z-index: {item.zIndex} (
                                    {item.behindCharacter
                                      ? t('BehindCharacter')
                                      : t('InFrontOfCharacter')}
                                    )
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            {item.type === 'image' && (
                              <button
                                onClick={() => handleRemoveFromDisplay(item.id)}
                                className="text-secondary hover:text-secondary-hover text-sm flex-shrink-0"
                              >
                                {t('Remove')}
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Bottom Label */}
            <div className="text-xs opacity-70 text-center mt-2 py-1 border-t border-dashed">
              {t('TopLayer')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Images
