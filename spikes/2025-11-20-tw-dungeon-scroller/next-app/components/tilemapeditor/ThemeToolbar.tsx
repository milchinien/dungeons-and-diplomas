'use client';

import { useState } from 'react';
import type { TileTheme } from '@/lib/tiletheme/types';
import type { ValidationResult } from '@/lib/tiletheme/ThemeValidator';

interface ThemeToolbarProps {
  themeName: string;
  onThemeNameChange: (name: string) => void;
  onNew: () => void;
  onSave: () => void;
  onLoad: (id: number) => void;
  themes: TileTheme[];
  isDirty: boolean;
  validationResult: ValidationResult | null;
  isLoading: boolean;
}

export function ThemeToolbar({
  themeName,
  onThemeNameChange,
  onNew,
  onSave,
  onLoad,
  themes,
  isDirty,
  validationResult,
  isLoading
}: ThemeToolbarProps) {
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);

  const isValid = validationResult?.isValid ?? false;
  const missingCount = validationResult?.missingSlots.length ?? 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
      {/* Title */}
      <h1 className="text-lg font-bold text-white">TileTheme Editor</h1>

      {/* Theme name input */}
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm">Theme:</label>
        <input
          type="text"
          value={themeName}
          onChange={(e) => onThemeNameChange(e.target.value)}
          placeholder="Theme Name"
          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-40"
        />
        {isDirty && <span className="text-yellow-500 text-sm">*</span>}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {/* New */}
        <button
          onClick={onNew}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          Neu
        </button>

        {/* Load dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLoadDropdown(!showLoadDropdown)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
          >
            Laden
          </button>
          {showLoadDropdown && themes.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 min-w-40">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onLoad(theme.id);
                    setShowLoadDropdown(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-white text-sm hover:bg-gray-600"
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isLoading || !themeName}
          className={`px-3 py-1 text-white text-sm rounded ${
            isLoading || !themeName
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Speichern...' : 'Speichern'}
        </button>

        {/* Validation status */}
        <div
          className={`px-3 py-1 rounded text-sm ${
            isValid
              ? 'bg-green-800 text-green-200'
              : 'bg-red-800 text-red-200'
          }`}
          title={
            validationResult
              ? isValid
                ? 'Theme ist vollständig'
                : `Fehlende Slots: ${validationResult.missingSlots.join(', ')}`
              : 'Kein Theme geladen'
          }
        >
          {isValid ? 'Valid' : `${missingCount} fehlt`}
        </div>
      </div>
    </div>
  );
}
