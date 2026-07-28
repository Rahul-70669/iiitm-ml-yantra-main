import { useState, useCallback } from 'react'
import Icon from '../../atoms/Icon'
import Button from '../../atoms/Button'
import { Card } from '../../molecules/Card'

export interface FileUploaderProps {
    onFileSelect: (file: File) => void
    acceptedFormats?: string[]
    maxSizeMB?: number
    className?: string
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onFileSelect,
    acceptedFormats = ['.csv'],
    maxSizeMB = 200,
    className = '',
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const validateFile = useCallback(
        (file: File): boolean => {
            setError(null)

            // Check file type
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
            if (!acceptedFormats.includes(fileExtension)) {
                setError(
                    `Invalid file type. Please upload ${acceptedFormats.join(', ')} files only.`
                )
                return false
            }

            // Check file size
            const fileSizeMB = file.size / (1024 * 1024)
            if (fileSizeMB > maxSizeMB) {
                setError(`File size exceeds ${maxSizeMB}MB limit.`)
                return false
            }

            return true
        },
        [acceptedFormats, maxSizeMB]
    )

    const handleFile = useCallback(
        (file: File) => {
            if (validateFile(file)) {
                setSelectedFile(file)
                onFileSelect(file)
            }
        },
        [validateFile, onFileSelect]
    )

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const files = Array.from(e.dataTransfer.files)
            if (files.length > 0) {
                handleFile(files[0])
            }
        },
        [handleFile]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                handleFile(files[0])
            }
        },
        [handleFile]
    )

    const handleClear = useCallback(() => {
        setSelectedFile(null)
        setError(null)
    }, [])

    return (
        <Card className={className}>
            <div
                className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-base-300 hover:border-primary/50'
                    }
          ${error ? 'border-error' : ''}
        `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {!selectedFile ? (
                    <>
                        <Icon
                            name="upload_file"
                            size="xl"
                            className={`mb-4 ${isDragging ? 'text-primary' : 'text-base-content/50'}`}
                        />
                        <h3 className="text-xl font-semibold mb-2">
                            {isDragging ? 'Drop your file here' : 'Upload Dataset'}
                        </h3>
                        <p className="text-base-content/70 mb-4">
                            Drag and drop your CSV or Excel file here, or click to browse
                        </p>
                        <label htmlFor="file-input">
                            <Button
                                variant="primary"
                                icon="folder_open"
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                Choose File
                            </Button>
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            accept={acceptedFormats.join(',')}
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        <p className="text-xs text-base-content/50 mt-4">
                            Accepted formats: {acceptedFormats.join(', ')} • Max size: {maxSizeMB}MB
                        </p>
                    </>
                ) : (
                    <>
                        <Icon name="check_circle" size="xl" className="text-success mb-4" />
                        <h3 className="text-xl font-semibold mb-2">File Selected</h3>
                        <div className="bg-base-200 rounded-lg p-4 mb-4 inline-block">
                            <div className="flex items-center gap-3">
                                <Icon name="description" className="text-primary" />
                                <div className="text-left">
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-base-content/70">
                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button variant="ghost" icon="close" onClick={handleClear}>
                                Remove
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="alert alert-error mt-4">
                    <Icon name="error" />
                    <span>{error}</span>
                </div>
            )}
        </Card>
    )
}

export default FileUploader
