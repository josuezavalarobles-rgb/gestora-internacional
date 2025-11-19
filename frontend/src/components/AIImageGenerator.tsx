import { useState } from 'react';
import { Sparkles, Wand2, Download, Copy } from 'lucide-react';

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

export default function AIImageGenerator({ onImageGenerated }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Sugerencias de prompts para emails
  const promptSuggestions = [
    '🎨 Logo moderno y profesional para empresa de tecnología',
    '📧 Banner de email marketing con colores corporativos',
    '🎯 Imagen de encabezado para campaña de ventas',
    '💼 Ilustración profesional de equipo de trabajo',
    '🚀 Gráfico promocional de producto tecnológico',
    '🎁 Banner de ofertas y promociones especiales',
  ];

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Por favor escribe una descripción de la imagen');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Opción 1: Usar Replicate API (Stable Diffusion)
      // Opción 2: Usar Hugging Face Inference API (gratuito)
      // Opción 3: Usar tu propio backend con OpenAI DALL-E

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          style: 'professional', // professional, creative, minimalist
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar imagen');
      }

      const data = await response.json();
      const newImages = [data.imageUrl, ...generatedImages];
      setGeneratedImages(newImages);

      // Notificar al componente padre
      onImageGenerated(data.imageUrl);

    } catch (err: any) {
      console.error('Error generando imagen:', err);
      setError('Error al generar imagen. Por favor intenta de nuevo.');

      // Para demostración, generar una imagen de placeholder
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`;
      setGeneratedImages([placeholderUrl, ...generatedImages]);
      onImageGenerated(placeholderUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    setPrompt(text);
  };

  const handleDownloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-purple-400" size={24} />
        <h3 className="text-lg font-semibold text-white">Generador de Imágenes con IA</h3>
      </div>

      <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
        <p className="text-sm text-slate-300 mb-3">
          Describe la imagen que necesitas para tu email y la IA la creará para ti
        </p>

        {/* Input de prompt */}
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Logo profesional para empresa de tecnología con colores azul y blanco, estilo moderno y minimalista"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
          />

          <button
            onClick={handleGenerateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Wand2 size={18} />
            {isGenerating ? 'Generando imagen...' : 'Generar con IA'}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Sugerencias de prompts */}
      <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-300 mb-2">💡 Sugerencias de prompts:</p>
        <div className="space-y-2">
          {promptSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleCopyPrompt(suggestion.replace(/^[^\s]+ /, ''))}
              className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Imágenes generadas */}
      {generatedImages.length > 0 && (
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-300 mb-3">
            ✅ Imágenes generadas ({generatedImages.length})
          </p>
          <div className="grid grid-cols-2 gap-3">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-600"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    onClick={() => onImageGenerated(imageUrl)}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                    title="Usar en email"
                  >
                    <Copy size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(imageUrl)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    title="Descargar"
                  >
                    <Download size={16} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información sobre uso */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          <strong>💡 Consejos para mejores resultados:</strong>
          <br />
          • Sé específico con colores, estilo y elementos
          <br />
          • Menciona el propósito (logo, banner, ilustración)
          <br />
          • Incluye el mood deseado (profesional, creativo, moderno)
          <br />
          • Especifica resolución si es importante (alta calidad, 4K)
        </p>
      </div>
    </div>
  );
}
