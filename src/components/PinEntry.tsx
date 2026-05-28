import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, X, Delete } from 'lucide-react';

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

const PinEntry: React.FC<PinEntryProps> = ({ onSubmit, onCancel, error }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);

  const handleNumberClick = useCallback((num: number) => {
    setPin(prev => {
      const emptyIndex = prev.findIndex(d => d === '');
      if (emptyIndex === -1) return prev;
      const newPin = [...prev];
      newPin[emptyIndex] = num.toString();
      // Auto-submit when all 4 digits entered
      if (emptyIndex === 3) {
        setTimeout(() => onSubmit(newPin.join('')), 100);
      }
      return newPin;
    });
  }, [onSubmit]);

  const handleBackspace = useCallback(() => {
    setPin(prev => {
      const lastFilledIndex = prev.map((d, i) => d ? i : -1).filter(i => i !== -1).pop();
      if (lastFilledIndex === undefined || lastFilledIndex < 0) return prev;
      const newPin = [...prev];
      newPin[lastFilledIndex] = '';
      return newPin;
    });
  }, []);

  // Clear on error
  React.useEffect(() => {
    if (error) setPin(['', '', '', '']);
  }, [error]);

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-superflix-primary/20 mb-4">
          <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-superflix-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Digite o PIN</h2>
        <p className="text-superflix-text-muted text-sm sm:text-base mt-2">
          Este perfil é protegido por PIN
        </p>
      </div>
      
      {/* PIN Display - divs instead of inputs to prevent mobile keyboard */}
      <div className="flex justify-center mb-6 gap-3 sm:gap-4">
        {pin.map((digit, index) => (
          <div
            key={index}
            className={`h-14 w-12 sm:h-16 sm:w-14 flex items-center justify-center rounded-lg border-2 transition-all ${
              digit 
                ? 'border-superflix-primary bg-superflix-dark' 
                : 'border-gray-700 bg-superflix-dark'
            }`}
          >
            {digit && <div className="w-3 h-3 bg-white rounded-full"></div>}
          </div>
        ))}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-center mb-4 text-sm sm:text-base font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}
      
      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 max-w-[280px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            type="button"
            variant="outline"
            className="h-14 sm:h-16 text-xl sm:text-2xl font-medium bg-superflix-dark border-gray-700 hover:bg-superflix-primary/20 hover:border-superflix-primary transition-all"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        
        <div className="h-14 sm:h-16"></div>
        
        <Button
          type="button"
          variant="outline"
          className="h-14 sm:h-16 text-xl sm:text-2xl font-medium bg-superflix-dark border-gray-700 hover:bg-superflix-primary/20 hover:border-superflix-primary transition-all"
          onClick={() => handleNumberClick(0)}
        >
          0
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="h-14 sm:h-16 bg-superflix-dark border-gray-700 hover:bg-red-500/20 hover:border-red-500 transition-all"
          onClick={handleBackspace}
          aria-label="Apagar"
        >
          <Delete className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
      
      {/* Cancel Button */}
      <div className="flex justify-center pt-2">
        <Button 
          type="button" 
          variant="ghost" 
          className="text-superflix-text-muted hover:text-white"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default PinEntry;
