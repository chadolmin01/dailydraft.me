'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string // e.g., "image/*,.pdf"
  multiple?: boolean
  maxSize?: number // bytes
  maxFiles?: number
  className?: string
  children?: React.ReactNode
}

interface UploadedFile {
  file: File
  id: string
  preview?: string
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept = '*',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  className = '',
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const validFiles: File[] = []
    const fileArray = Array.from(fileList)

    setError(null)

    for (const file of fileArray) {
      // Check max files
      if (files.length + validFiles.length >= maxFiles) {
        setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`)
        break
      }

      // Check file size
      if (file.size > maxSize) {
        setError(`파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다`)
        continue
      }

      // Check file type if accept is specified
      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map(t => t.trim())
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'))
          }
          return file.type === type
        })

        if (!isAccepted) {
          setError(`허용되지 않는 파일 형식입니다`)
          continue
        }
      }

      validFiles.push(file)
    }

    return validFiles
  }, [accept, files.length, maxFiles, maxSize])

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const validFiles = validateFiles(fileList)

    if (validFiles.length === 0) return

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles.map(f => f.file))
  }, [files, multiple, onFilesSelected, validateFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFiles])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id)
      // Clean up preview URL
      const removed = prev.find(f => f.id === id)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      onFilesSelected(updated.map(f => f.file))
      return updated
    })
    setError(null)
  }, [onFilesSelected])

  const clearAll = useCallback(() => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setError(null)
    onFilesSelected([])
  }, [files, onFilesSelected])

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        {children || (
          <div className="space-y-2">
            <Upload
              size={32}
              className={`mx-auto ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">클릭</span>하거나{' '}
              <span className="font-medium text-gray-900">파일을 드래그</span>하세요
            </p>
            <p className="text-xs text-gray-400">
              최대 {formatFileSize(maxSize)} · {multiple ? `최대 ${maxFiles}개` : '1개'}
            </p>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <p className="text-sm font-medium text-blue-600">여기에 놓으세요</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-500 uppercase">
              {files.length}개 파일 선택됨
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearAll()
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              전체 삭제
            </button>
          </div>

          <div className="space-y-2">
            {files.map(({ file, id, preview }) => (
              <div
                key={id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <File size={20} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(id)
                  }}
                  aria-label="파일 삭제"
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X size={16} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileDropZone
