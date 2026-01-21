import React, { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import { compressImage } from '@/utils/image';

interface ImageUploaderProps {
    value?: string;
    onChange: (value: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | undefined>(value);

    // Update preview if value changes externally
    React.useEffect(() => {
        setPreview(value);
    }, [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Compress image
            try {
                const compressedBase64 = await compressImage(file);
                setPreview(compressedBase64);
                onChange(compressedBase64);
            } catch (error) {
                console.error('Error compressing image:', error);
                alert('Erro ao processar imagem. Tente outra.');
            }
        }
    };

    const handleRemove = () => {
        setPreview(undefined);
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-gray-700">Foto do Produto</label>
            <div className="flex items-center gap-4">
                {preview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium text-sm"
                        >
                            Remover
                        </button>
                    </div>
                ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                        <span className="text-sm">Sem Imagem</span>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Escolher Imagem
                    </Button>
                    <p className="text-xs text-gray-500">Max 2MB. JPG, PNG</p>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default ImageUploader;
