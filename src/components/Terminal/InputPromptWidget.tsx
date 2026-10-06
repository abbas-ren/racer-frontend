// src/components/WebCLIModal/prompts/InputPromptWidget.tsx - NEW FILE

import React, { useState, useEffect, useRef } from 'react';
import { PromptRequest, PromptType } from './types';
import './InputPromptWidget.css';

interface InputPromptWidgetProps {
  prompt: PromptRequest;
  onResponse: (value: any) => void;
  onCancel: () => void;
}

export const InputPromptWidget: React.FC<InputPromptWidgetProps> = ({
  prompt,
  onResponse,
  onCancel,
}) => {
  switch (prompt.type) {
    case PromptType.SELECT:
      return (
        <SelectPrompt
          prompt={prompt}
          onResponse={onResponse}
          onCancel={onCancel}
        />
      );
    case PromptType.MULTI_SELECT:
      return (
        <MultiSelectPrompt
          prompt={prompt}
          onResponse={onResponse}
          onCancel={onCancel}
        />
      );
    case PromptType.INPUT:
      return (
        <InputPrompt
          prompt={prompt}
          onResponse={onResponse}
          onCancel={onCancel}
        />
      );
    case PromptType.CONFIRM:
      return (
        <ConfirmPrompt
          prompt={prompt}
          onResponse={onResponse}
          onCancel={onCancel}
        />
      );
    default:
      return null;
  }
};

// SELECT PROMPT
const SelectPrompt: React.FC<{
  prompt: any;
  onResponse: (value: any) => void;
  onCancel: () => void;
}> = ({ prompt, onResponse, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prompt.choices.length - 1, prev + 1),
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onResponse(prompt.choices[selectedIndex].value);
      } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
        e.preventDefault();
        onCancel();
      }
      // Number key shortcuts
      else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < prompt.choices.length) {
          e.preventDefault();
          onResponse(prompt.choices[index].value);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, prompt.choices, onResponse, onCancel]);

  return (
    <div className="input-prompt-widget">
      <div className="prompt-choices-list">
        {prompt.choices.map((choice: any, index: number) => (
          <div
            key={index}
            className={`prompt-choice ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onResponse(choice.value)}
          >
            <span className="choice-marker">
              {index === selectedIndex ? '>' : ' '}
            </span>
            <span className="choice-number">{index + 1})</span>
            <span className="choice-label">{choice.label}</span>
            {choice.description && (
              <span className="choice-desc"> - {choice.description}</span>
            )}
          </div>
        ))}
      </div>
      <div className="prompt-hint">
        ↑↓/jk to navigate • 1-9 to select • Enter to confirm • Esc to cancel
      </div>
    </div>
  );
};

// MULTI SELECT PROMPT
const MultiSelectPrompt: React.FC<{
  prompt: any;
  onResponse: (value: any) => void;
  onCancel: () => void;
}> = ({ prompt, onResponse, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prompt.choices.length - 1, prev + 1),
        );
      } else if (e.key === ' ') {
        e.preventDefault();
        setSelected((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(selectedIndex)) {
            newSet.delete(selectedIndex);
          } else {
            newSet.add(selectedIndex);
          }
          return newSet;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selected.size === 0 && prompt.min && prompt.min > 0) {
          return;
        }
        const values = Array.from(selected).map((i) => prompt.choices[i].value);
        onResponse(values);
      } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const allIndices: any = new Set(
          prompt.choices.map((_: any, i: number) => i),
        );
        setSelected(allIndices);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setSelected(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIndex,
    selected,
    prompt.choices,
    prompt.min,
    onResponse,
    onCancel,
  ]);

  return (
    <div className="input-prompt-widget">
      <div className="prompt-choices-list">
        {prompt.choices.map((choice: any, index: number) => (
          <div
            key={index}
            className={`prompt-choice ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => {
              setSelected((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(index)) {
                  newSet.delete(index);
                } else {
                  newSet.add(index);
                }
                return newSet;
              });
            }}
          >
            <span className="choice-marker">
              {index === selectedIndex ? '>' : ' '}
            </span>
            <span className="choice-checkbox">
              {selected.has(index) ? '[x]' : '[ ]'}
            </span>
            <span className="choice-label">{choice.label}</span>
            {choice.description && (
              <span className="choice-desc"> - {choice.description}</span>
            )}
          </div>
        ))}
      </div>
      <div className="prompt-hint">
        Space to toggle • a/n for all/none • Enter to confirm • Selected:{' '}
        {selected.size}
      </div>
    </div>
  );
};

// INPUT PROMPT
const InputPrompt: React.FC<{
  prompt: any;
  onResponse: (value: any) => void;
  onCancel: () => void;
}> = ({ prompt, onResponse, onCancel }) => {
  const [value, setValue] = useState(prompt.default || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim() || prompt.default) {
      onResponse(value || prompt.default);
    }
  };

  return (
    <div className="input-prompt-widget">
      <div className="prompt-input-line">
        <span className="input-prefix">:</span>
        <input
          ref={inputRef}
          type="text"
          className="prompt-text-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
              e.preventDefault();
              onCancel();
            }
          }}
          placeholder={prompt.placeholder}
        />
      </div>
      <div className="prompt-hint">Enter to submit • Esc to cancel</div>
    </div>
  );
};

// CONFIRM PROMPT
const ConfirmPrompt: React.FC<{
  prompt: any;
  onResponse: (value: any) => void;
  onCancel: () => void;
}> = ({ prompt, onResponse, onCancel }) => {
  const [selected, setSelected] = useState(prompt.default ?? true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'h' ||
        e.key === 'l'
      ) {
        e.preventDefault();
        setSelected((prev: any) => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onResponse(selected);
      } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onResponse(true);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onResponse(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selected, onResponse, onCancel]);

  return (
    <div className="input-prompt-widget">
      <div className="prompt-confirm-options">
        <span className={`confirm-choice ${selected ? 'selected' : ''}`}>
          {selected ? '[Y]' : ' y '}
        </span>
        <span className="confirm-separator">/</span>
        <span className={`confirm-choice ${!selected ? 'selected' : ''}`}>
          {!selected ? '[N]' : ' n '}
        </span>
      </div>
      <div className="prompt-hint">y/n or ←→ to choose • Enter to confirm</div>
    </div>
  );
};
