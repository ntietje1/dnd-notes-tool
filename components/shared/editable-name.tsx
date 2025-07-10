"use client";

import { useRef, useState, useEffect } from "react";

interface EditableNameProps {
  initialName: string;
  defaultName: string;
  isRenaming: boolean;
  onFinishRename: (name: string) => void;
}

export function EditableName({
  initialName,
  defaultName,
  isRenaming,
  onFinishRename,
}: EditableNameProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName || defaultName);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  if (isRenaming) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={() => onFinishRename(name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onFinishRename(name);
          } else if (e.key === "Escape") {
            setName(initialName || defaultName);
            onFinishRename(initialName || defaultName);
          }
          // Prevent space from triggering button click
          if (e.key === " ") {
            e.stopPropagation();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-transparent border-none w-full focus:outline-none focus:ring-0 text-sm"
      />
    );
  }

  return <span className="truncate">{initialName || defaultName}</span>;
}
